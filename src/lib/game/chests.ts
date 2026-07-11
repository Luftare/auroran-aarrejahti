// Treasure chest locations and the daily deterministic selection.
//
// All players see the same chests without a server: the day's chests are
// picked from predefined location slots by an algorithm seeded with the
// date. Same day → same seed → same selection on every device.

import { distanceM } from '$lib/geo';

export type Slot = { id: string; lat: number; lng: number };
export type Chest = Slot & { looted: boolean };

/** Possible cache locations. Add slots here — the selection algorithm scales. */
export const SLOTS: Slot[] = [
	{ id: 'slotti-1', lat: 60.24568441474585, lng: 24.71077096390374 },
	{ id: 'slotti-2', lat: 60.23938894811013, lng: 24.713676485644527 },
	{ id: 'slotti-3', lat: 60.23588122570857, lng: 24.709301821155947 },
	{ id: 'slotti-4', lat: 60.23446495976461, lng: 24.70642378462594 },
	{ id: 'slotti-5', lat: 60.24602726815522, lng: 24.71872527336879 },
	{ id: 'slotti-6', lat: 60.24531169891034, lng: 24.717721311725654 },
	{ id: 'slotti-7', lat: 60.24518146019648, lng: 24.719151887504125 },
	{ id: 'slotti-8', lat: 60.24571316477295, lng: 24.716212215731645 },
	{ id: 'slotti-9', lat: 60.24737407043614, lng: 24.716785871444102 },
	{ id: 'slotti-10', lat: 60.24814021035908, lng: 24.715049766208352 },
	{ id: 'slotti-11', lat: 60.250372127538725, lng: 24.71583343338267 },
	{ id: 'slotti-12', lat: 60.25050143299916, lng: 24.71859076609846 },
	{ id: 'slotti-13', lat: 60.249891178633845, lng: 24.71942680279662 },
	{ id: 'slotti-14', lat: 60.24919365170936, lng: 24.724926491853353 },
	{ id: 'slotti-15', lat: 60.24977085068966, lng: 24.72608361511118 },
	{ id: 'slotti-16', lat: 60.246412644643186, lng: 24.73057030580921 },
	{ id: 'slotti-17', lat: 60.24393879012757, lng: 24.728345274089776 },
	{ id: 'slotti-18', lat: 60.24517745014256, lng: 24.729250093699363 },
	{ id: 'slotti-19', lat: 60.24169787746317, lng: 24.723622904948996 },
	{ id: 'slotti-20', lat: 60.24300398464325, lng: 24.726311657639485 },
	{ id: 'slotti-21', lat: 60.24041714368525, lng: 24.72066688012788 },
	{ id: 'slotti-22', lat: 60.24247372832883, lng: 24.718143076703313 },
	{ id: 'slotti-23', lat: 60.24441465689023, lng: 24.708230417937727 },
	{ id: 'slotti-24', lat: 60.24404019802819, lng: 24.71068802947076 },
	{ id: 'slotti-25', lat: 60.24398653049829, lng: 24.71161739133632 },
	{ id: 'slotti-26', lat: 60.24449583263228, lng: 24.71183925391307 },
	{ id: 'slotti-27', lat: 60.24446680997647, lng: 24.709300639403295 },
	{ id: 'slotti-28', lat: 60.24463895006653, lng: 24.710024495090607 },
	{ id: 'slotti-29', lat: 60.244958460867196, lng: 24.70750273791336 },
	{ id: 'slotti-30', lat: 60.24079896865993, lng: 24.70333339314203 },
	{ id: 'slotti-31', lat: 60.240977915580714, lng: 24.702265135547606 },
	{ id: 'slotti-32', lat: 60.23976571766647, lng: 24.701339837405442 },
	{ id: 'slotti-33', lat: 60.23897141287085, lng: 24.701709083369565 },
	{ id: 'slotti-34', lat: 60.2387971965986, lng: 24.702721047181427 },
	{ id: 'slotti-35', lat: 60.238233239739486, lng: 24.700816737526623 },
	{ id: 'slotti-36', lat: 60.23769025040107, lng: 24.699874967736093 },
	{ id: 'slotti-37', lat: 60.23662091016689, lng: 24.701280611963625 },
	{ id: 'slotti-38', lat: 60.235869017981514, lng: 24.70214314595927 },
	{ id: 'slotti-39', lat: 60.235834171501835, lng: 24.70310831375693 },
	{ id: 'slotti-40', lat: 60.23626846202734, lng: 24.704667389612155 },
	{ id: 'slotti-41', lat: 60.23702764951042, lng: 24.705483539196905 },
	{ id: 'slotti-42', lat: 60.23685751143313, lng: 24.70904382606483 },
	{ id: 'slotti-43', lat: 60.23744189377231, lng: 24.708093278082686 },
	{ id: 'slotti-44', lat: 60.23606097498208, lng: 24.708143692949363 },
	{ id: 'slotti-45', lat: 60.2363313225741, lng: 24.711559728851086 },
	{ id: 'slotti-46', lat: 60.23525874467791, lng: 24.712886794713768 },
	{ id: 'slotti-47', lat: 60.23495807491042, lng: 24.710861515539108 },
	{ id: 'slotti-48', lat: 60.23528076243272, lng: 24.70965513631245 },
	{ id: 'slotti-49', lat: 60.234876448373086, lng: 24.71431373620345 },
	{ id: 'slotti-50', lat: 60.23355233168732, lng: 24.713528036434326 },
	{ id: 'slotti-51', lat: 60.234185414376014, lng: 24.715809342135003 },
	{ id: 'slotti-52', lat: 60.23299474414142, lng: 24.715674803619294 },
	{ id: 'slotti-53', lat: 60.23313704603075, lng: 24.713949200589155 },
	{ id: 'slotti-54', lat: 60.232919173654324, lng: 24.71156596589222 },
	{ id: 'slotti-55', lat: 60.23341054126249, lng: 24.710184091169793 },
	{ id: 'slotti-56', lat: 60.233753475405535, lng: 24.708622580416005 },
	{ id: 'slotti-57', lat: 60.2340250602584, lng: 24.707830727391553 },
	{ id: 'slotti-58', lat: 60.23292252458171, lng: 24.705675295775876 },
	{ id: 'slotti-59', lat: 60.23372440403796, lng: 24.70504040841419 },
	{ id: 'slotti-60', lat: 60.2350308824478, lng: 24.70773573167142 },
	{ id: 'slotti-61', lat: 60.232294932905916, lng: 24.713876318340283 },
	{ id: 'slotti-62', lat: 60.23154801890354, lng: 24.714597468704397 },
	{ id: 'slotti-63', lat: 60.232038702612414, lng: 24.714460804265855 },
	{ id: 'slotti-64', lat: 60.231834608917296, lng: 24.71373914283879 },
	{ id: 'slotti-65', lat: 60.231069836364554, lng: 24.71557687427108 },
	{ id: 'slotti-66', lat: 60.230258161502974, lng: 24.711414906964364 },
	{ id: 'slotti-67', lat: 60.2312371850243, lng: 24.712170343504397 },
	{ id: 'slotti-68', lat: 60.23190712892864, lng: 24.70990980239742 },
	{ id: 'slotti-69', lat: 60.230781314542696, lng: 24.710718987471296 },
	{ id: 'slotti-70', lat: 60.23271851770616, lng: 24.70994613212821 },
	{ id: 'slotti-71', lat: 60.233808735428, lng: 24.7063972796459 },
	{ id: 'slotti-72', lat: 60.23704666085732, lng: 24.710393707963192 },
	{ id: 'slotti-73', lat: 60.235708448892154, lng: 24.711986992995634 },
	{ id: 'slotti-74', lat: 60.237790747369246, lng: 24.714158618554052 },
	{ id: 'slotti-75', lat: 60.23924413119684, lng: 24.716596741568253 },
	{ id: 'slotti-76', lat: 60.23926383552336, lng: 24.712713167769294 },
	{ id: 'slotti-77', lat: 60.23910670387042, lng: 24.713334328607317 },
	{ id: 'slotti-78', lat: 60.238525239994345, lng: 24.70845039307804 },
	{ id: 'slotti-79', lat: 60.23924665502298, lng: 24.703995600201836 },
	{ id: 'slotti-80', lat: 60.238319134112515, lng: 24.703829120483277 },
	{ id: 'slotti-81', lat: 60.242008763022085, lng: 24.712654851075797 },
	{ id: 'slotti-82', lat: 60.24268396098344, lng: 24.706918325339927 },
	{ id: 'slotti-83', lat: 60.24347302035821, lng: 24.70518815037053 },
	{ id: 'slotti-84', lat: 60.24259033059121, lng: 24.70282837387157 },
	{ id: 'slotti-85', lat: 60.24162784861207, lng: 24.704886609775713 },
	{ id: 'slotti-86', lat: 60.240498596790474, lng: 24.707264646484674 },
	{ id: 'slotti-87', lat: 60.24089946263035, lng: 24.71356589512311 },
	{ id: 'slotti-88', lat: 60.240007127100455, lng: 24.713329876008288 },
	{ id: 'slotti-89', lat: 60.24056225012248, lng: 24.712283798320072 },
	{ id: 'slotti-90', lat: 60.24156136839153, lng: 24.709999684447183 },
	{ id: 'slotti-91', lat: 60.2422152269647, lng: 24.71049000043348 },
	{ id: 'slotti-92', lat: 60.2433954285205, lng: 24.711655993714004 },
	{ id: 'slotti-93', lat: 60.24318853023706, lng: 24.714472627654402 },
	{ id: 'slotti-94', lat: 60.243329617648186, lng: 24.71267333008558 },
	{ id: 'slotti-95', lat: 60.24650090548775, lng: 24.713956890153355 },
	{ id: 'slotti-96', lat: 60.25121531456256, lng: 24.724173561467182 },
	{ id: 'slotti-97', lat: 60.250535427149146, lng: 24.72287442848858 },
	{ id: 'slotti-98', lat: 60.249812781003726, lng: 24.72057504803999 },
	{ id: 'slotti-99', lat: 60.24666885957802, lng: 24.7106860099816 },
	{ id: 'slotti-100', lat: 60.23434864489474, lng: 24.710264368512526 },
	{ id: 'slotti-101', lat: 60.234512266179564, lng: 24.711995529723595 },
	{ id: 'slotti-102', lat: 60.235957232344816, lng: 24.714022522709456 },
	{ id: 'slotti-103', lat: 60.237500167866045, lng: 24.71894119022363 },
	{ id: 'slotti-104', lat: 60.23678753578653, lng: 24.715341557519025 },
	{ id: 'slotti-105', lat: 60.24470698883161, lng: 24.715828914482813 },
	{ id: 'slotti-106', lat: 60.24910649250526, lng: 24.72955304562359 },
	{ id: 'slotti-107', lat: 60.243474346310194, lng: 24.718816027911856 },
	{ id: 'slotti-108', lat: 60.240637684224566, lng: 24.717305480744443 },
	{ id: 'slotti-109', lat: 60.24124765626544, lng: 24.718706255368886 },
	{ id: 'slotti-110', lat: 60.24260972955253, lng: 24.721923140653473 },
	{ id: 'slotti-111', lat: 60.24261511719911, lng: 24.721944850658872 },
	{ id: 'slotti-112', lat: 60.24147649353162, lng: 24.714190270040916 },
	{ id: 'slotti-113', lat: 60.24388232819595, lng: 24.713549006755812 },
	{ id: 'slotti-114', lat: 60.24549777596761, lng: 24.70789753129307 },
	{ id: 'slotti-115', lat: 60.23708525806367, lng: 24.709678068274798 },
	{ id: 'slotti-116', lat: 60.23645203413392, lng: 24.710260549389005 },
	{ id: 'slotti-117', lat: 60.23577365406021, lng: 24.70718914712566 },
	{ id: 'slotti-118', lat: 60.237088823933874, lng: 24.708850116545563 },
	{ id: 'slotti-119', lat: 60.236599430405164, lng: 24.70743044579112 },
	{ id: 'slotti-120', lat: 60.23551830092126, lng: 24.70813426924849 },
	{ id: 'slotti-121', lat: 60.23558615819911, lng: 24.71082725043763 },
	{ id: 'slotti-122', lat: 60.234628053842584, lng: 24.713143198610965 },
	{ id: 'slotti-123', lat: 60.23360717317007, lng: 24.71572561449861 }
];

