#!/usr/bin/env bash
# Nightly database backup. Install on the server crontab:
#   10 3 * * * /opt/aarre/deploy/backup.sh >> /var/log/aarre-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/aarre}"
COMPOSE_DIR="$(cd "$(dirname "$0")" && pwd)"
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y-%m-%d)"
FILE="$BACKUP_DIR/aarre-$STAMP.sql.gz"

docker compose -f "$COMPOSE_DIR/compose.yml" exec -T postgres \
	pg_dump -U aarre aarre | gzip > "$FILE"

find "$BACKUP_DIR" -name 'aarre-*.sql.gz' -mtime "+$KEEP_DAYS" -delete
echo "$(date -Is) backup ok: $FILE ($(du -h "$FILE" | cut -f1))"

# Off-server copy (recommended): configure rclone with an S3-compatible bucket
# (e.g. UpCloud Object Storage) and uncomment:
# rclone copy "$FILE" aarre-backups:aarre/ --s3-storage-class STANDARD
