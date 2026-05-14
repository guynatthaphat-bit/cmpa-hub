#!/usr/bin/env bash
# CMPA Hub — Setup Script
# Idempotent first-time deployment. Safe to re-run.
#
# Assumes:
#   - Ubuntu/Debian host with Docker + Docker Compose v2 installed
#   - PostgreSQL 16 listening on 127.0.0.1:5432 OR accessible via host.docker.internal
#   - Ports 80 and 443 are free
#   - .env file already populated (see .env.example)

set -euo pipefail

# ---------- Color helpers ----------
RED='\033[0;31m'; GRN='\033[0;32m'; YLW='\033[0;33m'; BLU='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLU}[setup]${NC} $*"; }
ok()   { echo -e "${GRN}[ok]${NC}    $*"; }
warn() { echo -e "${YLW}[warn]${NC}  $*"; }
err()  { echo -e "${RED}[error]${NC} $*" >&2; }

# ---------- Resolve script dir / project root ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

log "Project directory: $PROJECT_DIR"

# ---------- Check .env ----------
if [[ ! -f .env ]]; then
  err ".env file missing. Copy .env.example to .env and fill in values, then re-run."
  exit 1
fi
ok ".env present"

# Source .env (for DATABASE_URL, ADMIN_EMAIL, etc.)
set -a
# shellcheck disable=SC1091
source .env
set +a

: "${DATABASE_URL:?DATABASE_URL must be set in .env}"
: "${NEXTAUTH_URL:?NEXTAUTH_URL must be set in .env}"
: "${ADMIN_EMAIL:?ADMIN_EMAIL must be set in .env}"

# ---------- Generate NEXTAUTH_SECRET if missing/placeholder ----------
if grep -qE '^NEXTAUTH_SECRET=(""|change-me-.*|)' .env 2>/dev/null || ! grep -q '^NEXTAUTH_SECRET=' .env; then
  NEW_SECRET=$(openssl rand -base64 32 | tr -d '\n')
  if grep -q '^NEXTAUTH_SECRET=' .env; then
    sed -i.bak "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=${NEW_SECRET}|" .env
  else
    echo "NEXTAUTH_SECRET=${NEW_SECRET}" >> .env
  fi
  ok "Generated NEXTAUTH_SECRET (length 44)"
fi

# ---------- Check Docker ----------
if ! command -v docker >/dev/null 2>&1; then
  err "Docker is not installed. Install via: https://docs.docker.com/engine/install/ubuntu/"
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  err "Docker Compose v2 not available. Need 'docker compose' (not legacy docker-compose)."
  exit 1
fi
ok "Docker $(docker --version | awk '{print $3}' | tr -d ',') + Compose $(docker compose version --short)"

# ---------- Create persistent dirs ----------
sudo mkdir -p /var/cmpa/storage /var/cmpa/backups /var/cmpa/letsencrypt /var/cmpa/certbot-webroot /var/cmpa/logs
sudo chown -R "$USER":"$USER" /var/cmpa
ok "Created /var/cmpa/{storage,backups,letsencrypt,certbot-webroot,logs}"

# ---------- Build images ----------
log "Building Docker images (this may take 3-5 minutes on first run)…"
docker compose build --pull
ok "Build complete"

# ---------- Start services ----------
log "Starting services (app, nginx)…"
docker compose up -d app nginx
ok "Services started"

# ---------- Wait for healthcheck ----------
log "Waiting for app to become healthy…"
for i in {1..60}; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' cmpa-app 2>/dev/null || echo "starting")
  if [[ "$STATUS" == "healthy" ]]; then
    ok "App is healthy (took ${i}s)"
    break
  fi
  if [[ "$i" == "60" ]]; then
    err "App did not become healthy within 60s. Check logs:"
    echo "  docker compose logs app | tail -50"
    exit 1
  fi
  sleep 1
done

# ---------- Obtain SSL certificate ----------
DOMAIN=$(echo "${NEXTAUTH_URL}" | sed -E 's|https?://||' | cut -d/ -f1)
log "Domain: $DOMAIN"

if [[ ! -f "/var/cmpa/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
  log "No certificate found. Requesting Let's Encrypt cert via certbot (webroot)…"
  docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "${ADMIN_EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    -d "${DOMAIN}" || {
      warn "Certbot failed. App will still run on HTTP. You can retry with:"
      echo "  docker compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d ${DOMAIN}"
    }

  if [[ -f "/var/cmpa/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
    log "Reloading nginx with new certificate…"
    docker compose exec nginx nginx -s reload
    ok "Certificate installed"
  fi
else
  ok "Certificate already present for ${DOMAIN}"
fi

# ---------- Summary ----------
echo ""
echo "============================================================"
echo "  ${GRN}CMPA Hub deployed successfully${NC}"
echo "============================================================"
echo "  URL:      ${NEXTAUTH_URL}"
echo "  Admin:    ${ADMIN_EMAIL}"
echo ""
echo "  Logs:     docker compose logs -f app"
echo "  Stop:     docker compose down"
echo "  Restart:  docker compose restart app"
echo "  Backup:   bash scripts/backup.sh"
echo "============================================================"