/** How many chests per day. */
export const DAILY_COUNT = 6;

/** "Far" = this fraction of the largest possible pairwise slot distance. */
const FAR_FRACTION = 0.7;

/** How many of the day's chests are drawn completely freely (allowed to cluster). */
const FREE_PICKS = DAILY_COUNT - 2;

/** How close you must walk to a chest (meters). */
export const LOOT_RADIUS_M = 15;

/** The game day rolls over at Helsinki midnight for all players. */
export function currentDay(now = new Date()): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Helsinki',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(now);
}

/** xmur3 hash: date string → 32-bit seed. */
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

/** mulberry32: a fast deterministic pseudo-random generator. */
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

/** The largest possible pairwise slot distance (meters) — computed once. */
let maxPairDistCache = 0;
function maxPairDist(): number {
	if (maxPairDistCache === 0) {
		for (let i = 0; i < SLOTS.length; i++) {
			for (let j = i + 1; j < SLOTS.length; j++) {
				const d = distanceM(SLOTS[i].lat, SLOTS[i].lng, SLOTS[j].lat, SLOTS[j].lng);
				if (d > maxPairDistCache) maxPairDistCache = d;
			}
		}
	}
	return maxPairDistCache;
}

function minDistTo(slot: Slot, group: Slot[]): number {
	let min = Infinity;
	for (const other of group) {
		const d = distanceM(slot.lat, slot.lng, other.lat, other.lng);
		if (d < min) min = d;
	}
	return min;
}

