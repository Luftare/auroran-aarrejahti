// All player-visible texts. No hardcoded strings in components.

export const fi = {
	appName: 'Auroran aarrejahti',

	// Onboarding — the story and instructions, one spoonful at a time
	onboardingLead: 'Aloita koko perheen hauska aarrejahti Träskändan kartanon kulmilla!',
	onboardingStart: 'Aloita',
	onboardingStamp: 'Kehitetty Järvenperässä',
	onboardingStory1:
		'Joka yö Aurora kätkee uusia aarteita vanhoille kotikulmilleen...',
	onboardingStory2: 'Aamulla arkut odottavat löytäjäänsä.',
	onboardingPickLevel: (name: string) => `Valitse ${name}`,
	onboardingLocationTitle: 'Vielä yksi juttu',
	onboardingLocationBody:
		'Peli tarvitsee toimiakseen sijaintiasi.',
	onboardingAllowLocation: 'Salli sijainti',
	onboardingCompassTitle: 'Otetaanko kompassi käyttöön?',
	onboardingCompassBody:
		'Kompassi näyttää kartalla, mihin suuntaan olet katsomassa. Se on vapaaehtoinen apu.',
	onboardingAllowCompass: 'Salli kompassi',
	onboardingSkipCompass: 'En tarvitse kompassia.',

	// Location
	locating: 'Etsitään sijaintiasi…',
	locationDenied:
		'Peli tarvitsee sijaintisi löytääkseen aarteet. Salli sijainti selaimen asetuksista ja lataa sivu uudelleen.',
	locationUnavailable: 'Sijaintia ei saatu selville. Yritä hetken kuluttua uudelleen.',
	locationNeeded: 'Peli tarvitsee sijaintisi toimiakseen.',
	retry: 'Yritä uudelleen',

	// Levels ("areas"): each has its own treasure range
	levelName: {
		puutarha: 'Puutarha',
		metsa: 'Metsä',
		seutu: 'Seutu'
	} as Record<string, string>,
	levelDesc: {
		puutarha: 'Lyhyt retki kartanon puutarhassa.',
		metsa: 'Reipas kierros kartanon metsässä.',
		seutu: 'Koko Järvenperä tutkittavana.'
	} as Record<string, string>,
	chooseArea: 'Valitse alue',

	// Level completed: celebration and moving to the next area
	levelCompleteTitle: 'Kaikki aarteet löydetty!',
	allLevelsDoneTitle: 'Uskomatonta!',
	allLevelsDoneBody:
		'Löysit tänään kaikkien alueiden kaikki aarteet. Uudet aarteet ilmestyvät keskiyöllä.',

	// Map
	chestDistance: (dist: string) => `${dist} päässä`,
	openTreasure: 'Avaa arkku!',
	allLooted: 'Löysit kaikki tämän päivän aarteet! Uudet aarteet ilmestyvät keskiyöllä.',
	recenter: 'Palaa omaan sijaintiin',
	zoomIn: 'Lähennä',
	zoomOut: 'Loitonna',

	// Opening a chest — the chest holds the treasures
	tapToOpen: 'Tökkää arkkua!',
	showLoot: 'Näytä aarteet!',
	next: 'Seuraava',
	treasureFound: 'Vautsi!',
	streakDays: 'päivän putki',
	backToMap: 'Takaisin kartalle',

	// HUD
	streak: 'Putki',
	collected: 'Kerätyt aarteet',
	gemsTitle: 'Kerätyt jalokivet',
	noGems: 'Ei vielä jalokiviä. Avaa aarrearkkuja!',

	// Orientation hint
	rotatePortrait: 'Käännä laite pystyasentoon.',

	// Dev tools
	debugChest: 'Kokeile arkun avausta (debug)',
	debugGems: 'Näytä jalokivet (debug)',
	debugOnboarding: 'Käynnistä perehdytys uudelleen (debug)',
	debugLevelComplete: 'Näytä alueen läpäisy (debug)',
	close: 'Sulje',

	// Chest-slot editor
	editorTitle: 'Kätköpaikat',
	editorSave: 'Tallenna',
	editorHint: 'Napauta karttaa lisätäksesi · raahaa siirtääksesi · napauta merkkiä poistaaksesi',
	editorSaved: (n: number) => `Tallennettu repositorioon: ${n} paikkaa.`,
	editorSaveFailed: 'Tallennus epäonnistui. Editori toimii vain kehityspalvelimella (npm run dev).',

	/** 200 m / 1,2 km — Finnish formatting */
	formatDistance(meters: number): string {
		if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
		return `${(Math.round(meters / 100) / 10).toString().replace('.', ',')} km`;
	}
};
