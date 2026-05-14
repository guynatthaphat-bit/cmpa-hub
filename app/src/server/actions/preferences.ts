'use server'

import { z } from 'zod'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import type { ActionState } from '@/server/actions/auth'

const prefsSchema = z.object({
  locale: z.enum(['th-TH', 'en-US']).optional(),
  dateSystem: z.enum(['BE', 'CE']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
})

export async function updatePreferencesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const parsed = prefsSchema.safeParse({
    locale: formData.get('locale') || undefined,
    dateSystem: formData.get('dateSystem') || undefined,
    theme: formData.get('theme') || undefined,
  })

  if (!parsed.success) return { ok: false, error: 'validation' }
  const data = parsed.data

  const update: Record<string, string> = {}
  if (data.locale) update.locale = data.locale
  if (data.dateSystem) update.dateSystem = data.dateSystem
  if (data.theme) update.theme = data.theme

  if (Object.keys(update).length === 0) return { ok: true }

  await prisma.user.update({
    where: { id: session.user.id },
    data: update,
  })

  // Persist locale as cookie for next-intl
  if (data.locale) {
    const jar = cookies()
    jar.set('NEXT_LOCALE', data.locale, {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      path: '/',
    })
  }

  logger.info({ userId: session.user.id, prefs: update }, 'preferences.updated')
  revalidatePath('/settings/preferences')
  revalidatePath('/')
  return { ok: true }
}
