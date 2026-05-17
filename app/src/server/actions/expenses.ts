'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ExpenseCategory, ExpenseStatus } from '@prisma/client'

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getMyClaims(status?: ExpenseStatus) {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.expenseClaim.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status } : {}),
    },
    include: {
      approver: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function getClaim(id: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.expenseClaim.findUnique({
    where: { id },
    include: {
      user: { select: { firstName: true, lastName: true } },
      approver: { select: { firstName: true, lastName: true } },
    },
  })
}

export async function getPendingClaims() {
  const session = await auth()
  if (!session?.user?.id) return []
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') return []

  return prisma.expenseClaim.findMany({
    where: { status: 'SUBMITTED' },
    include: {
      user: { select: { firstName: true, lastName: true } },
      approver: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getExpenseSummary() {
  const session = await auth()
  if (!session?.user?.id) {
    return { total: 0, byStatus: {} as Record<ExpenseStatus, number>, byCategory: {} as Record<ExpenseCategory, number> }
  }

  const claims = await prisma.expenseClaim.findMany({
    where: { userId: session.user.id },
    select: { amount: true, status: true, category: true },
  })

  let total = 0
  const byStatus: Record<string, number> = {}
  const byCategory: Record<string, number> = {}

  for (const claim of claims) {
    const amt = Number(claim.amount)
    if (claim.status === 'APPROVED' || claim.status === 'PAID') {
      total += amt
    }
    byStatus[claim.status] = (byStatus[claim.status] ?? 0) + 1
    byCategory[claim.category] = (byCategory[claim.category] ?? 0) + 1
  }

  return {
    total,
    byStatus: byStatus as Record<ExpenseStatus, number>,
    byCategory: byCategory as Record<ExpenseCategory, number>,
  }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createClaim(data: {
  category: ExpenseCategory
  amount: number
  description: string
  receiptUrl?: string
  ocrVendor?: string
  ocrDate?: string
  ocrAmount?: number
  ocrConfidence?: number
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  if (!data.description.trim()) return { ok: false, error: 'กรุณากรอกรายละเอียด' }
  if (!data.amount || data.amount <= 0) return { ok: false, error: 'จำนวนเงินไม่ถูกต้อง' }

  const claim = await prisma.expenseClaim.create({
    data: {
      userId: session.user.id,
      category: data.category,
      amount: data.amount,
      description: data.description.trim(),
      receiptUrl: data.receiptUrl ?? null,
      ocrVendor: data.ocrVendor ?? null,
      ocrDate: data.ocrDate ? new Date(data.ocrDate) : null,
      ocrAmount: data.ocrAmount ?? null,
      ocrConfidence: data.ocrConfidence ?? null,
      status: 'DRAFT',
    },
  })

  revalidatePath('/expenses')
  return { ok: true, id: claim.id }
}

export async function submitClaim(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const claim = await prisma.expenseClaim.findUnique({ where: { id } })
  if (!claim) return { ok: false, error: 'not_found' }
  if (claim.userId !== session.user.id) return { ok: false, error: 'permission_denied' }
  if (claim.status !== 'DRAFT') return { ok: false, error: 'not_draft' }

  await prisma.expenseClaim.update({
    where: { id },
    data: { status: 'SUBMITTED' },
  })

  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
  return { ok: true }
}

export async function approveClaim(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return { ok: false, error: 'permission_denied' }
  }

  const claim = await prisma.expenseClaim.findUnique({ where: { id } })
  if (!claim) return { ok: false, error: 'not_found' }
  if (claim.status !== 'SUBMITTED') return { ok: false, error: 'not_submitted' }

  await prisma.expenseClaim.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approverId: session.user.id,
      approvedAt: new Date(),
    },
  })

  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
  return { ok: true }
}

export async function rejectClaim(id: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return { ok: false, error: 'permission_denied' }
  }

  const claim = await prisma.expenseClaim.findUnique({ where: { id } })
  if (!claim) return { ok: false, error: 'not_found' }

  await prisma.expenseClaim.update({
    where: { id },
    data: {
      status: 'REJECTED',
      description: claim.description + `\n\n[ปฏิเสธ: ${reason}]`,
    },
  })

  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
  return { ok: true }
}

export async function markPaid(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return { ok: false, error: 'permission_denied' }
  }

  const claim = await prisma.expenseClaim.findUnique({ where: { id } })
  if (!claim) return { ok: false, error: 'not_found' }
  if (claim.status !== 'APPROVED') return { ok: false, error: 'not_approved' }

  await prisma.expenseClaim.update({
    where: { id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
    },
  })

  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
  return { ok: true }
}

export async function deleteDraft(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const claim = await prisma.expenseClaim.findUnique({ where: { id } })
  if (!claim) return { ok: false, error: 'not_found' }
  if (claim.userId !== session.user.id) return { ok: false, error: 'permission_denied' }
  if (claim.status !== 'DRAFT') return { ok: false, error: 'not_draft' }

  await prisma.expenseClaim.delete({ where: { id } })

  revalidatePath('/expenses')
  return { ok: true }
}
