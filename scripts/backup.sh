#!/usr/bin/env bash
# CMPA Hub — Daily Database Backup
# Cron suggested: 0 3 * * * /var/cmpa/scripts/backup.sh >> /var/cmpa/logs/backup.log 2>&1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# Source DATABASE_URL from .env
set -a
# shellcheck disable=SC1091
source .env
set +a

: "${DATABASE_URL:?DATABASE_URL must be set in .env}"

BACKUP_DIR="/var/cmpa/backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M)
BACKUP_FILE="${BACKUP_DIR}/cmpa-${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Starting backup → ${BACKUP_FILE}"

# Run pg_dump via the app container (which has Prisma + node-postgres compatible binaries)
# We use psql client from the host if available; otherwise fall back to docker
if command -v pg_dump >/dev/null 2>&1; then
  pg_dump "$DATABASE_URL" --format=plain --no-owner --no-acl | gzip > "$BACKUP_FILE"
else
  # Use a transient postgres:16-alpine container to run pg_dump
  docker run --rm \
    --network=cmpa-hub_default \
    -e PGPASSWORD \
    postgres:16-alpine \
    pg_dump "$DATABASE_URL" --format=plain --no-owner --no-acl | gzip > "$BACKUP_FILE"
fi

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date -Iseconds)] Backup complete (${SIZE})"

# Retention: delete backups older than N days
DELETED=$(find "$BACKUP_DIR" -name "cmpa-*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -delete -print | wc -l)
if [[ "$DELETED" -gt 0 ]]; then
  echo "[$(date -Iseconds)] Pruned ${DELETED} backup(s) older than ${RETENTION_DAYS} days"
fi

echo "[$(date -Iseconds)] Done."
