# Käyttöliittymän tyyliohje (frontend)

Koskee kaikkea pelaajalle näkyvää käyttöliittymää: `src/routes/`, `src/lib/components/`
ja `src/app.css`.

## Arkkitehtuuri: ei palvelinta

Peli toimii kokonaan selaimessa ja julkaistaan staattisina tiedostoina. Kaikki pelidata
(kerätyt arkut, putki, kokonaissaldo) säilyy IndexedDB:ssä (`src/lib/game/state.svelte.ts`).
Päivän arkut valitaan deterministisesti päivämäärä siemenenä (`src/lib/game/chests.ts`) —
älä lisää mitään, mikä vaatii palvelinyhteyttä (karttalaattoja lukuun ottamatta).

## Visuaalinen tyyli: täysin litteä ja reunaton

Pelin ulkoasu on **erittäin litteä ja reunaton**. Tämä on tietoinen ja pysyvä valinta:

- **Ei varjoja.** Ei `box-shadow`-, `text-shadow`- eikä `drop-shadow`-määrityksiä.
- **Ei hehkuefektejä.** Ei glow-renkaita, ei hohtavia reunuksia, ei sädekehiä.
- **Ei reunaviivoja.** Ei `border`- eikä `outline`-koristelua korteissa, napeissa,
  kentissä tai paneeleissa. Pinnat erottuvat toisistaan vain taustaväreillä
  (`--bg` → `--bg-raised` → `--bg-card` → `--bg-high`, tummimmasta vaaleimpaan).
- **Ei liukuvärejä.** Napit ja pinnat ovat yksivärisiä (`--aurora-green`, `--gold` jne.).
- Valitun tilan korostus tehdään täytöllä (taustavärin vaihto), ei reunalla.

Sallitut poikkeukset — toiminnallisuutta, ei koristelua:

- Näppäimistön kohdistusrengas (`:focus`-outline) säilyy saavutettavuuden takia.
- Karttamerkkien valkoiset renkaat (pelaajapiste) säilyvät, jotta merkit erottuvat
  vaihtelevasta karttapohjasta.
- Arkkumerkeissä kultatausta ja UI-nappien värinen reunus (`--bg-high`) — merkki
  poimii pelin nappityylin. Keskitetty maavarjo ja säteilevät kipinät ovat
  pelitaidetta (houkutteleva keräilykohde maassa), eivät UI-kromia. Kantamassa
  merkki kasvaa 1,5× ja heilahtaa hennosti kuin ravisteltava lahjapaketti.
- Kartan päällä kelluvissa napeissa (esim. "Avaa aarre!" -CTA) tumma reunus
  (`--bg-high`) on sallittu — vaalea karttapohja vaatii kontrastin.
- Peligrafiikan (arkku-SVG) ääriviivat ovat kuvitusta, eivät UI-kromia.

## Ikonit

- Ikonikirjasto on **Lucide** (`@lucide/svelte`). Käyttöliittymässä ei käytetä emojeita.
- Tuo ikonit aina suoraan polulla, ei pakettijuuresta (nopeampi dev-käynnistys):
  `import Flame from '@lucide/svelte/icons/flame';`
- Vakiintuneet merkitykset: `Flame` = putki (kulta, täytettynä), `Package` = kerätyt arkut.
- Ikonin sisältävä rivi tarvitsee `display: inline-flex; align-items: center; gap: …`,
  jotta ikoni ja teksti linjautuvat.

## Pelinäkymä

- Koko ruudun kartta. HUD kelluu sen päällä: kerättyjen arkkujen määrä vasemmassa
  yläkulmassa, putki oikeassa yläkulmassa (näkyy vasta ensimmäisen kerätyn arkun jälkeen),
  tilarivi (etäisyys lähimpään aarteeseen / sijainnin tila) alhaalla keskellä.
- Arkut ovat kartalla ympyräthumbnaileja; kantaman sisällä oleva arkku korostuu täytöllä
  ja sykkeellä. Thumbnailin kuva (`static/arkku.png`) on renderöity 3D-arkkumallista
  läpinäkyvälle pohjalle — jos malli muuttuu, renderöi kuva uudelleen ajamalla
  `createChest` canvasille ja tallentamalla rajattu ruutukaappaus. Arkun avaus on koko ruudun näkymä (`ChestOverlay`) — pelin tuntuman ydin,
  pidä se mehukkaana (ravistus, hiput, tärinäpalaute).
- Avausnäkymän arkku on proseduraalinen Three.js-malli (`chest3d.ts`): oranssi lankkupuu,
  järeät harmaat vanteet, kahdeksankulmainen lukkolevy, kultaa sisällä. Malli rakennetaan
  koodissa — ei ladattavia mallitiedostoja, jotta julkaisu pysyy staattisena. Animaatiot
  (ravistus, kannen avaus) tehdään rigin `tap()`/`open()`-kutsuilla.
- Avaussekvenssi: napautus tärähdyttää kameraa (koko näkymä) ja pyöräyttää arkkua,
  kolmannella kamera sukeltaa kiihtyen avaimenreikään ja ruutu pimenee — kuin sukeltaisi
  arkun sisään. Pimeydestä paljastuu satunnainen jalokivi (`createGemView`) ja saalisteksti.
  Dramaattinen valaistus ja hehku ovat 3D-pelitaidetta, eivät UI-kromia — litteysvaatimus
  ei koske niitä.
- Kamera kompensoi kuvasuhteen (vakio vaakakulma), jotta arkku mahtuu kapeaan pystyruutuun.
- Jalokivet (`gems3d.ts`): kuusi harvinaisuusluokkaa yleisimmästä harvinaisimpaan —
  vaaleanharmaa sirpale, vihreä sirpale, sininen pallo, violetti kidesikermä, oranssi
  sirpale, punainen sirpale. Sirpaleet ovat epäsymmetrisiä kuperia kuoria
  (`shardGeometry`), kukin säteilee mystisesti (emissio + värivalo + sykkivä hehkusprite).
  `buildGem()` on jaettava rakentaja tuleville näkymille; debug-galleria näyttää kaikki.
- **MapLibre-markkereihin ei saa laittaa transform-animaatiota juurielementtiin** — se
  ylikirjoittaisi MapLibren sijoittelun. Animoi aina markkerin sisäelementtiä
  (ks. `.chest-thumb-face`).
- WASD-debug-kävely (`src/lib/game/player.svelte.ts`) ohittaa GPS:n kehitystestausta
  varten (50 m/s). Älä riko sitä — se on ainoa tapa testata peliä työpöydällä.
- Kätköpaikkaeditori `/editori` kirjoittaa paikat repositorioon: vite.config.ts:n
  slot-editor-plugin vastaa POST `/__editori/slotit` -kutsuun ja korvaa SLOTS-lohkon
  `src/lib/game/chests.ts`-tiedostossa. Toimii vain kehityspalvelimella; editorikartta
  pitää nimistön näkyvissä (toisin kuin pelikartta).

## Muut käytännöt

- Kaikki pelaajalle näkyvät tekstit ovat suomeksi ja asuvat `src/lib/fi.ts`-tiedostossa —
  ei kovakoodattuja tekstejä komponentteihin.
- Pyöreys on muotokieli: chipit ja napit ovat pillereitä (`border-radius: 999px`),
  karttakontrollit ja arkkuthumbnailit ympyröitä.
- Svelte 5 -runet (`$state`, `$derived`, `$effect`) — ei vanhaa store-syntaksia.
