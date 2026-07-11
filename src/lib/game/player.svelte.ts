// Player position: GPS, overridden by WASD debug movement for dev testing.
// Debug mode kicks in on the first WASD keypress and moves the player as
// offsets on top of the real (or fallback) position.

import { geo, startWatching, stopWatching } from '$lib/client/geo.svelte';
import { SLOTS } from './chests';

/** Debug walk speed (m/s). Brisk pace so chest-to-chest gaps test in seconds. */
const DEBUG_SPEED_MS = 300;

/** When there is no GPS, the debug walk starts north of the first slot. */
const FALLBACK_START = { lat: SLOTS[0].lat + 0.0012, lng: SLOTS[0].lng };

const M_PER_DEG_LAT = 111_320;

export const player = $state<{
	lat: number | null;
	lng: number | null;
	accuracy: number;
	/** gps = real position; debug = WASD control; none = neither yet */
	source: 'none' | 'gps' | 'debug';
	geoStatus: 'idle' | 'locating' | 'ok' | 'denied' | 'unavailable';
}>({ lat: null, lng: null, accuracy: 0, source: 'none', geoStatus: 'idle' });

let debugBase: { lat: number; lng: number } | null = null;
let offsetNorthM = 0;
let offsetEastM = 0;
const held = new Set<string>();
let rafId: number | null = null;
let lastTick = 0;

/** Applies the geo state (or debug offsets) to the player position. Called
 *  from a component $effect so GPS updates flow through reactively. */
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
		// The first keypress enables debug mode: the starting point is the
		// current GPS position or a fallback point at the edge of the play area.
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
