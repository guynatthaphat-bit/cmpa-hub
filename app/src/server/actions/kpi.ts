'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { KPIPeriod } from '@prisma/client'

export type KPIData = {
  id: string
  userId: string
  title: string
  description: string | null
  unit: string
  target: number
  current: number
  weight: number
  period: KPIPeriod
  periodLabel: string
  createdAt: Date
  updatedAt: Date
}

export type KPIWithUser = KPIData & {
  user: { firstName: string; lastName: string }
}

export async function getMyKPIs(periodLabel?: string): Promise<KPIData[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const kpis = await prisma.kPI.findMany({
    where: {
      userId: session.user.id,
      ...(periodLabel ? { periodLabel } : {}),
    },
    orderBy: [{ weight: 'desc' }, { title: 'asc' }],
  })

  return kpis as KPIData[]
}

export async function createKPI(data: {
  title: string
  unit: string
  target: number
  period: KPIPeriod
  periodLabel: string
  description?: string
  weight?: number
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const kpi = await prisma.kPI.create({
    data: {
      userId: session.user.id,
      title: data.title,
      unit: data.unit,
      target: data.target,
      period: data.period,
      periodLabel: data.periodLabel,
      description: data.description ?? null,
      weight: data.weight ?? 1,
    },
  })

  revalidatePath('/kpi')
  return { ok: true, id: kpi.id }
}

export async function updateKPI(
  id: string,
  data: Partial<{
    title: string
    unit: string
    target: number
    current: number
    period: KPIPeriod
    periodLabel: string
    description: string
    weight: number
  }>,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const existing = await prisma.kPI.findUnique({ where: { id }, select: { userId: true } })
  if (!existing) return { ok: false, error: 'not_found' }
  if (existing.userId !== session.user.id) return { ok: false, error: 'forbidden' }

  await prisma.kPI.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.unit !== undefined ? { unit: data.unit } : {}),
      ...(data.target !== undefined ? { target: data.target } : {}),
      ...(data.current !== undefined ? { current: data.current } : {}),
      ...(data.period !== undefined ? { period: data.period } : {}),
      ...(data.periodLabel !== undefined ? { periodLabel: data.periodLabel } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.weight !== undefined ? { weight: data.weight } : {}),
    },
  })

  revalidatePath('/kpi')
  return { ok: true }
}

export async function deleteKPI(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const existing = await prisma.kPI.findUnique({ where: { id }, select: { userId: true } })
  if (!existing) return { ok: false, error: 'not_found' }
  if (existing.userId !== session.user.id) return { ok: false, error: 'forbidden' }

  await prisma.kPI.delete({ where: { id } })

  revalidatePath('/kpi')
  return { ok: true }
}

export async function getAllKPIs(): Promise<KPIWithUser[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const isPrivileged = session.user.role === 'ADMIN' || session.user.role === 'MANAGER'
  if (!isPrivileged) return []

  const kpis = await prisma.kPI.findMany({
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ user: { firstName: 'asc' } }, { weight: 'desc' }],
  })

  return kpis.map((k) => ({
    ...k,
    user: { firstName: k.user.firstName, lastName: k.user.lastName },
  })) as KPIWithUser[]
}
