# 05 — Data model

PostgreSQL 16, schema managed with Drizzle migrations. All timestamps `timestamptz`; all "game day" columns are `date` values computed in Europe/Helsinki by the server.

## Tables

### users

One row per player — ghost or registered — and admins.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| kind | enum `ghost` \| `registered` | |
| email | citext, unique, nullable | null for ghosts |
| email_verified_at | timestamptz, nullable | |
| password_hash | text, nullable | Argon2id; null for ghosts |
| display_name | text, not null, unique (case-insensitive) | ghosts: generated *Haamu + adjective + animal* name, immutable; registered: player-chosen, 3–20 chars, validated charset |
| is_admin | boolean, default false | |
| streak_current | int, default 0 | denormalized; source of truth is loots + restores, recomputed on write |
| streak_best | int, default 0 | |
| last_loot_date | date, nullable | Helsinki date of most recent loot |
| created_at / updated_at | timestamptz | |
| disabled_at | timestamptz, nullable | admin soft-disable |

Ghost authentication: a ghost's credential is a random 256-bit **device secret** issued at creation and stored in the browser (IndexedDB). It is stored server-side only as a hash, in `sessions`-like fashion via the `ghost_credentials` table below. Losing browser storage = losing the ghost account, which is exactly the caveat shown to the player.

### ghost_credentials

| Column | Type | Notes |
|---|---|---|
| user_id | uuid PK → users | one credential per ghost |
| secret_hash | text | SHA-256 of the device secret |
| created_at | timestamptz | |

On **upgrade to registered**, the user row gains email/password and `kind` flips; the credential row is deleted. All history (loots, ledger, streak) is preserved because it hangs off `users.id`.

### sessions

| Column | Type | Notes |
|---|---|---|
| id | text PK | random 256-bit token hash (store hash, cookie carries the token) |
| user_id | uuid → users | |
| created_at / expires_at | timestamptz | 30-day sliding expiry |

### email_tokens

Email verification and password reset.

| Column | Type | Notes |
|---|---|---|
| token_hash | text PK | |
| user_id | uuid → users | |
| purpose | enum `verify` \| `reset` | |
| expires_at | timestamptz | verify: 24 h; reset: 1 h |
| used_at | timestamptz, nullable | single-use |

### spawn_points

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | admin-facing label, e.g. "Lammen laituri" |
| lat / lng | double precision | |
| active | boolean, default true | inactive points are never selected |
| notes | text, nullable | admin notes (access hints, seasonal issues) |
| created_by | uuid → users | |
| created_at / updated_at | timestamptz | |

### chests

The daily instances.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| day | date | Helsinki game day |
| spawn_point_id | uuid → spawn_points | |
| coin_count | int, 3–10 | rolled at spawn; identical for all players |
| created_at | timestamptz | |
| | | unique (day, spawn_point_id) |

### loots

One row per opened chest per player. This is the leaderboard, the streak source, and the coin-earning event.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid → users | |
| chest_id | uuid → chests | |
| looted_at | timestamptz | |
| day | date | denormalized from chest for fast streak/leaderboard queries |
| lat / lng / accuracy_m | double precision | position as submitted, for admin debugging only |
| | | unique (user_id, chest_id) — enforces per-player once |

### coin_transactions

Append-only ledger. Balance = `sum(amount)` per user (cache in memory or a view; no denormalized balance column at MVP scale).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid → users | |
| amount | int | positive: loot; negative: purchase |
| kind | enum `loot` \| `streak_restore` | future: `item_purchase`, `adjustment` |
| ref_id | uuid, nullable | loots.id or streak_restores.id |
| created_at | timestamptz | |

### streak_restores

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid → users | |
| missed_days | int, 1–3 | |
| cost | int | 50 / 150 / 300 |
| restored_streak_to | int | streak value after restore |
| created_at | timestamptz | |

### name_reports

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| reporter_id | uuid → users | |
| reported_id | uuid → users | |
| created_at | timestamptz | |
| status | enum `open` \| `dismissed` \| `actioned` | |
| resolved_by | uuid → users, nullable | |
| resolved_at | timestamptz, nullable | |
| | | unique (reporter_id, reported_id, status='open') — no duplicate open reports |

### settings

Single-row (or key–value) admin-tunable config: `daily_chest_count` (default 5), `loot_radius_m` (default 15).

## Streak computation

On each first-loot-of-day and each restore, recompute:

```
if last_loot_date == today            → no change
if last_loot_date == yesterday        → streak_current += 1
if gap of 1–3 days AND a valid streak_restore covers the gap → streak continues (+1 for today)
else                                  → streak_current = 1
streak_best = max(streak_best, streak_current)
```

The denormalized fields on `users` exist for cheap leaderboard rendering; the loots + restores tables can always rebuild them (an admin maintenance task).

## Post-MVP reserved design space

Item drops will add `items` (catalog) and `user_items` (inventory) tables and a new `coin_transactions.kind`. Nothing in the MVP schema needs to change — chests can gain an `item_id` nullable column per day.
