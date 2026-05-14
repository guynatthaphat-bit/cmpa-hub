# 🆘 Render Deployment - Troubleshooting

ปัญหาที่พบบ่อยและวิธีแก้ ปรับให้ตรงกับโปรเจกต์ CMPA Hub โดยเฉพาะ

---

## 🔴 Build Errors

### ❌ "Could not find Prisma Schema engine binary for linux-musl"
**สาเหตุ**: ลืม `binaryTargets` ใน `schema.prisma`

**แก้ (เพิ่มให้แล้ว แต่ตรวจอีกที)**: ใน `app/prisma/schema.prisma`:
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
  binaryTargets   = ["native", "linux-musl-openssl-3.0.x"]
}
```
แล้ว commit + push:
```bash
git add app/prisma/schema.prisma
git commit -m "fix: add Prisma binaryTargets for Alpine Linux"
git push
```

---

### ❌ Docker build OOM (Out of Memory)
**สาเหตุ**: Starter plan มีแค่ 512MB RAM, Next.js build กิน RAM เยอะ

**แก้ทางเลือก**:
1. ใน `app/Dockerfile` เพิ่มก่อน `npm run build`:
   ```dockerfile
   ENV NODE_OPTIONS="--max-old-space-size=460"
   ```
2. หรืออัปเกรดเป็น Standard plan ($25/mo) — 2GB RAM

---

### ❌ "Module not found" หลัง build
**สาเหตุ**: dependencies อยู่ใน `devDependencies` แต่ runtime ต้องใช้

**แก้**: ย้ายไป `dependencies` ใน `app/package.json`:
```bash
cd app
npm install --save <package>
npm uninstall --save-dev <package>
```

---

## 🔴 Runtime Errors

### ❌ `[next-auth][error][UntrustedHost]`
**ตรวจ**:
1. `AUTH_TRUST_HOST=true` ตั้งใน Environment ไหม?
2. `NEXTAUTH_URL` ตรงกับ URL จริงไหม? (ห้ามมี trailing `/`)

**แก้**:
- Render → Environment → ตั้ง `AUTH_TRUST_HOST` = `true`
- Render → Environment → แก้ `NEXTAUTH_URL` = `https://cmpa-hub.onrender.com` (หรือ custom domain)

---

### ❌ "prisma db push failed - connection refused"
**สาเหตุ**: `DATABASE_URL` ไม่ถูก inject หรือ DB ยังไม่พร้อม

**ตรวจ**:
1. Render → cmpa-hub → Environment → ดูว่ามี `DATABASE_URL` หรือไม่
2. Render → cmpa-hub-db → Info → Status ต้องเป็น "Available"
3. ดู logs — `docker-entrypoint.sh` retry 30 ครั้ง × 2 วินาที = 60 วินาที ถ้าไม่ขึ้นต้องตรวจอย่างอื่น

**แก้**:
- ถ้า DB ยังสร้างไม่เสร็จ → รอ + redeploy
- ถ้า env var หายไป → ตรวจ render.yaml มี `fromDatabase: cmpa-hub-db` ครบไหม

---

### ❌ "pgcrypto extension does not exist"
**สาเหตุ**: PostgreSQL ใหม่ยังไม่ได้เปิด extension

**แก้**: `prisma/seed.ts` ทำ `CREATE EXTENSION IF NOT EXISTS pgcrypto` ให้แล้ว
ถ้ายังไม่ทำงาน → manual:
```bash
# จาก Render Shell หรือ DBeaver
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
```

---

### ❌ Login ไม่ได้ - "RATE_LIMIT" หลัง deploy ใหม่
**สาเหตุ**: `RateLimit` table มี records เก่าที่ยังไม่ expire

**แก้**: clear table หรือรอจนหมดเวลา (15 นาที):
```sql
DELETE FROM "RateLimit" WHERE "key" LIKE 'login:%';
```

---

### ❌ File uploads หายหลัง deploy
**สาเหตุ**: ⚠️ Render filesystem เป็น **ephemeral** (รู้อยู่แล้วใน RENDER_DEPLOY.md)

**แก้ระยะสั้น**: เปิด R2 backup
```bash
# Render Environment:
FEATURE_R2_BACKUP=true
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=cmpa-storage
```

