# Auroran aarrejahti — Specification

Auroran aarrejahti ("Aurora's treasure hunt") is a Finnish-language, mobile-first PWA adventure game for the Järvenperä area. Every day, treasure chests spawn at pre-defined outdoor locations. Players walk to them, tap them open, and collect coins. A shared leaderboard and a daily streak reward consistency. The purpose is not the game itself — it is to get people outdoors on a daily walk, nudging them toward routes and places they would not otherwise visit.

## Documents

| File | Contents |
|---|---|
| [01-overview.md](01-overview.md) | Vision, goals, non-goals, target audience |
| [02-game-design.md](02-game-design.md) | Treasures, spawning, coin economy, streaks, streak restore |
| [03-ui-ux.md](03-ui-ux.md) | Screen layout, interactions, Finnish copy guidelines and glossary |
| [04-architecture.md](04-architecture.md) | Tech stack, PWA, geolocation, map rendering |
| [05-data-model.md](05-data-model.md) | Database schema |
| [06-api.md](06-api.md) | Server endpoints and validation rules |
| [07-auth-and-accounts.md](07-auth-and-accounts.md) | Ghost accounts, registration, email flows, name reporting |
| [08-admin.md](08-admin.md) | Admin console |
| [09-deployment.md](09-deployment.md) | UpCloud hosting, Docker Compose, backups, cost budget |
| [10-roadmap.md](10-roadmap.md) | MVP scope and later phases |

## Key decisions (settled)

| Question | Decision |
|---|---|
| Loot model | **Per-player**: every player can loot each of today's chests once. Chests disappear only from that player's map. |
| Map rendering | **Real map tiles**: OpenStreetMap data rendered with MapLibre GL, cropped into the circular viewport. |
| Chest contents at MVP | **Coins only** (3–10 per chest, steep rarity curve). Item drops are a fast-follow; the data model leaves room for them. |
| Backend stack | **Slim custom stack on the UpCloud 3 €/mo tier**: SvelteKit (frontend + API in one Node process) + PostgreSQL + Caddy, via Docker Compose. No Supabase — 1 GB RAM cannot host the full Supabase stack. |
| Identity | Self-implemented email + password sessions (Argon2id, server-side session table). Transactional email via an EU provider (Brevo). |
| Openness | Source code is public (open source); the deployment and its data are private. No secrets in the repository. |
