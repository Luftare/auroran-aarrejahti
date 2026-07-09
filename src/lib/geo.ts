/** Great-circle distance in meters between two WGS84 points (haversine). */
export function distanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6_371_000;
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(a));
}

/** GPS accuracy leniency: a chest is in range when distance <= radius + min(accuracy, 20 m). */
export function inRange(distance: number, radiusM: number, accuracyM: number): boolean {
	return distance <= radiusM + Math.min(Math.max(accuracyM, 0), 20);
}