**แก้ระยะยาว**: เขียน upload action ให้ stream ไป R2 โดยตรง (Phase 2)

---

## 🔴 Performance Issues

### 🐌 Cold start ช้า (30-60 วินาที)
**สาเหตุ**: `docker-entrypoint.sh` รัน `prisma db push` + seed ทุกครั้งที่ container start

**แก้ทางเลือก**:
1. **ยอมรับ** — เกิดเฉพาะตอน deploy ใหม่ ไม่กระทบ runtime
2. **แก้** — แก้ `docker-entrypoint.sh` ให้ skip db push ถ้า schema ตรงกับ DB อยู่แล้ว:
   ```sh
   if [ "${SKIP_DB_PUSH:-false}" = "true" ]; then
     echo "▸ Skipping db push (SKIP_DB_PUSH=true)"
   else
     # ... existing logic
   fi
   ```
   แล้วตั้ง `SKIP_DB_PUSH=true` ใน Render หลัง deploy ครั้งแรก

---

### 🐌 Render free tier sleep ทำให้ user รอนาน
**แก้**: อัปเกรดเป็น Starter ($7/mo) — ไม่ sleep

---

## 🔴 PWA Issues

### ❌ Service worker ไม่ register
**ตรวจ**:
1. URL ต้องเป็น `https://` ✅ (Render auto-provides)
2. เปิด DevTools → Application → Service Workers
3. ตรวจ `/sw.js` เปิดได้ไหม

**แก้**: `@ducanh2912/next-pwa` ตั้งค่าใน `next.config.mjs` แล้ว ถ้ายังไม่ work อาจเป็นเพราะ `disable: process.env.NODE_ENV === 'development'` ลองตรวจว่า `NODE_ENV=production` ใน Render Environment

---

### ❌ "Add to Home Screen" ไม่ขึ้นบน iOS
**สาเหตุ**: iOS ต้องการ `apple-touch-icon` 180x180

**ตรวจ**: `app/public/icons/apple-touch-icon.png` มีอยู่ ✅
ใน `app/src/app/layout.tsx` ต้องมี:
```tsx
export const metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CMPA Hub',
  },
  // ...
}
```

---

## 🛠️ Debugging Commands

### ดู logs realtime
Render → cmpa-hub → **Logs** tab (มีตัวกรอง: All / Build / Deploy / Service)

### Shell เข้า production container (Starter+ เท่านั้น)
Render → cmpa-hub → **Shell** tab

ทดสอบ db connection:
```bash
./node_modules/.bin/prisma db pull  # อ่าน schema จาก DB
```

ดู env vars ที่ถูก inject:
```bash
env | grep -E "DATABASE|NEXTAUTH|AUTH" | grep -v SECRET
```

### Manual db push (ฉุกเฉิน)
```bash
./node_modules/.bin/prisma db push --skip-generate
```

### Manual seed (ฉุกเฉิน)
```bash
./node_modules/.bin/tsx prisma/seed.ts
```

---

## 📞 ขอความช่วยเหลือ

1. **Render Status**: [status.render.com](https://status.render.com) — เช็คก่อนว่ามี outage หรือไม่
2. **Render Community**: [community.render.com](https://community.render.com)
3. **Next.js Discord**: [nextjs.org/discord](https://nextjs.org/discord)
4. **Auth.js Discussions**: [github.com/nextauthjs/next-auth/discussions](https://github.com/nextauthjs/next-auth/discussions)

---

## 🔍 Diagnostic Checklist

เมื่อมีปัญหา ตอบคำถามเหล่านี้ก่อน:

- [ ] Render logs (Build/Deploy/Service) มี error อะไร?
- [ ] `/api/health` ตอบ 200 ไหม?
- [ ] `cmpa-hub-db` service มีสถานะ "Available" ไหม?
- [ ] Environment variables ครบไหม? (เช็ค: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DATABASE_URL`, `AUTH_TRUST_HOST`)
- [ ] Build ครั้งล่าสุดสำเร็จหรือเปล่า? (Render → Deploys tab)
- [ ] เพิ่งแก้ code อะไรไป? → revert ดูว่าหายไหม
- [ ] ลองเปิด URL จาก incognito browser → ปัญหา cache?
