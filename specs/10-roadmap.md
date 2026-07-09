# 10 — MVP scope & roadmap

## MVP definition of done

The MVP is done when a Järvenperä resident can, on their phone's browser:

1. Open the app, get a ghost account, and see today's chests on the circular map — in Finnish, in portrait, with the rotate prompt in landscape.
2. Walk to a chest, have it appear at ≤15 m, tap it open coin by coin, and see coins/loots/streak update.
3. Appear on the shared leaderboard (all-time and today).
4. Break a streak and buy it back at 50/150/300 coins within the 3-day window.
5. Create an account (email verification, password reset working), keep all ghost progress, log in on another device.
6. Report a name, and an admin can resolve it — plus manage spawn points and view players in the admin console.
7. Install it as a PWA from the browser, served over HTTPS from the UpCloud VM, with nightly backups running.

## Build order

| Phase | Contents | Rationale |
|---|---|---|
| 1. Walking skeleton | SvelteKit + Postgres + compose deploy to UpCloud; ghost account; hard-coded chest; map circle with player position | Proves geolocation, the map mask, and the deploy pipeline — the three risks — before any game logic |
| 2. Core loop | Spawn points table + daily spawn job; distance UI; loot endpoint + tap-to-open chest view; coin ledger | Playable game |
| 3. Meta layer | Streaks + restore purchase; leaderboard; pouch view | Retention mechanics |
| 4. Accounts | Registration/upgrade, email verification, password reset, settings, logout; name reports | Multi-device + moderation |
| 5. Admin console | Spawn point editor, users, reports queue, settings | Operability |
| 6. Polish & PWA | Animations pass, Finnish copy proofread (every string in `fi.ts` reviewed), service worker, manifest, icons, first-run intro, landscape prompt | Ship quality |

Field testing starts at phase 2 — real GPS behaviour at real spawn points (tree cover, building shadows) will calibrate the 15 m radius and accuracy leniency better than any simulation.

## Post-MVP backlog (in rough priority order)

1. **Item drops** — chests occasionally drop collectible items with rarities; collection screen in the pouch. Data model space already reserved.
2. **Coin sinks / shop** — avatar customization purchasable with coins (gives both coins and items purpose).
3. **Special chests** — rare shared "race" chests (first-come), event chests for holidays (juhannus, vappu…).
4. **Weekly/monthly leaderboards** and streak milestones with celebration animations.
5. **Account deletion self-service** and data export.
6. **Additional areas** — spawn point pools per area; the design already treats the area as data.
7. **Push notifications** (PWA) — "Aurora kätki uudet aarteet" morning nudge; opt-in.
8. **High-contrast / accessibility pass** — outdoor legibility, reduced motion already respected at MVP.

## Open questions (to revisit, not blockers)

- Should looted chests show as faded on the map instead of disappearing? (MVP: hidden; revisit after field testing.)
- Exact daily chest count (5) and radius (15 m) — both admin-tunable; tune with real players.
- Whether ghost players should see a streak-restore offer at all (they have coins, so yes at MVP — but watch whether it confuses anyone).
