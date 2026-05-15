# DECISIONS.md — การตัดสินใจทั้งหมด

---

## [2026-05-15] — Session แรก: เลือก Architecture

| หัวข้อ | การตัดสินใจ | เหตุผล |
|--------|------------|--------|
| Frontend | Next.js 14.2 + TypeScript | SSR, App Router, ecosystem ดี |
| Styling | Tailwind + shadcn/ui | เร็ว, customizable, accessible |
| Database | PostgreSQL port 54329 | มีอยู่แล้วใน VPS |
| ORM | Prisma | type-safe, migration ง่าย |
| Auth | Auth.js v5 | รองรับ credential + OAuth |
| Deploy | Render.com Singapore | ใกล้ TH, $13/mo, zero-config |
| PWA | เปิดใช้ | รองรับ offline + install บน phone |
| Tables | 19 tables | ครอบคลุม 7 modules ทั้งหมด |

## [2026-05-15] — Session แรก: โครงสร้าง Context System

| หัวข้อ | การตัดสินใจ | เหตุผล |
|--------|------------|--------|
| Context files | context/*.md | self-evolving memory ข้าม session |
| Sub-agents | .claude/agents/*.md | แยก role builder/inspector/scribe/deployer |
| ภาษา | ไทย (ตอบ) + EN (code) | ผู้ใช้ไทย, code standard |
| Deploy flow | ต้องขออนุญาตก่อนทุกครั้ง | ป้องกัน push โดยไม่ตั้งใจ |

---

## [2026-05-15] — Phase 2: Selfie Storage

| หัวข้อ | การตัดสินใจ | เหตุผล |
|--------|------------|--------|
| Selfie upload | base64 JPEG ใน DB field | ไม่ต้องการ external storage, องค์กรเล็ก 45 คน |
| Image compression | Canvas API → JPEG 72%, max 640px | ลด size จาก ~3MB → ~80KB ก่อนส่ง |
| GPS | เก็บพิกัดอย่างเดียว ไม่ validate รัศมี | รองรับ remote work |
| AI backend | Anthropic claude-sonnet-4-6 + Paperclip toggle | PAPERCLIP_ENABLED env var, fallback อัตโนมัติ |
| AI streaming | SSE (text/event-stream) | ไม่ต้องการ Vercel AI SDK, ลด dependency |
| Conversation | บันทึก AIConversation + AIMessage ใน Supabase | ประวัติข้าม session |

## Template สำหรับบันทึกการตัดสินใจใหม่

```
## [YYYY-MM-DD] — หัวข้อ

| หัวข้อ | การตัดสินใจ | เหตุผล |
|--------|------------|--------|
| ... | ... | ... |
```
