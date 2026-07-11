// All player-visible texts. No hardcoded strings in components.

export const fi = {
	appName: 'Auroran aarrejahti',

	// Location
	locating: 'Etsitään sijaintiasi…',
	locationDenied:
		'Peli tarvitsee sijaintisi löytääkseen aarteet. Salli sijainti selaimen asetuksista ja lataa sivu uudelleen.',
	locationUnavailable: 'Sijaintia ei saatu selville. Yritä hetken kuluttua uudelleen.',
	locationNeeded: 'Peli tarvitsee sijaintisi toimiakseen.',
	retry: 'Yritä uudelleen',

	// Map
	distanceToNearest: (dist: string) => `Lähin aarre on ${dist} päässä — kävele lähemmäs!`,
	openTreasure: 'Avaa arkku!',
	allLooted: 'Löysit kaikki tämän päivän aarteet! Uudet aarteet ilmestyvät keskiyöllä.',
	recenter: 'Palaa omaan sijaintiin',
	zoomIn: 'Lähennä',
	zoomOut: 'Loitonna',

	// Opening a chest — the chest holds the treasures
	tapToOpen: 'Avaa arkku!',
	showLoot: 'Näytä aarteet!',
	next: 'Seuraava',
	treasureFound: 'Aarre kerätty!',
	streakDays: 'päivän putki',
	backToMap: 'Takaisin kartalle',

	// HUD
	streak: 'Putki',
	collected: 'Kerätyt aarteet',
	gemsTitle: 'Kerätyt jalokivet',
	noGems: 'Ei vielä jalokiviä — avaa aarrearkkuja!',

	// Orientation hint
	rotatePortrait: 'Käännä laite pystyasentoon.',

	// Dev tools
	debugChest: 'Kokeile arkun avausta (debug)',
	debugGems: 'Näytä jalokivet (debug)',
	close: 'Sulje',

	// Chest-slot editor
	editorTitle: 'Kätköpaikat',
	editorSave: 'Tallenna',
	editorHint: 'Napauta karttaa lisätäksesi · raahaa siirtääksesi · napauta merkkiä poistaaksesi',
	editorSaved: (n: number) => `Tallennettu repositorioon — ${n} paikkaa.`,
	editorSaveFailed: 'Tallennus epäonnistui. Editori toimii vain kehityspalvelimella (npm run dev).',

	/** 200 m / 1,2 km — Finnish formatting */
	formatDistance(meters: number): string {
		if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
		return `${(Math.round(meters / 100) / 10).toString().replace('.', ',')} km`;
	}
};
