# 09 — Deployment & operations

## Host

**UpCloud Developer plan, 3 €/mo tier**: 1 vCPU, 1 GB RAM, 10 GB storage, 1 TB transfer — Helsinki (fi-hel) zone. This is sufficient *because* of the slim-stack decision; it would not run Supabase.

### Capacity check for ~20 players

- Traffic: ~20 sessions/day, a position-driven UI that talks to the server only for: today's chests (1 request/session), loots (a handful/day/player), leaderboard, auth. Well under 1 000 API requests/day.
- Map tiles come from OpenFreeMap's CDN (or OSM tile servers), not our VM.
- Memory budget (the binding constraint):

  | Process | Expected RSS |
  |---|---|
  | PostgreSQL 16 (`shared_buffers=128MB`, `max_connections=20`) | ~200 MB |
  | Node (SvelteKit, `--max-old-space-size=256`) | ~150–250 MB |
  | Caddy | ~40 MB |
  | OS + Docker | ~250 MB |
  | **Headroom** | **~250 MB** |

- Add a 1 GB swapfile as a safety net (build spikes, log bursts). **Verify at setup time** that the 3 € tier still has these specs; if the fit is uncomfortable in practice, the next tier (~7 €/mo, 2 GB) is the pressure valve — no architecture change needed.

## Topology

One VM, Docker Compose, three services:

```
caddy    → :80/:443, auto-TLS (Let's Encrypt), reverse-proxies to app
app      → SvelteKit node adapter, :3000 internal; runs migrations on start;
           in-process cron for the 00:00 spawn job
postgres → internal only, named volume for data
```

- `deploy/compose.yml`, `deploy/Caddyfile`, and a `deploy/.env.example` live in the public repo; the real `.env` (DB password, session pepper, Brevo key, domain) exists only on the server.
- Domain + DNS → the VM. HTTPS is mandatory (geolocation, service worker, cookies).
- UpCloud firewall: allow 22 (SSH, key-only), 80, 443; nothing else.

## CI/CD

- GitHub Actions on push to `main`: typecheck, lint, unit tests → build the app image → push to GHCR → SSH deploy step (`docker compose pull && docker compose up -d`). A deploy is ~1 command and rollback is re-tagging the previous image.
- The public repo's CI must not contain deployment secrets in code; they live in GitHub Actions secrets (this keeps "open source, private deployment").

## Backups

- Nightly `pg_dump` (cron on the VM) → compressed dump kept locally (7 days) **and** pushed off-server to UpCloud Object Storage (~1 €/mo extra) or any S3-compatible bucket, 30-day retention.
- Restore drill documented in `deploy/README`: fresh VM + compose + latest dump → running game. Target: under an hour of hands-on work.
- The database is small (megabytes); backups are trivial at this scale.

## Monitoring & operations

- Uptime: a free external ping service (e.g. UptimeRobot) on `/api/health` (checks DB connectivity), alerting to the admin's email.
- Logs: `docker compose logs` with journald rotation; no log stack on a 1 GB box.
- The daily spawn job logs its result; the lazy-generation fallback in the today-chests endpoint means a missed job self-heals on first open of the day.
- OS updates: unattended-upgrades for security patches; a manual monthly window for Docker image bumps.

## Cost budget

| Item | Monthly |
|---|---|
| UpCloud VM (1 GB, fi-hel) | 3,00 € |
| UpCloud Object Storage (backups) | ~1,00 € |
| Domain (~12 €/year) | ~1,00 € |
| Brevo free tier (≤300 mails/day) | 0 € |
| OpenFreeMap tiles | 0 € |
| **Total** | **~5 €/mo** |
