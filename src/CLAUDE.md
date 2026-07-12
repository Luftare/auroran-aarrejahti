# UI style guide (frontend)

Applies to everything the player sees: `src/routes/`, `src/lib/components/`
and `src/app.css`.

## Language: Finnish only in visible UI text

- Everything the player can see is in Finnish: UI strings (all in `src/lib/fi.ts`,
  never hardcoded in components) **and URL paths** — paths are visible text, so
  routes are Finnish too (e.g. `/editori`).
- No em-dashes (—) or en-dashes (–) in player-visible texts — use a period,
  comma or colon instead. (English code comments may use them freely.)
- Everything else is in English: code comments, docs, identifiers, commit messages
  and other non-visible text.

## Architecture: no server

The game runs entirely in the browser and ships as static files. All game data
(collected chests, streak, total balance) lives in IndexedDB (`src/lib/game/state.svelte.ts`).
The day's chests are picked deterministically with the date as seed (`src/lib/game/chests.ts`) —
do not add anything that requires a server connection (map tiles excepted).

## Visual style: completely flat and borderless

The game's look is **extremely flat and borderless**. This is a deliberate and
permanent choice:

- **No shadows.** No `box-shadow`, `text-shadow` or `drop-shadow` rules.
- **No glow effects.** No glow rings, no glowing edges, no halos.
- **No border lines.** No `border` or `outline` decoration on cards, buttons,
  fields or panels. Surfaces are distinguished by background color only
  (`--bg` → `--bg-raised` → `--bg-card` → `--bg-high`, darkest to lightest).
- **No gradients.** Buttons and surfaces are solid colors (`--aurora-green`, `--gold` etc.).
- Selected state is highlighted with fill (background-color change), not with a border.

Allowed exceptions — functionality, not decoration:

- The keyboard focus ring (`:focus` outline) stays, for accessibility.
- The white rings on map markers (player dot) stay so the markers stand out
  against the varying map background.
- Chest markers use a gold background and a ring in the UI button color
  (`--bg-high`) — the marker picks up the game's button style. The centered
  ground shadow and radiating sparks are game art (an enticing collectible on
  the ground), not UI chrome. In range the marker grows 1.5× and wiggles gently
  like a gift box begging to be shaken.
- On buttons floating over the map (e.g. the "Avaa aarre!" CTA) a dark ring
  (`--bg-high`) is allowed — the light map base needs the contrast.
- Outlines in game art (the chest SVG) are illustration, not UI chrome.

## Typography

- The only UI font is **Vidaloka** (serif), applied to everything through
  `body` in `app.css`; buttons and inputs use `font: inherit`. It is
  self-hosted (`static/vidaloka.woff2`, preloaded in `app.html`) — no font
  CDN, per the no-server rule. Vidaloka ships only the 400 weight, so bold
  weights are browser-synthesized. Map street names come from tile glyphs
  and keep the map style's font.

## Icons

- The icon library is **Lucide** (`@lucide/svelte`). No emoji in the UI.
- Always import icons by direct path, not from the package root (faster dev startup):
  `import Flame from '@lucide/svelte/icons/flame';`
- Established meanings: `Flame` = streak (gold, filled), `Package` = collected chests.
- A row containing an icon needs `display: inline-flex; align-items: center; gap: …`
  so the icon and text align.

## Game view