/**
 * The day's chest locations, avoiding clustering: the first four are drawn
 * completely freely (they may land close together), but the last two are
 * forced far away from them — at least ~70% of the largest possible pairwise
 * distance. This way at least one chest pair is always far apart, and all six
 * never pile up in the same corner. If there are no candidates far enough
 * away (the free four already spread across the whole area), the farthest
 * ones available are taken.
 *
 * All picks use deterministic randomness seeded from the date — the same day
 * gives the same locations to all players.
 */
export function dailySlots(day: string): Slot[] {
	const rng = mulberry32(seedFromDay(day));
	const shuffled = [...SLOTS];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	if (shuffled.length <= DAILY_COUNT) return shuffled;

	const free = shuffled.slice(0, FREE_PICKS);
	const rest = shuffled.slice(FREE_PICKS);
	const farLimit = maxPairDist() * FAR_FRACTION;

	const picked = [...free];
	for (let n = 0; n < DAILY_COUNT - FREE_PICKS; n++) {
		const candidates = rest.filter((s) => !picked.includes(s) && minDistTo(s, free) >= farLimit);
		if (candidates.length > 0) {
			picked.push(candidates[Math.floor(rng() * candidates.length)]);
		} else {
			// None far enough — take the farthest remaining one
			let best: Slot | null = null;
			let bestDist = -1;
			for (const s of rest) {
				if (picked.includes(s)) continue;
				const d = minDistTo(s, free);
				if (d > bestDist) {
					bestDist = d;
					best = s;
				}
			}
			if (best) picked.push(best);
		}
	}
	return picked;
}
