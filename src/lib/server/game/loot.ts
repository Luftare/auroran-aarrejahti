import { and, eq } from 'drizzle-orm';
import { db, tables } from '../db';
import { distanceM, inRange } from '$lib/geo';
import { getSetting } from '../settings';
import { dayDiff, helsinkiToday } from '../time';
import { coinBalance } from '../users';

export type LootResult =
	| { ok: true; coinCount: number; coins: number; streak: number; isFirstLootToday: boolean }
	| { ok: false; code: 'CHEST_EXPIRED' | 'ALREADY_LOOTED' | 'TOO_FAR'; distance?: number };

export async function lootChest(
	userId: string,
	chestId: string,
	pos: { lat: number; lng: number; accuracy: number }
): Promise<LootResult> {
	const today = helsinkiToday();

	const chestRows = await db
		.select({ chest: tables.chests, point: tables.spawnPoints })
		.from(tables.chests)
		.innerJoin(tables.spawnPoints, eq(tables.chests.spawnPointId, tables.spawnPoints.id))
		.where(eq(tables.chests.id, chestId));
	const row = chestRows[0];
	if (!row || row.chest.day !== today) return { ok: false, code: 'CHEST_EXPIRED' };

	const already = await db
		.select({ id: tables.loots.id })
		.from(tables.loots)
		.where(and(eq(tables.loots.userId, userId), eq(tables.loots.chestId, chestId)));
	if (already.length > 0) return { ok: false, code: 'ALREADY_LOOTED' };

	const distance = distanceM(pos.lat, pos.lng, row.point.lat, row.point.lng);
	const radius = await getSetting('loot_radius_m');
	if (!inRange(distance, radius, pos.accuracy)) {
		return { ok: false, code: 'TOO_FAR', distance: Math.round(distance) };
	}

	const userRows = await db.select().from(tables.users).where(eq(tables.users.id, userId));
	const user = userRows[0];
	if (!user) return { ok: false, code: 'CHEST_EXPIRED' };

	const isFirstLootToday = user.lastLootDay !== today;

	// Streak bookkeeping for the first loot of the day.
	let streakUpdate: Partial<typeof tables.users.$inferInsert> = {};
	let newStreak = user.streakCurrent;
	if (isFirstLootToday) {
		const gap = user.lastLootDay ? dayDiff(user.lastLootDay, today) : null;
		if (gap === 1) {
			newStreak = user.streakCurrent + 1;
			streakUpdate = { streakCurrent: newStreak };
		} else {
			// Streak broke (or first ever loot). Park the old streak when it is
			// still inside the 3-day restore window.
			const missed = gap == null ? null : gap - 1;
			const parkable = missed != null && missed >= 1 && missed <= 3 && user.streakCurrent > 0;
			newStreak = 1;
			streakUpdate = {
				streakCurrent: 1,
				streakPrevious: parkable ? user.streakCurrent : 0,
				streakBrokenLastDay: parkable ? user.lastLootDay : null
			};
		}
		streakUpdate.lastLootDay = today;
		streakUpdate.streakBest = Math.max(user.streakBest, newStreak);
	}

	try {
		await db.transaction(async (tx) => {
			const loot = await tx
				.insert(tables.loots)
				.values({
					userId,
					chestId,
					day: today,
					lat: pos.lat,
					lng: pos.lng,
					accuracyM: pos.accuracy
				})
				.returning({ id: tables.loots.id });
			await tx.insert(tables.coinTransactions).values({
				userId,
				amount: row.chest.coinCount,
				kind: 'loot',
				refId: loot[0].id
			});
			if (isFirstLootToday) {
				await tx
					.update(tables.users)
					.set({ ...streakUpdate, updatedAt: new Date() })
					.where(eq(tables.users.id, userId));
			}
		});
	} catch {
		// unique(user_id, chest_id) lost a race with a double-tap
		return { ok: false, code: 'ALREADY_LOOTED' };
	}

	return {
		ok: true,
		coinCount: row.chest.coinCount,
		coins: await coinBalance(userId),
		streak: newStreak,
		isFirstLootToday
	};
}
