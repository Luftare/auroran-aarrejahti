// Pelaajan sijainti: GPS, jonka WASD-debug-liikkuminen ohittaa kehitystestausta
// varten. Debug käynnistyy ensimmäisestä WASD-painalluksesta ja liikuttaa
// pelaajaa offsetteina todellisen (tai oletus-) sijainnin päällä.

import { geo, startWatching, stopWatching } from '$lib/client/geo.svelte';
import { SLOTS } from './chests';

/** Debug-kävelyn nopeus (m/s). Reipas vauhti, jotta arkkuvälit testaa sekunneissa. */
const DEBUG_SPEED_MS = 50;

/** Kun GPS:ää ei ole, debug-kävely alkaa ensimmäisen slotin pohjoispuolelta. */
const FALLBACK_START = { lat: SLOTS[0].lat + 0.0012, lng: SLOTS[0].lng };

const M_PER_DEG_LAT = 111_320;

export const player = $state<{
	lat: number | null;
	lng: number | null;
	accuracy: number;
	/** gps = oikea sijainti; debug = WASD-ohjaus; none = ei vielä kumpaakaan */
	source: 'none' | 'gps' | 'debug';
	geoStatus: 'idle' | 'locating' | 'ok' | 'denied' | 'unavailable';
}>({ lat: null, lng: null, accuracy: 0, source: 'none', geoStatus: 'idle' });

let debugBase: { lat: number; lng: number } | null = null;
let offsetNorthM = 0;
let offsetEastM = 0;
const held = new Set<string>();
let rafId: number | null = null;
let lastTick = 0;

/** Vie geo-tilan (tai debug-offsetit) pelaajan sijaintiin. Kutsutaan
 *  komponentin $effectistä, jotta GPS-päivitykset valuvat läpi reaktiivisesti. */
export function syncPlayer(): void {
	apply();
}

function apply(): void {
	if (debugBase) {
		player.lat = debugBase.lat + offsetNorthM / M_PER_DEG_LAT;
		player.lng =
			debugBase.lng + offsetEastM / (M_PER_DEG_LAT * Math.cos((debugBase.lat * Math.PI) / 180));
		player.accuracy = 5;
		player.source = 'debug';
	} else if (geo.status === 'ok' && geo.lat != null && geo.lng != null) {
		player.lat = geo.lat;
		player.lng = geo.lng;
		player.accuracy = geo.accuracy;
		player.source = 'gps';
	}
	player.geoStatus = geo.status;
}

function tick(now: number): void {
	const dt = Math.min((now - lastTick) / 1000, 0.1);
	lastTick = now;
	const step = DEBUG_SPEED_MS * dt;
	if (held.has('w')) offsetNorthM += step;
	if (held.has('s')) offsetNorthM -= step;
	if (held.has('d')) offsetEastM += step;
	if (held.has('a')) offsetEastM -= step;
	apply();
	rafId = held.size > 0 ? requestAnimationFrame(tick) : null;
}

function onKeyDown(e: KeyboardEvent): void {
	const key = e.key.toLowerCase();
	if (!['w', 'a', 's', 'd'].includes(key)) return;
	if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
	if (!debugBase) {
		// Ensimmäinen painallus kytkee debug-tilan: lähtöpiste on nykyinen
		// GPS-sijainti tai varapiste pelialueen laidalla.
		debugBase =
			player.source === 'gps' && player.lat != null && player.lng != null
				? { lat: player.lat, lng: player.lng }
				: { ...FALLBACK_START };
	}
	held.add(key);
	if (rafId == null) {
		lastTick = performance.now();
		rafId = requestAnimationFrame(tick);
	}
}

function onKeyUp(e: KeyboardEvent): void {
	held.delete(e.key.toLowerCase());
}

export function startPlayer(): void {
	startWatching();
	window.addEventListener('keydown', onKeyDown);
	window.addEventListener('keyup', onKeyUp);
	apply();
}

export function stopPlayer(): void {
	stopWatching();
	window.removeEventListener('keydown', onKeyDown);
	window.removeEventListener('keyup', onKeyUp);
	if (rafId != null) cancelAnimationFrame(rafId);
	rafId = null;
	held.clear();
}
