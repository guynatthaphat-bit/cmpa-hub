'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendLineMessage } from '@/lib/line-notify'
import type { LeaveType, LeaveStatus } from '@prisma/client'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTH(date: Date | string): string {
  return new Date(date).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  })
}

const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  ANNUAL: 'ลาพักร้อน',
  SICK: 'ลาป่วย',
  PERSONAL: 'ลากิจ',
  MATERNITY: 'ลาคลอด',
  ORDINATION: 'ลาบวช',
  BEREAVEMENT: 'ลาเนื่องจากงานศพ',
  OTHER: 'ลาอื่นๆ',
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getMyLeaves(page = 0) {
  const session = await auth()
  if (!session?.user?.id) return { items: [], total: 0 }

  const userId = session.user.id
  const [items, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { userId },
      include: {
        approver: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: page * 20,
    }),
    prisma.leaveRequest.count({ where: { userId } }),
  ])

  return { items, total }
}

export async function getLeaveBalance(year?: number) {
  const session = await auth()
  if (!session?.user?.id) return null

  const targetYear = year ?? new Date().getFullYear()

  return prisma.leaveBalance.findUnique({
    where: { userId_year: { userId: session.user.id, year: targetYear } },
  })
}

export async function getPendingLeaves() {
  const session = await auth()
  if (!session?.user?.id) return []
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') return []

  return prisma.leaveRequest.findMany({
    where: { status: 'PENDING' },
    include: {
      user: { select: { firstName: true, lastName: true, employeeCode: true } },
      approver: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createLeaveRequest(data: {
  leaveType: LeaveType
  startDate: string
  endDate: string
  daysCount: number
  reason: string
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const { leaveType, startDate, endDate, daysCount, reason } = data

  if (!reason.trim()) return { ok: false, error: 'กรุณากรอกเหตุผล' }
  if (daysCount < 0.5) return { ok: false, error: 'จำนวนวันไม่ถูกต้อง' }

  const start = new Date(startDate)
  const end = new Date(endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { ok: false, error: 'วันที่ไม่ถูกต้อง' }
  if (end < start) return { ok: false, error: 'วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น' }

  const leave = await prisma.leaveRequest.create({
    data: {
      userId: session.user.id,
      leaveType,
      startDate: start,
      endDate: end,
      daysCount,
      reason,
      status: 'PENDING',
    },
  })

  const fullName = `${session.user.firstName} ${session.user.lastName}`
  const typeLabel = LEAVE_TYPE_LABEL[leaveType]
  const startFmt = formatDateTH(start)
  const endFmt = formatDateTH(end)

  await sendLineMessage(
    `📋 คำขอลางาน\n${fullName} ขอ${typeLabel} ${startFmt}–${endFmt} (${daysCount} วัน)\nเหตุผล: ${reason}`,
  )

  revalidatePath('/leave')
  return { ok: true, id: leave.id }
}

export async function approveLeave(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return { ok: false, error: 'permission_denied' }
  }

  const leave = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { user: { select: { firstName: true, lastName: true } } },
  })
  if (!leave) return { ok: false, error: 'not_found' }
  if (leave.status !== 'PENDING') return { ok: false, error: 'not_pending' }

  await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approverId: session.user.id,
      approvedAt: new Date(),
    },
  })

  const requesterName = `${leave.user.firstName} ${leave.user.lastName}`
  const approverName = `${session.user.firstName} ${session.user.lastName}`
  const typeLabel = LEAVE_TYPE_LABEL[leave.leaveType]
  const startFmt = formatDateTH(leave.startDate)
  const endFmt = formatDateTH(leave.endDate)

  await sendLineMessage(
    `✅ อนุมัติลางาน\n${requesterName} ${typeLabel} ${startFmt}–${endFmt} อนุมัติโดย ${approverName}`,
  )

  revalidatePath('/leave')
  return { ok: true }
}

export async function rejectLeave(
  id: string,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return { ok: false, error: 'permission_denied' }
  }

  const leave = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { user: { select: { firstName: true, lastName: true } } },
  })
  if (!leave) return { ok: false, error: 'not_found' }
  if (leave.status !== 'PENDING') return { ok: false, error: 'not_pending' }

  await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
    },
  })

  const requesterName = `${leave.user.firstName} ${leave.user.lastName}`
  const typeLabel = LEAVE_TYPE_LABEL[leave.leaveType]
  const startFmt = formatDateTH(leave.startDate)
  const endFmt = formatDateTH(leave.endDate)

  await sendLineMessage(
    `❌ ปฏิเสธลางาน\n${requesterName} ${typeLabel} ${startFmt}–${endFmt}\nเหตุผล: ${reason}`,
  )

  revalidatePath('/leave')
  return { ok: true }
}

export async function cancelLeave(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const leave = await prisma.leaveRequest.findUnique({ where: { id } })
  if (!leave) return { ok: false, error: 'not_found' }
  if (leave.userId !== session.user.id) return { ok: false, error: 'permission_denied' }
  if (leave.status !== 'PENDING') return { ok: false, error: 'not_pending' }

  await prisma.leaveRequest.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })

  revalidatePath('/leave')
  return { ok: true }
}
