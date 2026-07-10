// Kaikki pelaajalle näkyvät tekstit. Ei kovakoodattuja tekstejä komponentteihin.

export const fi = {
	appName: 'Auroran aarrejahti',

	// Sijainti
	locating: 'Etsitään sijaintiasi…',
	locationDenied:
		'Peli tarvitsee sijaintisi löytääkseen aarteet. Salli sijainti selaimen asetuksista ja lataa sivu uudelleen.',
	locationUnavailable: 'Sijaintia ei saatu selville. Yritä hetken kuluttua uudelleen.',
	locationNeeded: 'Peli tarvitsee sijaintisi toimiakseen.',
	retry: 'Yritä uudelleen',

	// Kartta
	distanceToNearest: (dist: string) => `Lähin aarre on ${dist} päässä — kävele lähemmäs!`,
	tapNearbyChest: 'Aarre löytyi — napauta arkkua!',
	allLooted: 'Löysit kaikki tämän päivän aarteet! Uudet aarteet ilmestyvät keskiyöllä.',
	recenter: 'Palaa omaan sijaintiin',
	zoomIn: 'Lähennä',
	zoomOut: 'Loitonna',

	// Arkun avaaminen
	tapToOpen: 'Napauta arkkua avataksesi sen!',
	tapsLeft: (n: number) => (n === 1 ? 'Vielä yksi napautus!' : `Vielä ${n} napautusta`),
	treasureFound: 'Aarre kerätty!',
	streakContinues: (days: number) => `Putkesi jatkuu — ${days}. päivä!`,
	streakStarted: 'Putkesi alkoi tänään!',
	backToMap: 'Takaisin kartalle',

	// HUD
	streak: 'Putki',
	collected: 'Kerätyt aarteet',

	// Suunnan ohje
	rotatePortrait: 'Käännä laite pystyasentoon.',

	// Kehitystyökalut
	debugChest: 'Kokeile arkun avausta (debug)',
	debugGems: 'Näytä jalokivet (debug)',
	close: 'Sulje',

	/** 200 m / 1,2 km — suomalainen muotoilu */
	formatDistance(meters: number): string {
		if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
		return `${(Math.round(meters / 100) / 10).toString().replace('.', ',')} km`;
	}
};
