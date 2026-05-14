#!/usr/bin/env bash
# CMPA Hub — Restore from gzipped pg_dump
# Usage: bash scripts/restore.sh /var/cmpa/backups/cmpa-2026-05-13_03-00.sql.gz

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -lh /var/cmpa/backups/*.sql.gz 2>/dev/null || echo "  (none)"
  exit 1
fi

BACKUP_FILE="$1"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Error: backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

# Source DATABASE_URL
set -a
# shellcheck disable=SC1091
source .env
set +a
: "${DATABASE_URL:?DATABASE_URL must be set in .env}"

echo "============================================================"
echo "  ⚠️  WARNING: This will OVERWRITE the existing database"
echo "============================================================"
echo "  Database:    $(echo "$DATABASE_URL" | sed -E 's|.*/([^?]+).*|\1|')"
echo "  Backup file: $BACKUP_FILE"
echo "  Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "  Backup date: $(stat -c %y "$BACKUP_FILE" 2>/dev/null || stat -f '%Sm' "$BACKUP_FILE")"
echo "============================================================"
echo ""
read -p "Type 'RESTORE' (uppercase) to proceed: " CONFIRM

if [[ "$CONFIRM" != "RESTORE" ]]; then
  echo "Aborted."
  exit 0
fi

# Stop app to prevent writes during restore
echo "Stopping app container…"
docker compose stop app

echo "Restoring…"
if command -v psql >/dev/null 2>&1; then
  gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
else
  gunzip -c "$BACKUP_FILE" | docker run --rm -i \
    --network=cmpa-hub_default \
    postgres:16-alpine \
    psql "$DATABASE_URL"
fi

echo "Restarting app…"
docker compose start app

echo "Done. Verify by opening the app and checking recent activity."
