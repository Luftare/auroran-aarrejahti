# Auroran aarrejahti

Auroran aarrejahti on suomenkielinen, selaimessa toimiva paikallinen seikkailupeli: Aurora
kätkee joka yö aarrearkkuja ennalta määriteltyihin paikkoihin, ja pelaajat kävelevät arkuille
ja napauttavat ne auki. Päiväputki kannustaa palaamaan pelin ääreen joka päivä.

Peli toimii **kokonaan selaimessa ilman palvelinta**: kaikki data (kerätyt arkut, putki)
säilyy laitteen IndexedDB:ssä, ja päivän arkkupaikat valitaan deterministisellä algoritmilla,
jonka siemenenä on päivämäärä — kaikki pelaajat näkevät samat arkut ilman keskuspalvelinta.
Julkaisuun riittää staattinen tiedostohosting.

Tässä vaiheessa peli on tarkoituksella riisuttu kokeiluversio: ei tunnuksia, ei nimimerkkejä,
ei tulostaulua. Fokus on aarteen keräämisen tuntumassa ja siinä, palaako pelaaja peliin
päivittäin. Vanha palvelinpohjainen versio (tilit, tulostaulu, ylläpito) löytyy
git-historiasta.

Pelin alkuperäinen laajempi määrittely on kansiossa [`specs/`](specs/README.md).

## Kehitys

```bash
npm install
npm run dev
```

**Liikkuminen ilman ulkoilua:** WASD-näppäimet ohjaavat pelaajan sijaintia (50 m/s) ja
ohittavat oikean GPS-sijainnin — ensimmäinen painallus kytkee debug-tilan päälle. Ilman
sijaintilupaa kävely alkaa pelialueen laidalta.

Päivän arkut määrittää `src/lib/game/chests.ts`: slottilista ja päivämäärästä johdettu
deterministinen valinta.

## Tekniikka

SvelteKit (Svelte 5) + TypeScript · staattinen julkaisu (`@sveltejs/adapter-static`) ·
IndexedDB · MapLibre GL + OpenFreeMap-laatat · Lucide-ikonit · PWA.

Karttatiedot © [OpenStreetMapin](https://www.openstreetmap.org/copyright) tekijät.

## Lisenssi

MIT — katso [LICENSE](LICENSE).
