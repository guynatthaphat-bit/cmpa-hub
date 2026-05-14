# CMPA Hub

ระบบจัดการบุคลากรและปฏิบัติการของ **สมาคมสร้างเสริมอาชีพคนพิการภาคตะวันออก (สอค.ภอ)** — Mobile-first PWA สำหรับ 7 จังหวัดภาคตะวันออก

> **สถานะ:** Phase 1 — Foundation (Auth + Shell + Settings)
> **URL (VPS):** https://76-13-184-76.nip.io
> **URL (Render):** https://cmpa-hub.onrender.com (หลัง deploy)

---

## 🚀 Deployment Options

โปรเจกต์นี้รองรับ deploy 2 รูปแบบ:

### Option A: Render.com (Cloud-managed, แนะนำสำหรับเริ่มต้น)
- ค่าใช้จ่าย ~$13/เดือน (~470 บาท)
- ตั้งค่า 10 นาที, auto-deploy จาก GitHub
- ไม่ต้องดูแล server, SSL, backup
- ⚠️ Filesystem ephemeral → ต้องใช้ Cloudflare R2 สำหรับไฟล์
- 📖 ดู [`docs/RENDER_DEPLOY.md`](docs/RENDER_DEPLOY.md)

### Option B: Self-hosted VPS (Docker + nginx + Let's Encrypt)
- ค่าใช้จ่าย ~$5-10/เดือน (VPS) + ค่าโดเมน
- ควบคุมเต็มที่, ไฟล์อยู่บน disk จริง
- ต้องดูแล security updates, backup, monitoring เอง
- 📖 ดูส่วน "Self-hosted VPS Setup" ด้านล่าง

---

## Self-hosted VPS Setup

### Prerequisites

ตรวจสอบบน VPS:

```bash
# PostgreSQL 16 ต้องรันอยู่แล้ว
sudo systemctl status postgresql

# Docker + Compose plugin
docker --version          # >= 24.x
docker compose version    # >= v2.20

# Port 80, 443 ต้องว่าง
sudo ss -tlnp | grep -E ':80|:443'
```

ถ้ายังไม่มี Docker:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker
```

---

## Setup (4 commands)

```bash
# 1. คัดลอกโปรเจกต์ไปที่ /var/cmpa
sudo mkdir -p /var/cmpa && sudo chown -R $USER:$USER /var/cmpa
# (วาง zip → unzip → cd /var/cmpa)

# 2. แก้ .env (เพิ่ม ANTHROPIC_API_KEY และค่าอื่นๆ)
cp .env.example .env && nano .env

# 3. รัน setup script (สร้าง DB, generate secret, build, deploy, ขอ SSL)
bash scripts/setup.sh

# 4. ตรวจ status
docker compose ps && docker compose logs -f app
```

หลัง setup เสร็จ:

- เปิด **https://76-13-184-76.nip.io** บนมือถือ
- Login ด้วย `ADMIN_EMAIL` + `ADMIN_INITIAL_PASSWORD` ใน `.env`
- ระบบจะบังคับเปลี่ยนรหัสผ่านครั้งแรก

---

## Operations

```bash
# ดู logs
docker compose logs -f app
docker compose logs -f nginx

# Restart
docker compose restart app

# Update code → rebuild → redeploy (zero-downtime ไม่ได้ใน Phase 1 — มี downtime ~10 วินาที)
git pull   # หรือ unzip ทับ
docker compose up -d --build

# Database migration ใหม่
docker compose exec app npx prisma migrate deploy

# Database shell
sudo -u postgres psql cmpa

# Manual backup
bash scripts/backup.sh

# Restore
bash scripts/restore.sh /var/cmpa/backups/cmpa-2026-05-13.sql.gz
```

---

## Troubleshooting

### 1. "Cannot connect to database"
```bash
# ตรวจ PostgreSQL
sudo systemctl status postgresql
# ตรวจ DATABASE_URL ใน .env — host ต้องเป็น host.docker.internal
# ตรวจ pg_hba.conf อนุญาตให้ docker bridge เข้าได้
sudo grep -E '^host' /etc/postgresql/16/main/pg_hba.conf
# ถ้าไม่มีบรรทัด: host all all 172.17.0.0/16 md5 ให้เพิ่ม แล้ว reload
sudo systemctl reload postgresql
```

### 2. "SSL certificate failed"
```bash
# ตรวจ port 80 ว่างจริงๆ
sudo ss -tlnp | grep ':80'
# รัน certbot ใหม่ด้วยมือ
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot -d 76-13-184-76.nip.io \
  --email admin@example.com --agree-tos --non-interactive
docker compose restart nginx
```

### 3. "Lighthouse PWA ต่ำกว่า 80"
```bash
# Service worker ต้องโหลดได้
curl -I https://76-13-184-76.nip.io/sw.js
# manifest.json ต้องโหลดได้และ valid
curl https://76-13-184-76.nip.io/manifest.json | jq
```

### 4. "Selfie/receipt อัปโหลดไม่ขึ้น"
```bash
# ตรวจสิทธิ์ /var/cmpa/storage
ls -la /var/cmpa/storage
sudo chown -R 1001:1001 /var/cmpa/storage   # uid ของ node user ใน container
```

### 5. "Login ล้มเหลว / session หาย"
```bash
# NEXTAUTH_SECRET ต้องคงที่ ห้ามเปลี่ยน
grep NEXTAUTH_SECRET .env
# ถ้าเพิ่งเปลี่ยน secret ให้ user ทุกคน login ใหม่
docker compose exec app npx prisma studio   # เช็คตาราง Session
```

---

## Architecture

ดู `docs/decisions/` สำหรับ ADRs และ `docs/ARCHITECTURE.md` สำหรับภาพรวม

```
cmpa-hub/
├── app/           Next.js 14 (App Router, RSC, Server Actions)
├── nginx/         Reverse proxy + SSL
├── scripts/       setup, backup, restore
├── storage/       User uploads (bind-mounted)
└── backups/       pg_dump archives
```

---

## Environment Variables

ดู `.env.example` — ทุกตัวมีคำอธิบาย

**บังคับมี:**
- `DATABASE_URL`
- `NEXTAUTH_SECRET` (`scripts/setup.sh` generate ให้)
- `NEXTAUTH_URL`
- `ANTHROPIC_API_KEY`
- `ADMIN_EMAIL`
- `ADMIN_INITIAL_PASSWORD`

**Optional:**
- `LINE_CHANNEL_ACCESS_TOKEN` — สำหรับ LINE Notify (Phase 3+)
- `PAPERCLIP_URL` — สำหรับ AI Research (Phase 2+)
- `R2_*` — สำหรับ remote backup (Phase 5+)

---

## License

Internal use — สมาคมสร้างเสริมอาชีพคนพิการภาคตะวันออก (จ.๓๗๙๘/๒๕๕๒)
