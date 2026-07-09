# 06 — API

SvelteKit server routes under `/api`. JSON in/out. Authentication via an HttpOnly, Secure, SameSite=Lax session cookie for both ghosts and registered users (a ghost exchanges its device secret for a session like a password login). All error responses carry `{ code, message }` where `message` is player-ready Finnish.

Route names and payloads are in English (developer-facing); only `message` strings are Finnish.

## Auth & account

| Method & path | Purpose |
|---|---|
| `POST /api/ghost` | Create a ghost account. Returns `{ deviceSecret, user }` and sets a session cookie. The client stores `deviceSecret` in IndexedDB. |
| `POST /api/ghost/login` | Re-authenticate with `{ deviceSecret }` when the session has expired. |
| `POST /api/auth/register` | Upgrade current ghost (if session present) or create a fresh account: `{ email, password, displayName }`. Sends verification email. Display name uniqueness + profanity-basics validated server-side. |
| `POST /api/auth/login` | `{ email, password }` → session cookie. |
| `POST /api/auth/logout` | Destroy session. |
| `POST /api/auth/verify` | `{ token }` from the emailed link. |
| `POST /api/auth/request-reset` | `{ email }` → password-reset email. Always responds 200 (no account enumeration). |
| `POST /api/auth/reset` | `{ token, newPassword }`. |
| `GET /api/me` | Current user: name, avatar kind, coins (ledger sum), streak, best streak, loot total, restorable-streak offer if any. |
| `PATCH /api/me` | Registered users: change display name; password change with current-password check. Ghosts: 403. |

## Game

| Method & path | Purpose |
|---|---|
| `GET /api/chests/today` | Today's chests for the current player: `[{ id, lat, lng, looted }]`. **Coin counts are not included** — the reveal happens at the chest. Triggers lazy spawn generation if the daily job was missed. |
| `POST /api/chests/:id/loot` | Body `{ lat, lng, accuracy }`. Validates: chest is today's; not already looted by this player; distance ≤ `loot_radius + min(accuracy, 20)`. On success (single transaction): insert `loots` row, insert `coin_transactions` (+N), update streak fields; returns `{ coinCount, coins, streak, isFirstLootToday }`. Errors: `TOO_FAR` (with server-computed distance), `ALREADY_LOOTED`, `CHEST_EXPIRED`. Rate-limited ~5/min per user. |
| `GET /api/leaderboard?period=all\|today` | `[{ rank, displayName, isGhost, loots, streak }]` — top 50 plus the caller's own row. |
| `POST /api/streak/restore` | Validates the gap is 1–3 missed days and the price for the current gap; checks ledger balance; inserts `streak_restores` + negative `coin_transactions`, updates streak. Errors: `NOT_RESTORABLE`, `INSUFFICIENT_COINS`. |
| `POST /api/reports` | `{ reportedUserId }` — report an inappropriate name. Duplicate open reports are idempotent 200s. |

## Admin (require `is_admin`; 404 for everyone else)

| Method & path | Purpose |
|---|---|
| `GET/POST /api/admin/spawn-points`, `PATCH/DELETE /api/admin/spawn-points/:id` | CRUD; delete only when never used by a chest, otherwise deactivate. |
| `GET /api/admin/users` | List users with loots, coins, streak, created date, kind, disabled state. |
| `GET /api/admin/users/:id` | Detail incl. recent loots (with submitted positions) and ledger. |
| `POST /api/admin/users/:id/reset-name` | Replace name with a generated ghost-style name (moderation action). |
| `POST /api/admin/users/:id/disable` / `enable` | Soft-disable an account. |
| `GET /api/admin/reports` | Open reports queue. |
| `POST /api/admin/reports/:id/resolve` | `{ action: 'dismiss' \| 'reset_name' }`. |
| `GET/PATCH /api/admin/settings` | `daily_chest_count`, `loot_radius_m`. |
| `POST /api/admin/chests/respawn-today` | Regenerate today's chests (destructive: only if no loots exist for today; otherwise 409). Escape hatch for spawn misconfiguration. |

## Cross-cutting rules

- **Validation** with zod schemas shared between client and server code.
- **Transactions:** loot and restore endpoints are single DB transactions; the unique constraints (`loots(user_id, chest_id)`) are the final consistency guard against double-taps and races.
- **Rate limiting:** simple in-memory token bucket per user id + per IP on auth and loot endpoints (single-process deployment makes this sufficient).
- **CSRF:** SameSite=Lax cookies + origin check on mutating requests (SvelteKit's built-in origin protection).
- **No account enumeration:** register/reset endpoints return uniform responses.
- **Privacy:** only loot events store coordinates; nothing else about location is persisted. Admin endpoints are the only readers.
