// All player-visible texts. No hardcoded strings in components.

export const fi = {
	appName: 'Auroran aarrejahti',

	// Onboarding — the story and instructions, one spoonful at a time
	onboardingLead: 'Aloita koko perheen hauska aarrejahti Träskändan kartanon kulmilla!',
	onboardingStart: 'Aloita',
	readMore: 'Lue lisää',
	faqClose: 'Selvä',
	/** FAQ behind the front page's "Lue lisää" link. */
	faq: [
		{
			q: 'Mikä tämä on?',
			a: [
				'Auroran aarrejahti on koko perheen seikkailupeli, jota pelataan Träskändan luonnon kauniissa puistossa ja sen lähiympäristössä.',
				'Pelissä etsitään kartalle merkittyjä aarrearkkuja, joista paljastuu erilaisia jalokiviä.',
				'Valittavissa on kolme eri aluetta. Pienin alue, "puutarha", sopii perheen pienimmille. "Seutu" alue tarjoaa reippaan kävelyretken varttuneemmille pelaajille.',
				'Joka yö piilotetaan uudet aarteet. Suunnittele päivän kävelyreitti aarteiden sijaintien innoittamana!'
			]
		},
		{ q: 'Maksaako pelaaminen?', a: ['Ei. Peli on ilmainen.'] },
		{
			q: 'Mitä pelin pelaamista varten tarvitaan?',
			a: ['Matkapuhelin, jossa on verkkoyhteys.']
		},
		{
			q: 'Mihin sijaintitietoa käytetään?',
			a: [
				'Sijaintitietoa käytetään aarteiden paikantamiseen. Sijaintitietoa ei lähetetä minnekään päätelaitteelta.'
			]
		},
		{
			q: 'Kuka on kehittänyt pelin?',
			a: [
				[
					'Pelin on kehittänyt ',
					{ label: 'Ilmari Koskinen', href: 'https://www.linkedin.com/in/ilmarikoskinen/' },
					', Järvenperässä asuva perheen isä.'
				]
			]
		},
		{
			q: 'Miksi peli on kehitetty?',
			a: [
				'Koska pelien kehittäminen on kivaa. Lisäksi peli voi parhaassa tapauksessa saada ihmisiä liikkumaan enemmän.'
			]
		},
		{
			q: 'Pitääkö ruutuja tuijottaa myös liikkuessa?',
			a: [
				'Pelin pelaamista varten ei tarvitse jatkuvasti tuijottaa puhelinta. Puhelimen voi laittaa huoletta taskuun liikuttaessa aarteiden luo.'
			]
		},
		{
			q: 'Miten voin lähettää palautetta?',
			a: ['Palaute on erittäin tervetullutta!'],
			link: {
				label: 'Täytä palautelomake',
				href: 'https://docs.google.com/forms/d/e/1FAIpQLSfrqAiRsyGu0S6dg9HoU-f1SOOzwmyaHUMr0z5lmggwYBeLfQ/viewform?usp=publish-editor'
			}
		},
		{
			q: 'Haluan osallistua pelin kehittämiseen',
			a: ['Peli on kehitetty avoimella lähdekoodilla.'],
			link: {
				label: 'github.com/Luftare/auroran-aarrejahti',
				href: 'https://github.com/Luftare/auroran-aarrejahti'
			}
		}
	] as {
		q: string;
		/** A paragraph is a plain string, or segments with inline links. */
		a: (string | (string | { label: string; href: string })[])[];
		link?: { label: string; href: string };
	}[],

	onboardingGuideSteps: ['Valitse pelialue', 'Kävele aarrearkkujen luo', 'Kerää arkkujen aarteet'],
	onboardingGuideNote: 'Aarteiden sijainnit vaihtuvat joka päivä!',
	onboardingPickLevel: (name: string) => `Valitse ${name}`,
	onboardingLocationTitle:
		'Peli tarvitsee toimiakseen sijaintitietoa.',
	onboardingAllowLocation: 'Salli sijaintitieto',
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
	chooseArea: 'Valitse pelialue',

	// Level completed: celebration and moving to the next area
	levelCompleteTitle: 'Kaikki aarteet löydetty!',
	allLevelsDoneTitle: 'Uskomatonta!',
	allLevelsDoneBody:
		'Löysit tänään kaikkien alueiden kaikki aarteet. Uudet aarteet ilmestyvät keskiyöllä.',

	// Start-of-hunt modal, shown when the map opens after picking an area
	startHuntTitle: 'Oletko valmis?',
	startHuntNearest: (dist: string) => `Lähin aarre on ${dist} päässä.`,
	startHuntCareful: 'Muista kulkea varovasti!',
	startHuntCta: 'Menoksi!',

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
	/** One of these cheers pops in as the gem gets its colors and bounces. */
	cheers: [
		'Vautsi!',
		'Oho!',
		'Jee!',
		'Mahtavaa!',
		'Mageeta!',
		'Huikeeta!',
		'Ohhoh!',
		'Ooh!',
		'Jihuu!',
		'Jippii!',
		'Jiihaa!',
		'Oijoi!',
		'Noni!',
		'No nyt!',
		'Ihanaa!',
		'Upeeta!',
		'Huisia!',
		'Hienoa!',
		'Onpas hieno!',
		'Vautsi vau!',
		'Vaude!',
		'Huisin hieno!'
	],
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
