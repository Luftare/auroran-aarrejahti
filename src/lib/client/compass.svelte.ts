// Device compass heading via universal-compass (DeviceOrientation API).
// The heading is a voluntary extra: when it is unavailable or not allowed,
// the game simply shows no direction cone on the player marker.

import { UniversalCompass } from 'universal-compass';

export const compass = $state<{ heading: number | null; active: boolean }>({
	heading: null,
	active: false
});

const instance = new UniversalCompass();

/** Compass can only exist where the DeviceOrientation API does. */
export function compassSupported(): boolean {
	return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
}

function startHeading(): void {
	if (compass.active) return;
	compass.active = true;
	instance.onHeading((heading) => {
		compass.heading = heading;
	});
}

/**
 * Asks for the compass permission — call inside a tap gesture so iOS can
 * show its prompt. Resolves false when unavailable or not granted.
 */
export async function requestCompass(): Promise<boolean> {
	try {
		await instance.requestPermission();
		startHeading();
		return true;
	} catch {
		return false;
	}
}

/**
 * Silent start for returning players: on Android there is no permission
 * gate, and on iOS a previously granted permission resolves without a
 * prompt. When the prompt would be needed, this quietly does nothing.
 */
export async function tryStartCompass(): Promise<void> {
	if (!compassSupported()) return;
	try {
		await instance.requestPermission();
		startHeading();
	} catch {
		// no compass for this session
	}
}
