// Aarrearkkujen paikat ja päivittäinen deterministinen valinta.
//
// Kaikki pelaajat näkevät samat arkut ilman palvelinta: ennalta määritellyistä
// paikkasloteista valitaan päivän arkut algoritmilla, jonka siemenenä on
// päivämäärä. Sama päivä → sama siemen → sama valinta kaikilla laitteilla.

export type Slot = { id: string; lat: number; lng: number };
export type Chest = Slot & { looted: boolean };

/** Mahdolliset kätköpaikat. Lisää slotteja tänne — valinta-algoritmi skaalautuu. */
export const SLOTS: Slot[] = [
	{ id: 'slotti-1', lat: 60.243128542019946, lng: 24.71441876816411 },
	{ id: 'slotti-2', lat: 60.239669117263595, lng: 24.713516642267304 },
	{ id: 'slotti-3', lat: 60.236036337807725, lng: 24.709311485771174 },
	{ id: 'slotti-4', lat: 60.23107833805376, lng: 24.700394886014855 }
];

/** Montako arkkua päivässä. Nyt kaikki slotit; laskee kun slotteja on enemmän. */
export const DAILY_COUNT = 4;

/** Kuinka lähelle arkkua on käveltävä (metriä). */
export const LOOT_RADIUS_M = 15;

/** Pelipäivä vaihtuu Helsingin keskiyöllä kaikilla pelaajilla. */
export function currentDay(now = new Date()): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Helsinki',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(now);
}

/** xmur3-tiiviste: päivämäärämerkkijono → 32-bittinen siemen. */
function seedFromDay(day: string): number {
	let h = 1779033703 ^ day.length;
	for (let i = 0; i < day.length; i++) {
		h = Math.imul(h ^ day.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	h = Math.imul(h ^ (h >>> 16), 2246822507);
	h = Math.imul(h ^ (h >>> 13), 3266489909);
	return (h ^= h >>> 16) >>> 0;
}

/** mulberry32: nopea deterministinen näennäissatunnaisgeneraattori. */
function mulberry32(seed: number): () => number {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Päivän arkkupaikat: siemenellä sekoitettu slottilista, josta otetaan alku. */
export function dailySlots(day: string): Slot[] {
	const rng = mulberry32(seedFromDay(day));
	const shuffled = [...SLOTS];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled.slice(0, Math.min(DAILY_COUNT, shuffled.length));
}
