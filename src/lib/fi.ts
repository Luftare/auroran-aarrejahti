// Kaikki pelaajalle näkyvät tekstit. Ei kovakoodattuja tekstejä komponentteihin.

export const fi = {
	appName: 'Auroran aarrejahti',

	// Päänäkymä
	locating: 'Etsitään sijaintiasi…',
	locationDenied:
		'Peli tarvitsee sijaintisi löytääkseen aarteet. Salli sijainti selaimen asetuksista ja lataa sivu uudelleen.',
	locationUnavailable: 'Sijaintia ei saatu selville. Yritä hetken kuluttua uudelleen.',
	locationNeeded: 'Peli tarvitsee sijaintisi toimiakseen.',
	retry: 'Yritä uudelleen',
	distanceToNearest: (dist: string) => `Lähin aarre on ${dist} päässä — kävele lähemmäs!`,
	allLooted: 'Löysit kaikki tämän päivän aarteet! Uudet aarteet ilmestyvät keskiyöllä.',
	noChestsToday: 'Aurora ei ole vielä kätkenyt tämän päivän aarteita.',
	recenter: 'Palaa omaan sijaintiin',
	zoomIn: 'Lähennä',
	zoomOut: 'Loitonna',

	// Arkun avaaminen
	tapToOpen: 'Napauta arkkua avataksesi sen!',
	tapsLeft: (n: number) => (n === 1 ? 'Vielä yksi napautus!' : `Vielä ${n} napautusta`),
	gotCoins: (n: number) => `Sait ${n} kolikkoa!`,
	streakContinues: (days: number) => `Putkesi jatkuu — ${days}. päivä!`,
	streakStarted: 'Putkesi alkoi tänään!',
	backToMap: 'Takaisin kartalle',

	// Tilarivi ja navigointi
	settings: 'Asetukset',
	leaderboard: 'Tulostaulu',
	pouch: 'Kukkaro',
	streak: 'Putki',
	coins: 'Kolikot',

	// Tulostaulu
	allTime: 'Kaikkien aikojen',
	today: 'Tänään',
	lootsUnit: (n: number) => (n === 1 ? '1 aarre' : `${n} aarretta`),
	you: 'sinä',
	reportName: 'Ilmoita sopimattomasta nimestä',
	reportConfirm: (name: string) => `Ilmoitetaanko nimi ”${name}” ylläpidolle sopimattomana?`,
	reportSent: 'Kiitos ilmoituksesta. Ylläpito tarkistaa nimen.',
	cancel: 'Peruuta',
	confirm: 'Vahvista',

	// Kukkaro
	totalLoots: 'Avattuja arkkuja',
	currentStreak: 'Nykyinen putki',
	bestStreak: 'Paras putki',
	daysUnit: (n: number) => (n === 1 ? '1 päivä' : `${n} päivää`),

	// Putken palautus
	streakBroken: 'Putkesi katkesi!',
	restoreOffer: (missed: number, cost: number) =>
		missed === 1
			? `Palauta putki ${cost} kolikolla.`
			: `Palauta putki (${missed} väliin jäänyttä päivää) ${cost} kolikolla.`,
	restoreButton: 'Palauta putki',
	restored: (streak: number) => `Putki palautettu! Putkesi on nyt ${streak} päivää.`,
	restoreReminder: 'Muista avata arkku vielä tänään, niin putki jatkuu.',
	notEnoughCoins: (missing: number) => `Kolikot eivät riitä — tarvitset vielä ${missing} kolikkoa.`,

	// Haamutili
	ghostReminder:
		'Edistymisesi on tallessa vain tässä selaimessa. Jos tyhjennät selaimen tiedot tai vaihdat laitetta, edistymisesi katoaa. Luo tunnus, niin se säilyy.',
	ghostBadge: 'Haamupelaaja',
	createAccount: 'Luo tunnus',

	// Tunnus ja kirjautuminen
	login: 'Kirjaudu sisään',
	logout: 'Kirjaudu ulos',
	email: 'Sähköpostiosoite',
	password: 'Salasana',
	passwordAgain: 'Salasana uudelleen',
	displayName: 'Nimimerkki',
	displayNameHelp: '3–20 merkkiä. Näkyy kaikille pelaajille tulostaululla.',
	registerSubmit: 'Luo tunnus',
	loginSubmit: 'Kirjaudu',
	forgotPassword: 'Unohditko salasanasi?',
	changePassword: 'Vaihda salasana',
	currentPassword: 'Nykyinen salasana',
	newPassword: 'Uusi salasana',
	verifyEmailSent: 'Lähetimme vahvistusviestin sähköpostiisi. Nimimerkkisi näkyy muille, kun osoite on vahvistettu.',
	emailVerified: 'Sähköpostiosoitteesi on vahvistettu. Tervetuloa aarteenetsijäksi!',
	resetRequested: 'Jos osoitteella on tunnus, lähetimme siihen ohjeet salasanan vaihtamiseen.',
	resetDone: 'Salasana vaihdettu. Voit nyt kirjautua sisään.',
	saveChanges: 'Tallenna muutokset',
	saved: 'Tallennettu.',

	// Ensikäynnistys
	introTitle: 'Tervetuloa aarteenetsijäksi!',
	introBody1:
		'Aurora kätkee joka yö aarrearkkuja eri puolille Järvenperää. Kävele arkun luo, napauta se auki ja kerää kolikot.',
	introBody2:
		'Avaa vähintään yksi arkku päivässä, niin putkesi kasvaa. Tulostaululta näet, kuka on löytänyt eniten aarteita.',
	introLocation:
		'Auroran aarrejahti käyttää sijaintiasi vain aarteiden etsimiseen. Sijaintiasi ei tallenneta seurantaa varten.',
	introStart: 'Aloita seikkailu',

	// Asetukset
	account: 'Tunnus',
	appInfo: 'Tietoa sovelluksesta',
	sourceCode: 'Lähdekoodi',
	mapAttribution: 'Karttatiedot © OpenStreetMapin tekijät',

	// Suunnan ohje
	rotatePortrait: 'Käännä laite pystyasentoon.',

	// Virheet (API-koodi → viesti)
	errors: {
		TOO_FAR: 'Olet vielä liian kaukana arkusta. Kävele lähemmäs!',
		ALREADY_LOOTED: 'Olet jo avannut tämän arkun.',
		CHEST_EXPIRED: 'Tämä aarre ei ole enää saatavilla.',
		NOT_RESTORABLE: 'Putkea ei voi enää palauttaa.',
		INSUFFICIENT_COINS: 'Kolikkosi eivät riitä.',
		INVALID_CREDENTIALS: 'Väärä sähköpostiosoite tai salasana.',
		EMAIL_TAKEN: 'Osoitteella on jo tunnus.',
		NAME_TAKEN: 'Nimimerkki on jo käytössä. Valitse toinen.',
		NAME_INVALID: 'Nimimerkissä voi olla 3–20 merkkiä: kirjaimia, numeroita, välilyöntejä ja väliviivoja.',
		NAME_BLOCKED: 'Tämä nimimerkki ei ole sallittu. Valitse toinen.',
		PASSWORD_TOO_SHORT: 'Salasanan on oltava vähintään 10 merkkiä pitkä.',
		PASSWORD_TOO_COMMON: 'Tämä salasana on liian yleinen. Valitse omaperäisempi.',
		WRONG_PASSWORD: 'Nykyinen salasana on väärä.',
		TOKEN_INVALID: 'Linkki on vanhentunut tai jo käytetty. Pyydä uusi.',
		RATE_LIMITED: 'Liian monta yritystä. Odota hetki ja yritä uudelleen.',
		UNAUTHORIZED: 'Kirjaudu sisään jatkaaksesi.',
		GHOST_ONLY: 'Tämä toiminto ei ole käytettävissä haamupelaajille.',
		ACCOUNT_DISABLED: 'Tunnuksesi on suljettu. Ota yhteyttä ylläpitoon.',
		NOT_FOUND: 'Pyydettyä tietoa ei löytynyt.',
		INVALID_INPUT: 'Tarkista syöttämäsi tiedot.',
		SERVER_ERROR: 'Jokin meni pieleen. Yritä hetken kuluttua uudelleen.'
	} as Record<string, string>,

	errorMessage(code: string): string {
		return this.errors[code] ?? this.errors.SERVER_ERROR;
	},

	/** 200 m / 1,2 km — suomalainen muotoilu */
	formatDistance(meters: number): string {
		if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
		return `${(Math.round(meters / 100) / 10).toString().replace('.', ',')} km`;
	}
};
