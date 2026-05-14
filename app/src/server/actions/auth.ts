'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { signIn, signOut, auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export type ActionState = {
  ok: boolean
  error?: string
  field?: string
}

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
})

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { ok: false, error: 'validation' }
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    // Auth.js wraps cause errors; surface known codes
    if (msg.includes('RATE_LIMIT')) return { ok: false, error: 'rateLimit' }
    if (msg.includes('SUSPENDED')) return { ok: false, error: 'suspended' }
    if (msg.includes('PENDING_DELETION')) return { ok: false, error: 'pendingDeletion' }
    return { ok: false, error: 'invalidCredentials' }
  }

  // success -> redirect outside try/catch
  redirect('/')
}

export async function logoutAction() {
  await signOut({ redirect: false })
  redirect('/login')
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'required'),
    newPassword: z
      .string()
      .min(8, 'tooShort')
      .regex(/[A-Za-z]/, 'mustHaveLetter')
      .regex(/\d/, 'mustHaveNumber'),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'mismatch',
    path: ['confirmPassword'],
  })

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? 'validation', field: first?.path[0]?.toString() }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, passwordHash: true },
  })
  if (!user?.passwordHash) return { ok: false, error: 'invalidCredentials' }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!ok) return { ok: false, error: 'invalidCurrentPassword', field: 'currentPassword' }

  // Don't allow same password
  const sameAsOld = await bcrypt.compare(parsed.data.newPassword, user.passwordHash)
  if (sameAsOld) return { ok: false, error: 'sameAsOld', field: 'newPassword' }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash, mustChangePassword: false },
  })

  // Audit
  const h = headers()
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'password.change',
      entityType: 'User',
      entityId: user.id,
      ipAddress: h.get('x-forwarded-for')?.split(',')[0] ?? null,
      userAgent: h.get('user-agent') ?? null,
    },
  })

  logger.info({ userId: user.id }, 'password.changed')

  revalidatePath('/settings/security')
  revalidatePath('/')

  return { ok: true }
}
