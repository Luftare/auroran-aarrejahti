// Game state: collected chests, streak, and total balance. All data lives
// in IndexedDB on this device — there is no server.

import { idbGet, idbSet } from '$lib/client/storage';
import { GEM_ORDER, type GemKind } from '$lib/components/gems3d';
import { currentDay, dailySlots, type Chest } from './chests';

type Persisted = {
	/** Day → ids of looted slots. Old days are cleaned up. */
	lootedByDay: Record<string, string[]>;
	streakCurrent: number;
	lastLootDay: string | null;
	totalCollected: number;
	/** Collected gems by kind. */
	gems: Partial<Record<GemKind, number>>;
};

const KEY = 'pelitila';
const EMPTY: Persisted = {
	lootedByDay: {},
	streakCurrent: 0,
	lastLootDay: null,
	totalCollected: 0,
	gems: {}
};

export type Loot = Partial<Record<GemKind, number>>;
export type CollectResult = { firstToday: boolean; loot: Loot };

/**
 * Drop probabilities by rarity — the most common over half,
 * the rarest 0.1%. They sum to 1.
 */
const DROP_RATES: [GemKind, number][] = [
	['harmaa', 0.55],
	['vihrea', 0.25],
	['sininen', 0.12],
	['violetti', 0.054],
	['oranssi', 0.025],
	['punainen', 0.001]
];

export function rollGem(): GemKind {
	const r = Math.random();
	let acc = 0;
	for (const [kind, rate] of DROP_RATES) {
		acc += rate;
		if (r < acc) return kind;
	}
	return GEM_ORDER[0];
}

/** Rolls each gem independently — with a multiplier the loot can be mixed. */
export function rollLoot(count: number): Loot {
	const loot: Loot = {};
	for (let i = 0; i < count; i++) {
		const gem = rollGem();
		loot[gem] = (loot[gem] ?? 0) + 1;
	}
	return loot;
}

export const game = $state<{
	ready: boolean;
	day: string;
	chests: Chest[];
	streak: number;
	total: number;
	gems: Partial<Record<GemKind, number>>;
}>({ ready: false, day: '', chests: [], streak: 0, total: 0, gems: {} });

let persisted: Persisted = { ...EMPTY };

function isYesterday(day: string, today: string): boolean {
	const d = new Date(`${day}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString().slice(0, 10) === today;
}

/** Displayed streak: a collection yesterday or today keeps it alive. */
function effectiveStreak(p: Persisted, today: string): number {
	if (!p.lastLootDay) return 0;
	if (p.lastLootDay === today || isYesterday(p.lastLootDay, today)) return p.streakCurrent;
	return 0;
}

function buildDay(today: string): void {
	const looted = new Set(persisted.lootedByDay[today] ?? []);
	game.day = today;
	game.chests = dailySlots(today).map((s) => ({ ...s, looted: looted.has(s.id) }));
	game.streak = effectiveStreak(persisted, today);
	game.total = persisted.totalCollected;
	game.gems = { ...persisted.gems };
}

async function persist(): Promise<void> {
	// Keep only recent days — old ones have no use
	const keep: Record<string, string[]> = {};
	for (const [day, ids] of Object.entries(persisted.lootedByDay)) {
		if (day >= persisted.lastLootDay! || day === game.day) keep[day] = ids;
	}
	persisted.lootedByDay = keep;
	await idbSet(KEY, JSON.stringify(persisted));
}

export async function initGame(): Promise<void> {
	try {
		const raw = await idbGet(KEY);
		if (raw) persisted = { ...EMPTY, ...(JSON.parse(raw) as Persisted) };
	} catch {
		persisted = { ...EMPTY };
	}
	buildDay(currentDay());
	game.ready = true;
}

/** The day may have changed while the app was open (or in the background). */
export function refreshDay(): void {
	const today = currentDay();
	if (today !== game.day) buildDay(today);
}

/**
 * Collects a chest: marks the slot as looted, increments the balance, extends
 * the streak, and rolls and stores the loot. The multiplier earned by tapping
 * (x1–x5) sets the number of rolls — each gem is rolled independently, so the
 * loot can be mixed. Returns whether this was the day's first collection and the loot.
 */
export async function collectChest(id: string, multiplier = 1): Promise<CollectResult> {
	const count = Math.max(1, Math.min(5, Math.round(multiplier)));
	const loot = rollLoot(count);
	const chest = game.chests.find((c) => c.id === id);
	if (!chest || chest.looted) return { firstToday: false, loot };

	const today = game.day;
	chest.looted = true;
	persisted.lootedByDay[today] = [...(persisted.lootedByDay[today] ?? []), id];
	persisted.totalCollected += 1;
	for (const [gem, n] of Object.entries(loot) as [GemKind, number][]) {
		persisted.gems[gem] = (persisted.gems[gem] ?? 0) + n;
	}

	const firstToday = persisted.lastLootDay !== today;
	if (firstToday) {
		persisted.streakCurrent =
			persisted.lastLootDay && isYesterday(persisted.lastLootDay, today)
				? persisted.streakCurrent + 1
				: 1;
		persisted.lastLootDay = today;
	}

	game.streak = persisted.streakCurrent;
	game.total = persisted.totalCollected;
	game.gems = { ...persisted.gems };
	await persist();
	return { firstToday, loot };
}
