# 04 — Architecture

## Stack summary

| Layer | Choice | Why |
|---|---|---|
| Framework | **SvelteKit** (Svelte 5, TypeScript) | Smallest practical runtime for a game UI driven by CSS/TS animations; compiles away the framework. One project serves both the frontend and the API (server routes), which is what lets the whole backend fit a 1 GB VM as a single Node process. |
| Map | **MapLibre GL JS** with OpenStreetMap-based vector tiles from **OpenFreeMap** (free, no API key). Fallback option: raster OSM tiles under the OSMF tile usage policy — trivial traffic at 20 users. | Real map tiles per the settled decision; MapLibre gives smooth pinch-zoom inside the circular mask. |
| Database | **PostgreSQL 16** | Boring, reliable; comfortable at 128 MB shared_buffers on the small VM. |
| DB access | **Drizzle ORM** + `postgres.js` | Type-safe schema that doubles as migration source; negligible overhead. |
| Auth | Self-implemented sessions (see [07-auth-and-accounts.md](07-auth-and-accounts.md)) | The slim-stack decision; ~300 lines instead of a 2 GB Supabase deployment. |
| Email | **Brevo** (French/EU, GDPR-compliant; free tier 300 mails/day) over SMTP | Verification and password-reset mail for ~20 users is a few mails a week. |
| Reverse proxy / TLS | **Caddy** | Automatic Let's Encrypt; two-line config. |
| Packaging | **Docker Compose** (caddy, app, postgres) | One-file deployment on the UpCloud VM ([09-deployment.md](09-deployment.md)). |

**Not chosen:** the self-hosted Supabase stack (Postgres + GoTrue + PostgREST + Kong + Realtime + Storage + Studio) needs ~2 GB+ RAM and a dozen containers — it does not fit the 3 €/mo UpCloud tier and is far more machinery than a 20-player game needs. The slim stack above delivers the same capabilities (Postgres, auth with email verification, typed API) in one process.

## PWA

- `manifest.webmanifest`: name *Auroran aarrejahti*, `display: standalone`, `orientation: portrait`, theme/background colors from the aurora palette, maskable icons.
- Service worker (SvelteKit's built-in `$service-worker` module):
  - Precache the app shell (HTML, JS, CSS, chest SVGs, icons).
  - Runtime cache map tiles with a stale-while-revalidate strategy and a size cap — Järvenperä is small, so the playable area's tiles effectively become available offline.
  - API requests are network-only: looting requires connectivity by design (server-authoritative loot).
- Offline behavior: the shell opens, the pouch shows cached totals, and the action area explains that finding treasures needs a connection.
- No install prompts beyond the browser's own at MVP. HTTPS everywhere (required by geolocation, service workers, and sane cookies alike).

## Geolocation

- `navigator.geolocation.watchPosition` with `enableHighAccuracy: true` while the main view is visible; the watch is released when the tab is hidden to save battery.
- Distance to chests computed client-side with the haversine formula for the live "distance to nearest" display.
- **In-range check** (client, for switching to chest view): `distance ≤ lootRadius + min(accuracy, 20 m)` where `lootRadius = 15 m`.
- **Server-side validation** (authoritative, on the loot request): same formula using the submitted coordinates and accuracy. The client sends `{lat, lng, accuracy}`; the server recomputes the distance to the chest and rejects out-of-range requests with a Finnish error the UI can show verbatim.
- The player's coordinates are used transiently for validation and stored only on loot events (for admin debugging), never as a movement trail. This is stated in the privacy note.

## Client architecture notes

- **State:** Svelte stores/runes; no external state library. Server state fetched via SvelteKit `load` + a small typed fetch wrapper; the chest list for the day is fetched once and updated optimistically on loot.
- **Animations:** CSS keyframes and transitions driven by TS state (chest shake per tap, coin arc via CSS custom properties for the trajectory, streak flame). `prefers-reduced-motion` respected — reduced variants swap arcs for fades.
- **Circle map mask:** a wrapper div with `border-radius: 50%` and `overflow: hidden` over the MapLibre canvas; zoom controls absolutely positioned inside the circle's bottom-right. MapLibre's attribution control is kept visible (licence requirement) in a compact corner.
- **Time zone:** all "day" logic (chest validity, streaks) uses **Europe/Helsinki** dates computed on the server. The client never decides what day it is for game purposes.

## Daily spawn job

- A scheduled job at 00:00 Europe/Helsinki creates the day's chests (select spawn points, roll coin counts per the rarity table).
- Implementation: an in-process scheduler (`node-cron`) inside the SvelteKit server process, guarded by an idempotent "chests already exist for date X" check — so a restart at 00:01 cannot double-spawn and a missed tick is healed on the next app start or first request of the day (lazy fallback: the today-chests endpoint triggers generation if the day's chests are missing).
- No separate worker container; one process keeps the memory budget.

## Repository & openness

- Single public monorepo (this repository): `src/` (SvelteKit app), `specs/`, `deploy/` (compose file, Caddyfile, scripts).
- The deployment is private: all secrets (DB password, session pepper, Brevo API key, admin bootstrap) live in an untracked `.env` on the server. Spawn point coordinates are data in the private database, not code — though they are inherently visible to players through the app.
- Licence: MIT (or the owner's preference), with the OSM attribution obligations documented in the README.
