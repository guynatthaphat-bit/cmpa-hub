import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import type { Role, UserStatus } from '@prisma/client'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      nickname: string | null
      role: Role
      status: UserStatus
      mustChangePassword: boolean
      avatarUrl: string | null
      locale: string
      dateSystem: string
      theme: string
    } & DefaultSession['user']
  }
}

type CMPAToken = {
  id: string
  role: Role
  status: UserStatus
  mustChangePassword: boolean
  firstName: string
  lastName: string
  nickname: string | null
  avatarUrl: string | null
  locale: string
  dateSystem: string
  theme: string
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 min
const RATE_LIMIT_MAX = 5

async function checkRateLimit(key: string): Promise<boolean> {
  const now = new Date()
  const existing = await prisma.rateLimit.findUnique({ where: { key } })

  if (!existing || existing.resetAt < now) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS) },
      update: { count: 1, resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS) },
    })
    return true
  }

  if (existing.count >= RATE_LIMIT_MAX) return false

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  })
  return true
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 }, // 7 days
  pages: { signIn: '/login' },
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const normalizedEmail = email.toLowerCase().trim()

        const allowed = await checkRateLimit(`login:email:${normalizedEmail}`)
        if (!allowed) {
          logger.warn({ email: normalizedEmail }, 'Rate limit exceeded for login')
          throw new Error('RATE_LIMIT')
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        })

        if (!user || !user.passwordHash) {
          logger.info({ email: normalizedEmail }, 'Login failed: user not found')
          return null
        }

        if (user.status === 'SUSPENDED') {
          logger.warn({ userId: user.id }, 'Login attempt for suspended user')
          throw new Error('SUSPENDED')
        }

        if (user.status === 'PENDING_DELETION') {
          logger.warn({ userId: user.id }, 'Login attempt for pending-deletion user')
          throw new Error('PENDING_DELETION')
        }

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) {
          logger.info({ userId: user.id }, 'Login failed: wrong password')
          return null
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'user.login',
            entityType: 'User',
            entityId: user.id,
          },
        })

        // Reset rate limit on successful login
        await prisma.rateLimit
          .delete({ where: { key: `login:email:${normalizedEmail}` } })
          .catch(() => {})

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          nickname: user.nickname,
          role: user.role,
          status: user.status,
          mustChangePassword: user.mustChangePassword,
          avatarUrl: user.avatarUrl,
          locale: user.locale,
          dateSystem: user.dateSystem,
          theme: user.theme,
        } as unknown as { id: string; email: string }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Cast intentional — Credentials returns custom shape
        const u = user as unknown as {
          id: string
          role: Role
          status: UserStatus
          mustChangePassword: boolean
          firstName: string
          lastName: string
          nickname: string | null
          avatarUrl: string | null
          locale: string
          dateSystem: string
          theme: string
        }
        token.id = u.id
        token.role = u.role
        token.status = u.status
        token.mustChangePassword = u.mustChangePassword
        token.firstName = u.firstName
        token.lastName = u.lastName
        token.nickname = u.nickname
        token.avatarUrl = u.avatarUrl
        token.locale = u.locale
        token.dateSystem = u.dateSystem
        token.theme = u.theme
      }

      // Allow Server Action to push profile/preference updates into JWT
      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      const t = token as unknown as CMPAToken
      session.user.id = t.id
      session.user.role = t.role
      session.user.status = t.status
      session.user.mustChangePassword = t.mustChangePassword
      session.user.firstName = t.firstName
      session.user.lastName = t.lastName
      session.user.nickname = t.nickname
      session.user.avatarUrl = t.avatarUrl
      session.user.locale = t.locale
      session.user.dateSystem = t.dateSystem
      session.user.theme = t.theme
      return session
    },
  },
})