- Onboarding (`Onboarding.svelte`): new players get a four-step flow before the
  map — landing view (a CSS mock phone showing the game at a glance), Aurora's
  story (chests hidden nightly around Träskända manor in Järvenperä), how to
  play, and the location-permission ask. One message per screen ("one spoonful
  at a time"). The CTA and progress dots live in a static footer whose position
  never depends on the step's content. The seen-flag is the IndexedDB key
  `perehdytys`; location watching starts only from the final CTA tap so the
  browser permission prompt is tied to a user gesture. A debug button (book
  icon) replays the flow.
- On the landing view Aurora peeks from behind the phone mockup's right edge:
  `static/aurora.webp` is rendered twice — the base image behind the phone
  (z-index -1) and a `clip-path`-cropped copy of just her fingers on top, so
  she grips the device. The asset is a background-removed, bottom-faded cutout
  of a raw AI-generated portrait (only the cutout is kept in the repo); the
  grip line sits 10.99 % from the image's left edge — the CSS offsets in
  `Onboarding.svelte` are derived from that, so recompute them if the art
  changes.
- The map opens as an overview fitted to all of the day's chests ("where are
  today's treasures?"). The camera follows the player only after they tap the
  recenter button.
- Off-screen chests show as small half-dot hints (0.125 of the marker size,
  `--bg-high`) flush against the screen edges; they may slide all the way to
  the corners. A chest beyond a corner gets a hint on both adjacent edges.
- Full-screen map. The HUD floats on top: collected-chest count in the top left,
  streak in the top right (appears only after the first collected chest), and a
  status row (distance to the nearest treasure / location status) bottom center.
- Chests are circular thumbnails on the map; a chest within range is highlighted
  with fill and a pulse. The thumbnail image (`static/arkku.png`) is rendered from
  the 3D chest model onto a transparent background — if the model changes, re-render
  it by running `createChest` on a canvas and saving a cropped screenshot. Opening
  a chest is a full-screen view (`ChestOverlay`) — the core of the game's feel,
  keep it juicy (shake, sparks, vibration feedback).
- The chest in the opening view is a procedural Three.js model (`chest3d.ts`):
  orange plank wood, chunky gray bands, an octagonal lock plate, gold inside.
  The model is built in code — no downloadable model files, so the release stays
  static. Animations (shake, lid opening) go through the rig's `tap()`/`open()` calls.
- Opening sequence: every tap shakes the camera, spins the chest and may raise the
  loot multiplier (x1–x5; +1 level 20 %, +2 levels 5 % per tap; if nothing has
  upgraded by the last tap it grants a guaranteed x2) — the background
  changes color by level (black → green → blue → purple → orange) and ×N pops in.
  After three taps, "Näytä aarteet!" starts the dive into the keyhole; the loot
  emerges from the darkness. Each multiplier's gem is rolled separately (`rollLoot`)
  and shown one at a time from most common to rarest — best one last. Tapping
  anywhere (or the CTA) advances. The day's first collection ends in the streak
  celebration: a big flame + streak count, a week row of numbered circles (today's
  circle fills with a flame pop and a star/confetti burst). The celebration is
  deliberately a purely mental reward — do not wire it into loot rolls or any
  other game mechanic.
  Drops are weighted by rarity (most common 55 %, rarest 0.1 % — see `DROP_RATES`
  in state.svelte.ts).
  Dramatic lighting and glow are 3D game art, not UI chrome — the flatness rule
  does not apply to them.
- The camera compensates for aspect ratio (constant horizontal FOV) so the chest
  fits a narrow portrait screen.
- Gems (`gems3d.ts`): six rarity tiers from most common to rarest — light gray
  shard, green shard, blue orb, purple crystal cluster, orange shard, red shard.
  Shards are asymmetric convex shells (`shardGeometry`), each radiating mystically
  (emissive + colored light + pulsing glow sprite). `buildGem()` is a shared
  builder for future views; the debug gallery shows them all.
- **Never put a transform animation on a MapLibre marker's root element** — it
  would overwrite MapLibre's positioning. Always animate an inner element of the
  marker (see `.chest-thumb-face`).
- The WASD debug walk (`src/lib/game/player.svelte.ts`) bypasses GPS for dev
  testing (50 m/s). Don't break it — it is the only way to test the game on a desktop.
- Debug buttons (chest-opening test, gem gallery, slot-editor link, onboarding
  replay) are hidden unless the page is opened with the `?debug` query param.
- The chest-slot editor `/editori` writes locations into the repository: the
  slot-editor plugin in vite.config.ts answers POST `/__editori/slotit` and
  replaces the SLOTS block in `src/lib/game/chests.ts`. Works only on the dev
  server; the editor map keeps place names visible (unlike the game map).

## Other conventions

- All player-visible text is Finnish and lives in `src/lib/fi.ts` — no hardcoded
  strings in components.
- Roundness is the design language: chips and buttons are pills
  (`border-radius: 999px`), map controls and chest thumbnails circles.
- Svelte 5 runes (`$state`, `$derived`, `$effect`) — no legacy store syntax.
