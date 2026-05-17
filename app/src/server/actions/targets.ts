'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { TargetStatus } from '@prisma/client'

export type TargetFilters = {
  categoryId?: string
  province?: string
  status?: TargetStatus
  search?: string
  page?: number
}

export async function getTargets(filters: TargetFilters = {}) {
  const session = await auth()
  if (!session?.user?.id) return { items: [], total: 0 }

  const { categoryId, province, status, search, page = 0 } = filters
  const where = {
    ...(categoryId ? { categoryId } : {}),
    ...(province ? { province } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { contactPerson: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.target.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
      take: 25,
      skip: page * 25,
      include: { category: { select: { id: true, nameTh: true, icon: true, color: true } } },
    }),
    prisma.target.count({ where }),
  ])

  return { items, total }
}

export async function getTarget(id: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.target.findUnique({
    where: { id },
    include: {
      category: true,
      outreachLogs: {
        orderBy: { sentAt: 'desc' },
        include: { createdBy: { select: { firstName: true, lastName: true } } },
      },
    },
  })
}

export async function createTarget(data: {
  name: string
  categoryId?: string
  province?: string
  district?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  contactPerson?: string
  contactTitle?: string
  priority?: number
  status?: TargetStatus
  source?: string
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const, error: 'unauthorized' }

  const target = await prisma.target.create({
    data: { ...data, createdById: session.user.id },
  })

  revalidatePath('/targets')
  return { ok: true as const, id: target.id }
}

export async function updateTarget(
  id: string,
  data: Partial<{
    name: string
    categoryId: string | null
    province: string
    district: string
    address: string
    phone: string
    email: string
    website: string
    contactPerson: string
    contactTitle: string
    priority: number
    status: TargetStatus
    notes: string
  }>,
) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const }

  await prisma.target.update({ where: { id }, data })
  revalidatePath('/targets')
  revalidatePath(`/targets/${id}`)
  return { ok: true as const }
}

export async function deleteTarget(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const }

  await prisma.target.delete({ where: { id } })
  revalidatePath('/targets')
  return { ok: true as const }
}

export async function bulkUpdateStatus(ids: string[], status: TargetStatus) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const }

  await prisma.target.updateMany({ where: { id: { in: ids } }, data: { status } })
  revalidatePath('/targets')
  return { ok: true as const }
}

export async function addOutreachLog(data: {
  targetId: string
  type: string
  response?: string
  sentAt?: Date
}) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const }

  await prisma.outreachLog.create({
    data: { ...data, createdById: session.user.id },
  })
  revalidatePath(`/targets/${data.targetId}`)
  return { ok: true as const }
}

export async function getCategories() {
  return prisma.targetCategory.findMany({ orderBy: { createdAt: 'asc' } })
}

export async function getTargetStats() {
  const session = await auth()
  if (!session?.user?.id) return null

  const [byStatus, byCategory] = await Promise.all([
    prisma.target.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.target.groupBy({
      by: ['categoryId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 6,
    }),
  ])

  return { byStatus, byCategory }
}
