export type GeoState = {
	status: 'idle' | 'locating' | 'ok' | 'denied' | 'unavailable';
	lat: number | null;
	lng: number | null;
	accuracy: number;
};

export const geo = $state<GeoState>({ status: 'idle', lat: null, lng: null, accuracy: 0 });

let watchId: number | null = null;

export function startWatching(): void {
	if (watchId != null || !('geolocation' in navigator)) return;
	geo.status = geo.status === 'ok' ? 'ok' : 'locating';
	watchId = navigator.geolocation.watchPosition(
		(pos) => {
			geo.lat = pos.coords.latitude;
			geo.lng = pos.coords.longitude;
			geo.accuracy = pos.coords.accuracy ?? 0;
			geo.status = 'ok';
		},
		(err) => {
			geo.status = err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable';
		},
		{ enableHighAccuracy: true, maximumAge: 5000, timeout: 30_000 }
	);
}

export function stopWatching(): void {
	if (watchId != null) {
		navigator.geolocation.clearWatch(watchId);
		watchId = null;
	}
	if (geo.status === 'locating') geo.status = 'idle';
}
