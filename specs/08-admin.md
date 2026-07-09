# 08 — Admin console

A separate route group (`/yllapito`) in the same SvelteKit app, visible only to users with `is_admin`. Desktop-friendly layout is allowed here (admins work on laptops), but it must remain usable on a phone — an admin standing at a new spawn location should be able to add the point on the spot.

Admin UI language: Finnish, same quality bar as the game.

## Access

- `is_admin` flag on the user row; granted only via a bootstrap script / SQL on the server (no self-service, no UI for granting at MVP).
- Admin routes 404 for non-admins (no acknowledgement the console exists).
- Admins are regular players too; the flag adds capabilities, it does not create a separate account.

## Views

### Spawn points (Kätköpaikat)

- Full-screen map (same MapLibre setup, rectangular here) with all spawn points: green = active, grey = inactive.
- **Add:** tap/click the map → marker + form (name, notes, active). **Edit:** select marker → edit fields or drag to move. **Deactivate/reactivate** any point; **delete** only if it has never spawned a chest.
- A "use my location" button fills coordinates from the admin's GPS — the on-site workflow.
- Shows today's spawned chests distinctly (chest icon) so admins can see the live day at a glance.
- Guidance text reminds: public access, pedestrian-safe, no private property.

### Users (Pelaajat)

- Table: name, kind (ghost/registered), email (registered only), loots, coins, current streak, created, disabled?
- Detail view: recent loots with submitted coordinates and accuracy (troubleshooting "the game said I was too far"), coin ledger, streak history (restores included).
- Actions: reset name, disable/enable account.

### Reports (Ilmoitukset)

- Queue of open name reports: reported name, report count, first reported at.
- Actions per report: dismiss / reset name (see [07-auth-and-accounts.md](07-auth-and-accounts.md)). Resolution is logged (who, when, what).

### Settings (Asetukset)

- `daily_chest_count` (default 5) and `loot_radius_m` (default 15).
- "Respawn today's chests" escape hatch — allowed only while today has zero loots, for fixing a bad spawn morning.

## Out of scope at MVP

- Analytics dashboards, spawn-point popularity stats, and manual chest placement for special events — all natural post-MVP additions on top of the same data.
