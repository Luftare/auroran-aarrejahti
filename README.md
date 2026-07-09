# Auroran aarre

Auroran aarre on suomenkielinen, selaimessa toimiva paikallinen seikkailupeli: Aurora kätkee
joka yö aarrearkkuja eri puolille Järvenperää, ja pelaajat kävelevät arkuille, napauttavat ne
auki ja keräävät kolikoita. Päiväputki ja yhteinen tulostaulu kannustavat päivittäiselle
kävelylle uusia reittejä pitkin.

Pelin määrittely on kansiossa [`specs/`](specs/README.md) ja tuotantoasennuksen ohjeet
kansiossa [`deploy/`](deploy/README.md).

## Kehitys

```bash
npm install
npm run dev
```

Kehityskäytössä ei tarvita tietokanta-asennusta: ilman `DATABASE_URL`-ympäristömuuttujaa
sovellus käyttää sulautettua PGlite-tietokantaa (`.dev-db/`) ja kylvää Järvenperän
esimerkkikätköpaikat automaattisesti. Vahvistus- ja palautussähköpostit tulostuvat
terminaaliin, ellei SMTP:tä ole määritetty.

Ylläpitotunnus luodaan käynnistyksessä ympäristömuuttujista:

```bash
ADMIN_EMAIL=sinä@example.fi ADMIN_PASSWORD=vahva-salasana npm run dev
```

Sijainnin simulointi työpöytäselaimessa: DevTools → Sensors → Location → syötä koordinaatit
(esim. `60.2762, 24.6394`, demo­kätkö "Lammen laituri").

## Tekniikka

SvelteKit (Svelte 5) + TypeScript · PostgreSQL + Drizzle ORM (kehityksessä PGlite) ·
MapLibre GL + OpenFreeMap-laatat · PWA. Tuotannossa Docker Compose: Caddy → Node → Postgres.

Karttatiedot © [OpenStreetMapin](https://www.openstreetmap.org/copyright) tekijät.

## Lisenssi

MIT — katso [LICENSE](LICENSE). Julkinen lähdekoodi, yksityinen asennus: tuotantopalvelimen
salaisuudet (`.env`) eivät koskaan kuulu tähän repositorioon.
