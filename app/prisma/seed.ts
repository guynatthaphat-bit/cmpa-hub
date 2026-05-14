// =============================================================================
// CMPA Hub — Database seed
// Idempotent: safe to run repeatedly. Creates / upserts the initial admin user.
// =============================================================================

import { PrismaClient, Role, UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_INITIAL_PASSWORD
  const firstName = process.env.ADMIN_FIRST_NAME ?? 'Admin'
  const lastName = process.env.ADMIN_LAST_NAME ?? 'User'

  if (!email || !password) {
    console.log('  ⚠ ADMIN_EMAIL or ADMIN_INITIAL_PASSWORD not set — skipping seed')
    return
  }

  // Enable pgcrypto if not already enabled
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pgcrypto')

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`  ✓ admin user already present (${email})`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: true,
      locale: 'th-TH',
      timezone: 'Asia/Bangkok',
      dateSystem: 'BE',
      consentedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
  })

  // Initial leave balance for current year
  const currentYear = new Date().getFullYear()
  const admin = await prisma.user.findUnique({ where: { email } })
  if (admin) {
    await prisma.leaveBalance.upsert({
      where: { userId_year: { userId: admin.id, year: currentYear } },
      update: {},
      create: { userId: admin.id, year: currentYear },
    })
  }

  console.log(`  ✓ created admin: ${email} (must change password on first login)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
