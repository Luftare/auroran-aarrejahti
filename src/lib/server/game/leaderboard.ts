import { count, desc, eq, sql } from 'drizzle-orm';
import { db, tables } from '../db';
import { effectiveStreak } from './streak';
import { helsinkiToday } from '../time';

export type LeaderboardRow = {
	rank: number;
	userId: string;
	displayName: string;
	isGhost: boolean;
	loots: number;
	streak: number;
	isMe: boolean;
};

export async function leaderboard(
	period: 'all' | 'today',
	meId: string | null
): Promise<LeaderboardRow[]> {
	const dayFilter = period === 'today' ? eq(tables.loots.day, helsinkiToday()) : undefined;

	const rows = await db
		.select({
			userId: tables.users.id,
			displayName: tables.users.displayName,
			kind: tables.users.kind,
			streakCurrent: tables.users.streakCurrent,
			lastLootDay: tables.users.lastLootDay,
			loots: count(tables.loots.id),
			lastLootAt: sql<string>`max(${tables.loots.lootedAt})`
		})
		.from(tables.loots)
		.innerJoin(tables.users, eq(tables.loots.userId, tables.users.id))
		.where(dayFilter)
		.groupBy(
			tables.users.id,
			tables.users.displayName,
			tables.users.kind,
			tables.users.streakCurrent,
			tables.users.lastLootDay
		)
		.orderBy(desc(count(tables.loots.id)), sql`max(${tables.loots.lootedAt}) asc`);

	const board = rows.map((r, i) => ({
		rank: i + 1,
		userId: r.userId,
		displayName: r.displayName,
		isGhost: r.kind === 'ghost',
		loots: r.loots,
		streak: effectiveStreak({ streakCurrent: r.streakCurrent, lastLootDay: r.lastLootDay }),
		isMe: r.userId === meId
	}));

	// Top 50 plus the caller's own row when it falls outside.
	const top = board.slice(0, 50);
	const mine = board.find((r) => r.isMe);
	if (mine && !top.includes(mine)) top.push(mine);
	return top;
}
