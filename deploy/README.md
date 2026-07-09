# Deployment (UpCloud, 1 GB VM)

One VM runs everything via Docker Compose: Caddy (TLS) → SvelteKit app → PostgreSQL.

## First-time setup

1. **Create the server**: UpCloud → Deploy server → Developer plan 3 €/mo (1 vCPU / 1 GB), zone `fi-hel`, Ubuntu 24.04 LTS, SSH key auth. In the UpCloud firewall allow TCP 22, 80, 443 only.

2. **Point DNS**: an `A` record for your domain → the server's IPv4 (and `AAAA` for IPv6).

3. **Prepare the server** (as root):

   ```bash
   apt-get update && apt-get -y upgrade
   apt-get -y install docker.io docker-compose-v2 unattended-upgrades
   # 1 GB swap as a safety net on the small VM
   fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
   echo '/swapfile none swap sw 0 0' >> /etc/fstab
   ```

4. **Install the app**:

   ```bash
   mkdir -p /opt/aarre && cd /opt/aarre
   # copy deploy/compose.yml, deploy/Caddyfile, deploy/backup.sh from the repo
   # copy deploy/.env.example to .env and fill in every value
   docker compose -f compose.yml --env-file .env up -d
   ```

   The app runs migrations automatically on start and creates the admin user
   from `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

5. **Backups**: `crontab -e` →
   `10 3 * * * BACKUP_DIR=/var/backups/aarre /opt/aarre/backup.sh >> /var/log/aarre-backup.log 2>&1`
   Configure `rclone` for off-server copies (see backup.sh).

6. **Uptime monitoring**: point a free checker (e.g. UptimeRobot) at `https://<domain>/api/health`.

## Updating

CI builds `ghcr.io/<owner>/auroran-aarre:latest` on every push to `main`. On the server:

```bash
cd /opt/aarre && docker compose pull app && docker compose up -d app
```

Rollback: set `APP_IMAGE` in `.env` to a previous `:sha` tag and `docker compose up -d app`.

> The image is pulled, never built on the server — a Vite build does not fit 1 GB RAM.
> If GHCR is unavailable, build locally (`docker build -t aarre .`), then
> `docker save aarre | ssh server docker load` and set `APP_IMAGE=aarre`.

## First game-day checklist

1. Log in with the admin account → `/yllapito`.
2. Add real spawn points on the map (walk to them and use "Lisää nykyiseen sijaintiini").
3. Set the daily chest count under Asetukset.
4. Use "Arvo tämän päivän arkut uudelleen" once points exist, so today has chests.

## Restore drill

```bash
# fresh VM, steps 3–4 above, then:
gunzip -c aarre-YYYY-MM-DD.sql.gz | docker compose exec -T postgres psql -U aarre aarre
docker compose restart app
```
