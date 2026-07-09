# 02 — Game design

## Treasures

- A **spawn point** is a fixed, admin-curated outdoor location (lat/lng) in the Järvenperä area. The pool of spawn points is maintained in the admin console ([08-admin.md](08-admin.md)). Spawn points should be publicly accessible, safe to reach on foot, and legal to stand at (no private yards, no road medians).
- A **chest** (aarrearkku) is a daily instance of a spawn point. Every night at **00:00 Europe/Helsinki**, the server picks a subset of active spawn points and creates the day's chests.
  - Number of daily chests: **5** by default, configurable in admin settings.
  - Selection is random, but the previous day's exact set is avoided when the pool allows, so routes vary day to day.
  - Chests expire at the end of their day. Unopened chests simply disappear at the next midnight rollover.
- **Per-player looting.** Each player may open each of today's chests once. Opening a chest removes it from *that player's* map only. Two players can both loot the same chest.
- **Globally consistent contents.** The coin count of a chest is decided by the server at spawn time and is the same for every player. If the chest by the pond holds 7 coins, it holds 7 coins for everyone.

## Coins

- Chests drop **3–10 coins** with a steep rarity curve. The server rolls the count at spawn time using this distribution:

  | Coins | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
  |---|---|---|---|---|---|---|---|---|
  | Probability | 40 % | 24 % | 14 % | 9 % | 6 % | 4 % | 2 % | 1 % |

  (Expected value ≈ 4.4 coins per chest; a 10-coin chest appears roughly once per 100 chests, i.e. a genuinely rare event worth mentioning to friends.)
- Coins are recorded in a server-side ledger ([05-data-model.md](05-data-model.md)); the visible balance is the ledger sum. This keeps balances correct when streak restores are purchased and leaves room for future sinks and item drops.
- At MVP the **only coin sink is streak restore** (below). This is intentional: coins accumulate, which makes the eventual item shop (post-MVP) land on players who already have savings.

## Opening a chest

1. The player must be within the **loot radius: 15 m** of the chest (server-validated; configurable). Because consumer GPS is often 5–20 m off, the client compares distance against `radius + min(reported accuracy, 20 m)` for showing the chest view, and the server validates with the same leniency.
2. When in range, the map area switches to the chest view and prompts: *"Napauta arkkua avataksesi sen!"*
3. The client calls the loot endpoint; the server validates position and once-per-day-per-chest, records the loot, and returns the coin count `N`. **The loot is committed at this moment** — the tapping that follows is the reveal, so a dropped connection or a closed app mid-tap can never lose a loot or leave a half-open chest.
4. The player taps the chest **N times**. Each tap shakes one coin out with a small animation and a counter. On the final tap the chest bursts open, the coins fly into the pouch, and the totals (coins, loots, streak) update.

## Leaderboard (tulostaulu)

- **One loot = one opened chest.** The leaderboard ranks players by total opened chests.
- MVP shows two tabs: **Kaikkien aikojen** (all-time) and **Tänään** (today).
- Every player appears with their avatar and display name. Ghost players appear with the ghost avatar and their fixed random name.
- Each row shows: rank, avatar, name, loot count, current streak (small flame/aurora icon).
- Any name on the leaderboard can be reported as inappropriate ([07-auth-and-accounts.md](07-auth-and-accounts.md)).

## Daily streak (putki)

- The streak counts **consecutive calendar days (Europe/Helsinki) with at least one opened chest**.
- The first loot of a day increments the streak; further loots the same day do not.
- A day with zero loots breaks the streak.
- Both current streak and personal best are stored and shown.

### Streak restore (putken palautus)

A broken streak can be repaired with coins, but the price grows daily and the window is short:

| When purchased | Missed days covered | Price |
|---|---|---|
| On the first day after the miss | 1 | **50 coins** |
| On the second day | 2 | **150 coins** |
| On the third day | 3 | **300 coins** |
| Later | — | Not available; streak restarts from 0 |

Rules:

- Restoring fills **all** missed days at once (you cannot restore only one of two missed days) and re-links the streak as if the days had been played. Restored days do **not** add loots or coins — only streak continuity.
- The restore offer is shown prominently when the app is opened with a freshly broken streak that is still restorable: *"Putkesi katkesi! Palauta se 50 kolikolla."* with the price for the current day.
- The purchase is a ledger transaction; insufficient coins disable the button and show the shortfall.
- The player must still loot a chest on the day of the restore to keep the streak alive going forward.

## Fairness and integrity (right-sized for 20 players)

- The server is authoritative for: which chests exist today, coin counts, loot registration, distance validation, streaks, and the coin ledger.
- The client submits its coordinates and GPS accuracy with a loot request. The server rejects requests outside the radius (with the accuracy leniency above) but does not attempt device attestation, speed checks, or spoofing detection.
- Rate limiting on the loot endpoint (a few requests per minute per account) prevents accidental or scripted spam.
