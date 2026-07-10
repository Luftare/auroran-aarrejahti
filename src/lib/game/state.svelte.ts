// Pelitila: kerätyt arkut, putki ja kokonaissaldo. Kaikki data elää
// IndexedDB:ssä tällä laitteella — palvelinta ei ole.

import { idbGet, idbSet } from '$lib/client/storage';
import { currentDay, dailySlots, type Chest } from './chests';

type Persisted = {
	/** Päivä → kerättyjen slottien id:t. Vanhat päivät siivotaan pois. */
	lootedByDay: Record<string, string[]>;
	streakCurrent: number;
	lastLootDay: string | null;
	totalCollected: number;
};

const KEY = 'pelitila';
const EMPTY: Persisted = { lootedByDay: {}, streakCurrent: 0, lastLootDay: null, totalCollected: 0 };

export const game = $state<{
	ready: boolean;
	day: string;
	chests: Chest[];
	streak: number;
	total: number;
}>({ ready: false, day: '', chests: [], streak: 0, total: 0 });

let persisted: Persisted = { ...EMPTY };

function isYesterday(day: string, today: string): boolean {
	const d = new Date(`${day}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString().slice(0, 10) === today;
}

/** Näytettävä putki: eilinen tai tämänpäiväinen keräys pitää sen elossa. */
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
}

async function persist(): Promise<void> {
	// Vain tuoreet päivät talteen — vanhoilla ei ole käyttöä
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

/** Päivä on voinut vaihtua sovelluksen ollessa auki (tai taustalla). */
export function refreshDay(): void {
	const today = currentDay();
	if (today !== game.day) buildDay(today);
}

/**
 * Kerää arkun: merkitsee slotin kerätyksi, kasvattaa saldoa ja jatkaa putkea.
 * Palauttaa true, jos tämä oli päivän ensimmäinen keräys (putki karttui).
 */
export async function collectChest(id: string): Promise<boolean> {
	const chest = game.chests.find((c) => c.id === id);
	if (!chest || chest.looted) return false;

	const today = game.day;
	chest.looted = true;
	persisted.lootedByDay[today] = [...(persisted.lootedByDay[today] ?? []), id];
	persisted.totalCollected += 1;

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
	await persist();
	return firstToday;
}
