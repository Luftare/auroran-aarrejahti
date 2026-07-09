# 03 — UI & UX

## Design principles

- **Mobile portrait only.** Layout is designed for ~360–430 px wide phone screens. In landscape, a full-screen overlay asks the player to rotate: *"Käännä laite pystyasentoon."* Detection via CSS media query `(orientation: landscape)`; no layout is maintained for landscape.
- **One screen carries the game.** The main view contains everything needed for the core loop. Secondary views (leaderboard, pouch, settings) are one tap away and one tap back.
- **CSS + TypeScript animations only.** No animation libraries, no canvas game engine. Chest shakes, coin flights, streak flames etc. are CSS transforms/keyframes orchestrated from TS. The map is the only WebGL surface (MapLibre).
- **Aurora visual theme.** Dark blue-green night palette with aurora gradient accents (greens, violets). Coins are warm gold for contrast. Must remain legible outdoors in sunlight — test contrast in light conditions, and keep a high-contrast mode in mind for later.

## Main view layout (top to bottom)

```
┌──────────────────────────────┐
│  ⚙ asetukset      🔥 12  ● 137 │   ← status row: settings, streak, coins
│                              │
│      ╭────────────────╮      │
│     ╱                  ╲     │
│    │    CIRCULAR MAP    │    │   ← large circle, ~90 % of screen width
│    │   (MapLibre GL)    │    │
│     ╲              [+] ╱     │   ← zoom buttons, bottom-right
│      ╰──────────── [–]╯      │     inside the circle's edge
│                              │
│  ┌──────────────────────┐    │
│  │ Lähin aarre on 200 m │    │   ← action area
│  │ päässä — kävele      │    │
│  │ lähemmäs!            │    │
│  └──────────────────────┘    │
│                              │
│   [ Tulostaulu ]  [ Kukkaro ] │   ← navigation buttons
└──────────────────────────────┘
```

### Status row

- **Settings** (asetukset): gear icon, opens the settings view.
- **Streak** (putki): current streak with a small aurora-flame icon. Tapping shows a popover with current and best streak, and the restore offer if applicable.
- **Coins** (kolikot): current balance with a coin icon.

### Circular map area

- A circle (CSS `border-radius: 50%` mask over the MapLibre canvas) showing OpenStreetMap tiles of Järvenperä.
- Shows: the player's position (pulsing dot with accuracy halo), today's unlooted chests (chest markers), and already-looted chests faded out or hidden (player choice? — MVP: hidden).
- **Zoom buttons** `+` / `–` at the bottom-right inside the circle. Pinch-zoom and pan also work; a re-center button appears when the map has been panned away from the player.
- Default view: centered on the player, zoomed to show the player and the nearest chest when practical.

### Action area

A single prominent card whose content is state-driven:

| State | Content |
|---|---|
| Locating | *"Etsitään sijaintiasi…"* + spinner |
| Location denied | *"Peli tarvitsee sijaintisi löytääkseen aarteet. Salli sijainti selaimen asetuksista."* |
| Chests remain, none in range | *"Lähin aarre on 200 m päässä — kävele lähemmäs!"* (distance updates live, rounded: nearest 10 m under 1 km, else 0.1 km) |
| Chest in range | The action area and map circle switch to the **chest view** (below) |
| All looted | *"Löysit kaikki tämän päivän aarteet! Uudet aarteet ilmestyvät keskiyöllä."* |
| No chests today (misconfig) | *"Aurora ei ole vielä kätkenyt tämän päivän aarteita."* |

### Chest view (in-range)

- The circle area is taken over by a large treasure chest illustration (SVG, animated with CSS).
- Prompt: *"Napauta arkkua avataksesi sen!"*
- Each tap: chest shakes, one coin pops out and arcs to the coin counter; haptic feedback via `navigator.vibrate` where supported.
- Final tap: lid bursts open, remaining sparkle animation, summary: *"Sait 7 kolikkoa!"* plus streak feedback on the first loot of the day: *"Putkesi jatkuu — 13. päivä!"*
- A back arrow returns to the map without penalty at any point (the loot is already committed server-side; reopening the chest view resumes the remaining taps).

## Secondary views

### Leaderboard (Tulostaulu)

- Tabs: **Kaikkien aikojen** / **Tänään**.
- Rows: rank, avatar, name, loots, streak. The player's own row is highlighted and pinned to the bottom if off-screen.
- Overflow menu (⋯) on every other player's row → *"Ilmoita sopimattomasta nimestä"* (report flow in [07-auth-and-accounts.md](07-auth-and-accounts.md)).

### Pouch (Kukkaro)

- Coin balance, total chests opened, current and best streak.
- Streak restore purchase lives here (and via the streak popover).
- Post-MVP: item collection appears here.

### Settings (Asetukset)

- Account section:
  - Ghost: shows the random name + ghost avatar, the reminder *"Edistymisesi on tallessa vain tässä selaimessa. Luo tunnus, niin se säilyy ja voit vaihtaa laitetta."* and a **Luo tunnus** (create account) button that upgrades the ghost in place.
  - Registered: display name (editable), email, **Kirjaudu ulos** (logout), password change.
- App info: version, source code link (open source), attribution (© OpenStreetMap contributors — required by the tile licence).

## First-run experience

1. Brief 2-panel intro (skip button): what the game is, how looting works.
2. Geolocation permission request with a plain-language explanation *before* the browser prompt: *"Auroran aarrejahti käyttää sijaintiasi vain aarteiden etsimiseen. Sijaintiasi ei tallenneta seurantaa varten."*
3. A ghost account is created automatically; the player lands on the main view and can play immediately.
4. A dismissible banner reminds ghost players (gently, max once per week) that their progress lives only in this browser.

## Language: high-quality Finnish

All player-facing text is idiomatic Finnish. English terms are banned from the UI, including loanword hybrids. Canonical glossary — use these consistently everywhere:

| Concept | Finnish term | Avoid |
|---|---|---|
| treasure | aarre | treasure, loot |
| treasure chest | aarrearkku | boksi, looti |
| coin(s) | kolikko, kolikot | coinit |
| streak | putki | streak, striikki |
| restore streak | palauta putki | restoraus |
| leaderboard | tulostaulu | leaderboard, ranking |
| inventory/wallet | kukkaro | inventaario, inventory |
| ghost player | haamupelaaja | guest, anonyymi käyttäjä |
| sign up / create account | luo tunnus | rekisteröidy (acceptable but heavier), sign up |
| log in / out | kirjaudu sisään / ulos | login, logout |
| settings | asetukset | setit |
| report (a name) | ilmoita sopimattomasta nimestä | reportata |
| admin | ylläpito | admin (in UI; "admin" acceptable in code) |

Writing rules:

- Address the player as **sinä**, in a friendly but not childish register.
- Numbers with proper Finnish formatting: space as thousands separator, comma as decimal separator, `200 m`, `1,2 km`.
- Dates and times in Finnish convention (`24.12.`, `18.30`).
- Code, commit messages, API routes, and developer docs are in English; only player-facing and admin-facing UI text is Finnish.
- All UI strings live in a single strings module (`fi.ts`) — no hard-coded literals in components — so the language can be proofread in one place.
