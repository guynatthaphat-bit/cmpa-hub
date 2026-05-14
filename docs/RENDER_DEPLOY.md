# 🚀 Deploy CMPA Hub บน Render.com

> สำหรับโปรเจกต์ที่ subfolder เป็น `app/` + ใช้ Docker runtime + Auth.js v5

---

## 🎯 Strategy

ใช้ **Docker runtime** ของ Render เพื่อ reuse Dockerfile + `docker-entrypoint.sh` ที่มีอยู่
จะได้พฤติกรรมเหมือนใน VPS ทุกอย่าง:

```
Render container start
  → docker-entrypoint.sh
     → prisma db push (sync 18 tables)
     → prisma/seed.ts (upsert admin user)
     → node server.js (Next.js standalone)
```

ไม่ต้องเปลี่ยน code Next.js เลย — เพิ่มแค่ `render.yaml` ที่ root

---

## ⚠️ ข้อจำกัดของ Render ที่ต้องเข้าใจก่อน

### 1. Filesystem เป็น **EPHEMERAL**
```
❌ ไฟล์ใน /var/cmpa/storage จะหายเมื่อ:
   - Deploy ครั้งใหม่
   - Container restart
   - Render rebalance ระหว่าง servers
```

**แก้**:
- เปิด `FEATURE_R2_BACKUP=true` + ตั้ง R2 credentials (ฟรี 10GB)
- หรืออัปเกรดเป็น Standard plan ($25/mo) + ใช้ Render Disk

### 2. Free Tier sleep หลัง 15 นาที
ถ้าเลือก free plan → web service sleep → request แรกหลัง sleep ใช้เวลา 30-60 วินาที
**แก้**: ใช้ Starter ($7/mo) ขึ้นไป

### 3. Cold Start หลัง deploy
หลัง push code ใหม่ → build 5-10 นาที + container start 30-60 วินาที (เพราะรอ db push + seed)

---

## 📋 Pre-flight Checklist

ก่อน deploy ตรวจให้แน่ใจว่า:

- [ ] `app/prisma/schema.prisma` มี `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` ✅ (เพิ่มให้แล้ว)
- [ ] `render.yaml` อยู่ที่ **root** (ไม่ใช่ใน app/) ✅
- [ ] ไม่มี `.env` หรือ `.env.local` ใน git history (ตรวจด้วย `git log --all --full-history -- .env*`)
- [ ] `app/src/lib/auth.ts` มี `trustHost: true` ✅
- [ ] Health check endpoint `/api/health` ทำงานได้ ✅
- [ ] โปรเจกต์ build ผ่านบน local: `cd app && npm run build`

---

## 🚀 Step-by-Step Deployment

### Step 1: Push ขึ้น GitHub

```bash
cd /path/to/cmpa-hub-render-ready

git init
git add .
git commit -m "feat: CMPA Hub Phase 1 - ready for Render deployment"
git branch -M main
git remote add origin https://github.com/<USERNAME>/cmpa-hub.git
git push -u origin main
```

