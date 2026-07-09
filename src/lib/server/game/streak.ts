import { eq } from 'drizzle-orm';
import { db, tables } from '../db';
import { addDays, dayDiff, helsinkiToday } from '../time';
import { coinBalance } from '../users';

export const RESTORE_COST: Record<number, number> = { 1: 50, 2: 150, 3: 300 };

type UserRow = typeof tables.users.$inferSelect;

export type RestoreOffer = {
	missedDays: number;
	cost: number;
	/** streak value after restore (and after today's loot, when already looted) */
	restoresTo: number;
};

/**
 * The streak shown to the player: the stored value, or 0 when days have been
 * missed and today's loot hasn't yet restarted it.
 */
export function effectiveStreak(user: Pick<UserRow, 'streakCurrent' | 'lastLootDay'>): number {
	if (!user.lastLootDay) return 0;
	return dayDiff(user.lastLootDay, helsinkiToday()) <= 1 ? user.streakCurrent : 0;
}

/**
 * A streak is restorable for up to 3 missed days, priced by the number of
 * missed days (50/150/300). Two shapes:
 *  A) the player hasn't looted since the break — gap measured from last_loot_day;
 *  B) the player already looted after the break (loot parked the old streak in
 *     streak_previous / streak_broken_last_day) — window measured from the
 *     parked break day.
 */
export function computeRestoreOffer(user: UserRow, today = helsinkiToday()): RestoreOffer | null {
	// B: old streak parked by a post-break loot
	if (user.streakPrevious > 0 && user.streakBrokenLastDay) {
		// The new streak runs streakCurrent consecutive days ending at lastLootDay,
		// so the missed gap ends where that new streak began.
		const firstLootAfterBreak =
			user.lastLootDay && user.streakCurrent > 0
				? addDays(user.lastLootDay, -(user.streakCurrent - 1))
				: null;
		const missed = firstLootAfterBreak
			? dayDiff(user.streakBrokenLastDay, firstLootAfterBreak) - 1
			: 0;
		const windowDays = dayDiff(user.streakBrokenLastDay, today) - 1;
		if (missed >= 1 && missed <= 3 && windowDays <= 3) {
			return {
				missedDays: missed,
				cost: RESTORE_COST[missed],
				restoresTo: user.streakPrevious + missed + user.streakCurrent
			};
		}
		return null;
	}
	// A: no loot since the break
	if (!user.lastLootDay || user.streakCurrent === 0) return null;
	const missed = dayDiff(user.lastLootDay, today) - 1;
	if (missed >= 1 && missed <= 3) {
		return { missedDays: missed, cost: RESTORE_COST[missed], restoresTo: user.streakCurrent + missed };
	}
	return null;
}

export type RestoreResult =
	| { ok: true; streak: number; coins: number }
	| { ok: false; code: 'NOT_RESTORABLE' | 'INSUFFICIENT_COINS' };

export async function purchaseRestore(userId: string): Promise<RestoreResult> {
	const today = helsinkiToday();
	const rows = await db.select().from(tables.users).where(eq(tables.users.id, userId));
	const user = rows[0];
	if (!user) return { ok: false, code: 'NOT_RESTORABLE' };

	const offer = computeRestoreOffer(user, today);
	if (!offer) return { ok: false, code: 'NOT_RESTORABLE' };

	const balance = await coinBalance(userId);
	if (balance < offer.cost) return { ok: false, code: 'INSUFFICIENT_COINS' };

	await db.transaction(async (tx) => {
		const restore = await tx
			.insert(tables.streakRestores)
			.values({
				userId,
				missedDays: offer.missedDays,
				cost: offer.cost,
				restoredStreakTo: offer.restoresTo
			})
			.returning({ id: tables.streakRestores.id });
		await tx.insert(tables.coinTransactions).values({
			userId,
			amount: -offer.cost,
			kind: 'streak_restore',
			refId: restore[0].id
		});
		const lootedSinceBreak = user.streakPrevious > 0 && user.streakBrokenLastDay != null;
		await tx
			.update(tables.users)
			.set({
				streakCurrent: offer.restoresTo,
				streakBest: Math.max(user.streakBest, offer.restoresTo),
				// Not yet looted since the break: pretend yesterday was played so
				// today's loot continues the streak.
				lastLootDay: lootedSinceBreak ? user.lastLootDay : addDays(today, -1),
				streakPrevious: 0,
				streakBrokenLastDay: null,
				updatedAt: new Date()
			})
			.where(eq(tables.users.id, userId));
	});

	return { ok: true, streak: offer.restoresTo, coins: balance - offer.cost };
}
