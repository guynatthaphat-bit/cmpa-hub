# ERRORS.md — ปัญหาที่เคยเจอ + วิธีแก้

**กฎ:** ห้ามให้เจอ error เดิมซ้ำสองครั้ง

---

## Template

```
### [YYYY-MM-DD] ERROR: ชื่อ error

**Context:** ทำอะไรอยู่ตอนเกิด error
**Symptom:** อาการที่เห็น
**Root Cause:** สาเหตุที่แท้จริง
**Fix:** วิธีแก้ที่ได้ผล
**Prevention:** จะป้องกันได้อย่างไรในอนาคต
```

---

## [2026-05-15] TypeScript errors จาก source code ครั้งแรก

**Context:** รัน `npm run typecheck` หลัง npm install
**Symptom:** 18 TS errors ใน 4 ไฟล์
**Root Cause (3 กลุ่ม):**
1. `next-auth/jwt` module augmentation ไม่รองรับ `moduleResolution: bundler` ของ next-auth v5 beta
2. Server actions ใช้ชื่อ field ผิด: `actorId`/`ip` แต่ schema มี `userId`/`ipAddress`
3. Server actions อ้าง `passwordChangedAt` ที่ไม่มีใน User schema
**Fix:**
1. เปลี่ยนจาก `declare module 'next-auth/jwt'` → ใช้ local type `CMPAToken` + `token as unknown as CMPAToken` ใน session callback
2. แก้ทุก `actorId` → `userId`, `ip` → `ipAddress` ใน actions/*.ts
3. ลบ `passwordChangedAt: new Date()` ออกจาก user.update ใน auth.ts
**Prevention:** ตรวจ field names ใน Prisma schema ก่อนเขียน queries ทุกครั้ง
