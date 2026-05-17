# ROADMAP.md — แผนงานทั้งหมด

---

## Phase 1 — Foundation (ปัจจุบัน)

- [x] 2026-05-15 — สร้าง context/ + .claude/agents/
- [x] 2026-05-15 — merge source code จาก zip เข้า repo
- [x] 2026-05-15 — ตรวจสอบโครงสร้าง + อัปเดต context files
- [x] 2026-05-15 — สร้าง .env + generate secrets
- [x] 2026-05-15 — `npm install` + อัปเกรด Next.js 14.2.18→14.2.35 (security fix)
- [x] 2026-05-15 — แก้ TypeScript errors 3 กลุ่ม (0 errors)
- [x] 2026-05-15 — `npm run build` ผ่าน 22/22 routes
- [ ] สร้าง GitHub repo + push
- [ ] Deploy Render.com (Blueprint)
- [ ] ตั้งค่า 6 env vars ใน Render Dashboard
- [ ] รอ deploy สำเร็จ + ทดสอบ login บน phone
- [ ] Prisma migrate + seed admin user

## Phase 2 — เข้างาน + AI Research

- [x] 2026-05-15 — Clock-in/out + GPS + selfie (base64 ใน DB)
- [x] 2026-05-15 — AI streaming chat (Anthropic SDK + Paperclip toggle)
- [x] 2026-05-15 — Conversation history + delete
- [x] 2026-05-15 — Build 23/23 routes ✅
- [ ] Push to GitHub + Render deploy
- [ ] ทดสอบกับ user จริง

## Phase 2.5 — Targets Database (2026-05-17) ✅

- [x] Target, TargetCategory, OutreachLog, CrawlJob models
- [x] CRUD + bulk status update
- [x] Excel export
- [x] Google Places auto-search (mock fallback)
- [x] Outreach timeline per target
- [x] Push to GitHub
- [ ] prisma db push ไปยัง Supabase production
- [ ] seed หมวดหมู่เริ่มต้น (seed-categories.ts)
- [ ] ทดสอบกับ user จริง

## Phase 3 — ลางาน + เอกสาร

- [ ] ระบบลางาน — ยื่น/อนุมัติ/ปฏิเสธ
- [ ] LINE Notify เมื่อมีการอนุมัติ
- [ ] อัปโหลดเอกสาร + PDF viewer
- [ ] approval workflow

## Phase 4 — โครงการ + KPI

- [ ] Kanban board (drag & drop Task)
- [ ] KPI dashboard (Recharts)
- [ ] รายงาน export (PDF/Excel)

## Phase 5 — ค่าใช้จ่าย OCR

- [ ] OCR สแกนใบเสร็จ (Claude Vision)
- [ ] ระบบค่าใช้จ่าย + approval
- [ ] สรุปงบประมาณ

---

## ✅ เสร็จแล้ว

- [x] 2026-05-15 — สร้าง context/ folder + ไฟล์ทั้งหมด
- [x] 2026-05-15 — สร้าง .claude/agents/ + subagent definitions
- [x] 2026-05-15 — git init repository
- [x] 2026-05-15 — merge source code จาก cmpa-hub-render-ready.zip
- [x] 2026-05-15 — ตรวจสอบและ document โครงสร้าง source code ทั้งหมด