> 💡 สร้าง repo ที่ [github.com/new](https://github.com/new) เป็น **Private** (ข้อมูลสมาคม)

### Step 2: สร้าง Render Blueprint

1. เข้า [dashboard.render.com](https://dashboard.render.com)
2. คลิก **New +** → **Blueprint**
3. เชื่อมต่อ GitHub repo → เลือก `cmpa-hub`
4. Render สแกน `render.yaml` แล้วแสดง preview:
   ```
   ✓ Web Service: cmpa-hub (Docker, Singapore, Starter, $7/mo)
   ✓ PostgreSQL:  cmpa-hub-db (Singapore, Basic 256MB, $6/mo)

   Total: ~$13/month
   ```
5. ตั้ง **Blueprint name**: `cmpa-hub-prod`
6. คลิก **Apply** → รอประมาณ **8-12 นาที** (Docker build นานกว่า Native)

### Step 3: ตั้ง Environment Variables ที่ยังขาด

หลัง deploy แรก ไป **cmpa-hub** service → **Environment**

| Key | Value | สำคัญแค่ไหน |
|-----|-------|------------|
| `NEXTAUTH_URL` | `https://cmpa-hub.onrender.com` | 🔴 จำเป็น — ระบบ login พังถ้าไม่ตั้ง |
| `ADMIN_INITIAL_PASSWORD` | (รหัสที่จดไว้ ≥ 12 chars) | 🔴 จำเป็น — ใช้ login ครั้งแรก |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | 🟡 ถ้าใช้ AI features |
| `LINE_CHANNEL_ACCESS_TOKEN` | จาก LINE Developer | 🟢 ภายหลัง |
| `LINE_CHANNEL_SECRET` | จาก LINE Developer | 🟢 ภายหลัง |
| `R2_ACCOUNT_ID` | จาก Cloudflare R2 | 🟡 แนะนำ (file storage) |
| `R2_ACCESS_KEY_ID` | จาก Cloudflare R2 | 🟡 |
| `R2_SECRET_ACCESS_KEY` | จาก Cloudflare R2 | 🟡 |
| `R2_BUCKET` | ชื่อ bucket | 🟡 |

หลังตั้งครบ → คลิก **Save Changes** → Render redeploy อัตโนมัติ

### Step 4: ตรวจสอบหลัง Deploy

#### 4.1 Health check
```bash
curl https://cmpa-hub.onrender.com/api/health
# คาดหวัง: {"status":"ok","timestamp":"2026-..."}
```

#### 4.2 ตรวจ logs
ไป **cmpa-hub** service → **Logs** tab — ดูว่ามี:
```
▸ CMPA Hub starting…
▸ Waiting for database and syncing schema…
  ✓ schema in sync
▸ Seeding initial admin…
  ✓ created admin: natthaphat@cmpa.or.th
▸ Launching server on port 10000…
```

> ✅ ถ้าเห็นข้อความเหล่านี้แปลว่า deploy สำเร็จ

#### 4.3 Login ครั้งแรก
1. ไปที่ `https://cmpa-hub.onrender.com/login`
2. Email: `natthaphat@cmpa.or.th`
3. Password: `ADMIN_INITIAL_PASSWORD` ที่ตั้งไว้
4. ระบบจะบังคับเปลี่ยนรหัสผ่านใหม่ (เพราะ `mustChangePassword: true`)
5. ตั้งรหัสใหม่ที่แข็งแรง → ใช้งานได้

#### 4.4 ตรวจ Database
ใน Render → **cmpa-hub-db** service → **Info** tab
- ดู **External Database URL** (สำหรับเชื่อมจาก DBeaver/TablePlus)
- ดู **Status** — ต้องเป็น "Available"

ลอง query:
```sql
-- ดูว่า 18 tables สร้างครบ
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ดูว่า pgcrypto extension เปิดแล้ว
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
```

---

## 🎯 Custom Domain (ทางเลือก)

ถ้าจะใช้ `cmpa.or.th` แทน:

1. **cmpa-hub** service → **Settings** → **Custom Domains** → Add
2. ใส่โดเมน เช่น `app.cmpa.or.th`
3. ไปที่ DNS ของโดเมน → เพิ่ม CNAME:
   ```
   app.cmpa.or.th  CNAME  cmpa-hub.onrender.com
   ```
4. Render auto-issue Let's Encrypt SSL (รอ 5-30 นาที)
5. **อัปเดต `NEXTAUTH_URL`** เป็น `https://app.cmpa.or.th`
6. Redeploy

---

## 🆘 ถ้าเจอปัญหา

ดู `docs/RENDER_TROUBLESHOOTING.md` หรือ logs ใน Render Dashboard

ปัญหาที่พบบ่อยที่สุด:
- **"prisma db push failed"** → ตรวจว่า `DATABASE_URL` ถูก inject (ดูใน Environment tab)
- **Login error "UntrustedHost"** → ตรวจ `AUTH_TRUST_HOST=true` + `NEXTAUTH_URL` ตรงโดเมนจริง
- **Build OOM** → อัปเกรดเป็น Standard plan หรือเพิ่ม `NODE_OPTIONS="--max-old-space-size=460"` ใน Dockerfile

---

## 💰 ค่าใช้จ่ายโดยรวม

### Setup ขั้นต่ำ (recommended for Phase 1)
| Service | Plan | ราคา |
|---------|------|------|
| Web Service | Starter (Docker) | $7/mo |
| PostgreSQL | Basic 256MB | $6/mo |
| **รวม** | | **$13/mo** (~470 บาท) |

### Setup แนะนำสำหรับ Production จริง
| Service | Plan | ราคา |
|---------|------|------|
| Web Service | Standard | $25/mo |
| PostgreSQL | Basic 1GB | $19/mo |
| Cloudflare R2 (file storage) | Free tier | $0 (ฟรี 10GB) |
| **รวม** | | **$44/mo** (~1,580 บาท) |

> 💡 เริ่มจาก Starter ก่อน → upgrade เมื่อจำเป็น
