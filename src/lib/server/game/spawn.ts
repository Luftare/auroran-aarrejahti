import { and, eq, inArray } from 'drizzle-orm';
import { db, tables } from '../db';
import { getSetting } from '../settings';
import { addDays, helsinkiToday } from '../time';

// Steep rarity curve: 3 coins is common, 10 a ~1-in-100 event.
const COIN_WEIGHTS: Array<[coins: number, weight: number]> = [
	[3, 40], [4, 24], [5, 14], [6, 9], [7, 6], [8, 4], [9, 2], [10, 1]
];

export function rollCoinCount(random: () => number = Math.random): number {
	const total = COIN_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
	let roll = random() * total;
	for (const [coins, weight] of COIN_WEIGHTS) {
		roll -= weight;
		if (roll < 0) return coins;
	}
	return 3;
}

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

/**
 * Idempotently creates the day's chests. Called by the midnight cron and
 * lazily from the today-chests endpoint, so a missed tick self-heals.
 */
export async function ensureChestsForDay(day = helsinkiToday()): Promise<void> {
	const existing = await db
		.select({ id: tables.chests.id })
		.from(tables.chests)
		.where(eq(tables.chests.day, day));
	if (existing.length > 0) return;

	const active = await db
		.select()
		.from(tables.spawnPoints)
		.where(eq(tables.spawnPoints.active, true));
	if (active.length === 0) return;

	const wanted = Math.min(await getSetting('daily_chest_count'), active.length);

	// Vary the route: avoid yesterday's exact points when the pool allows.
	const yesterdays = await db
		.select({ spawnPointId: tables.chests.spawnPointId })
		.from(tables.chests)
		.where(eq(tables.chests.day, addDays(day, -1)));
	const usedYesterday = new Set(yesterdays.map((c) => c.spawnPointId));
	const fresh = active.filter((p) => !usedYesterday.has(p.id));
	const pool = fresh.length >= wanted ? fresh : active;

	const picked = shuffle(pool).slice(0, wanted);
	await db
		.insert(tables.chests)
		.values(picked.map((p) => ({ day, spawnPointId: p.id, coinCount: rollCoinCount() })))
		.onConflictDoNothing();
}

/** Admin escape hatch: regenerate today only while nobody has looted yet. */
export async function respawnToday(): Promise<{ ok: boolean }> {
	const day = helsinkiToday();
	const todaysChests = await db
		.select({ id: tables.chests.id })
		.from(tables.chests)
		.where(eq(tables.chests.day, day));
	if (todaysChests.length > 0) {
		const ids = todaysChests.map((c) => c.id);
		const looted = await db
			.select({ id: tables.loots.id })
			.from(tables.loots)
			.where(inArray(tables.loots.chestId, ids));
		if (looted.length > 0) return { ok: false };
		await db.delete(tables.chests).where(and(eq(tables.chests.day, day)));
	}
	await ensureChestsForDay(day);
	return { ok: true };
}
