import { eq } from 'drizzle-orm';
import { db, tables } from './db';
import { coinBalance, lootTotal } from './users';
import { computeRestoreOffer, effectiveStreak, type RestoreOffer } from './game/streak';
import { helsinkiToday } from './time';

export type MePayload = {
	id: string;
	kind: 'ghost' | 'registered';
	displayName: string;
	email: string | null;
	emailVerified: boolean;
	isAdmin: boolean;
	coins: number;
	loots: number;
	streak: number;
	streakBest: number;
	lootedToday: boolean;
	restoreOffer: RestoreOffer | null;
};

export async function mePayload(userId: string): Promise<MePayload | null> {
	const rows = await db.select().from(tables.users).where(eq(tables.users.id, userId));
	const user = rows[0];
	if (!user) return null;
	return {
		id: user.id,
		kind: user.kind,
		displayName: user.displayName,
		email: user.email,
		emailVerified: user.emailVerifiedAt != null,
		isAdmin: user.isAdmin,
		coins: await coinBalance(user.id),
		loots: await lootTotal(user.id),
		streak: effectiveStreak(user),
		streakBest: user.streakBest,
		lootedToday: user.lastLootDay === helsinkiToday(),
		restoreOffer: computeRestoreOffer(user)
	};
}
