'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth, signOut } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import type { ActionState } from '@/server/actions/auth'

/**
 * Records a data-export request in the audit log. Admin will fulfill manually
 * by exporting the user's data per PDPA requirements within 30 days.
 */
export async function requestDataExportAction(): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const h = headers()
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'pdpa.export.request',
      entityType: 'User',
      entityId: session.user.id,
      ipAddress: h.get('x-forwarded-for')?.split(',')[0] ?? null,
      userAgent: h.get('user-agent') ?? null,
    },
  })

  logger.info({ userId: session.user.id }, 'pdpa.export.requested')
  revalidatePath('/settings/privacy')
  return { ok: true }
}

/**
 * Marks the user account for deletion with a 30-day grace period. Admin
 * fulfills (or user can cancel) before the scheduled date.
 */
export async function requestAccountDeletionAction(): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const now = new Date()
  const scheduled = new Date(now)
  scheduled.setDate(scheduled.getDate() + 30)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      deletionRequestedAt: now,
      deletionScheduledAt: scheduled,
    },
  })

  const h = headers()
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'pdpa.deletion.request',
      entityType: 'User',
      entityId: session.user.id,
      ipAddress: h.get('x-forwarded-for')?.split(',')[0] ?? null,
      userAgent: h.get('user-agent') ?? null,
    },
  })

  logger.info({ userId: session.user.id, scheduled }, 'pdpa.deletion.requested')
  revalidatePath('/settings/privacy')
  return { ok: true }
}

/**
 * Cancels a pending deletion request (within the 30-day grace period).
 */
export async function cancelAccountDeletionAction(): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      deletionRequestedAt: null,
      deletionScheduledAt: null,
    },
  })

  const h = headers()
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'pdpa.deletion.cancel',
      entityType: 'User',
      entityId: session.user.id,
      ipAddress: h.get('x-forwarded-for')?.split(',')[0] ?? null,
      userAgent: h.get('user-agent') ?? null,
    },
  })

  logger.info({ userId: session.user.id }, 'pdpa.deletion.cancelled')
  revalidatePath('/settings/privacy')
  return { ok: true }
}
