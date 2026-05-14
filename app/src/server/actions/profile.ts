'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import type { ActionState } from '@/server/actions/auth'

const phoneRegex = /^0\d{8,9}$/

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'required').max(100),
  lastName: z.string().trim().min(1, 'required').max(100),
  nickname: z.string().trim().max(50).optional().nullable(),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[-\s]/g, ''))
    .refine((v) => v === '' || phoneRegex.test(v), 'invalidPhone')
    .optional()
    .nullable(),
})

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const parsed = profileSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    nickname: formData.get('nickname') || null,
    phone: formData.get('phone') || null,
  })

  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? 'validation', field: first?.path[0]?.toString() }
  }

  const data = parsed.data
  const before = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, nickname: true, phone: true },
  })

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      nickname: data.nickname || null,
      phone: data.phone || null,
    },
  })

  const h = headers()
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'profile.update',
      entityType: 'User',
      entityId: session.user.id,
      before: before as object,
      after: data as object,
      ipAddress: h.get('x-forwarded-for')?.split(',')[0] ?? null,
      userAgent: h.get('user-agent') ?? null,
    },
  })

  logger.info({ userId: session.user.id }, 'profile.updated')
  revalidatePath('/settings/profile')
  revalidatePath('/')
  return { ok: true }
}
