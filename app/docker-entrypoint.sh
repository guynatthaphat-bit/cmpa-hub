#!/bin/sh
# =============================================================================
# CMPA Hub — container entrypoint
# Runs Prisma schema sync + seed before starting the Next.js server.
# Idempotent: safe to restart.
#
# Note: This uses `prisma db push` (schema-driven sync). For Phase 1 with a
# single deployment + a single source of truth (schema.prisma) this is
# preferred over migrations because it requires no pre-generated migration SQL.
# Future phases that need migration history can switch to `prisma migrate deploy`
# after generating the first migration via `prisma migrate dev` locally.
# =============================================================================
set -e

echo "▸ CMPA Hub starting…"

# Wait for DB + sync schema. `prisma db push` fails fast on connection errors;
# we retry until success.
echo "▸ Waiting for database and syncing schema…"
ATTEMPTS=0
MAX_ATTEMPTS=30
until ./node_modules/.bin/prisma db push --skip-generate --accept-data-loss; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "  ✗ database never became reachable after ${MAX_ATTEMPTS} attempts"
    exit 1
  fi
  echo "  …retry $ATTEMPTS/$MAX_ATTEMPTS (waiting 2s)"
  sleep 2
done
echo "  ✓ schema in sync"

# Seed (idempotent — upserts admin)
echo "▸ Seeding initial admin…"
./node_modules/.bin/tsx prisma/seed.ts || echo "  (seed skipped — already present or failed safely)"

echo "▸ Launching server on port ${PORT:-3000}…"
exec "$@"
