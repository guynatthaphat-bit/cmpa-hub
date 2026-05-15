'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { AttendanceStatus } from '@prisma/client'

export type AttendanceActionState = {
  ok: boolean
  error?: string
  data?: {
    id: string
    clockInAt: string | null
    clockOutAt: string | null
    status: string
  }
}

function bangkokDateParts(now: Date) {
  const bkk = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const dateOnly = new Date(bkk.getFullYear(), bkk.getMonth(), bkk.getDate())
  return { bkk, dateOnly }
}

export async function clockInAction(
  lat: number | null,
  lng: number | null,
  selfieDataUrl: string | null,
): Promise<AttendanceActionState> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const userId = session.user.id
  const now = new Date()
  const { bkk, dateOnly } = bangkokDateParts(now)

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: dateOnly } },
  })
  if (existing?.clockInAt) return { ok: false, error: 'alreadyClockedIn' }

  const isLate = bkk.getHours() > 9 || (bkk.getHours() === 9 && bkk.getMinutes() > 0)
  const status: AttendanceStatus = isLate ? 'LATE' : 'PRESENT'

  const record = await prisma.attendance.upsert({
    where: { userId_date: { userId, date: dateOnly } },
    create: { userId, date: dateOnly, clockInAt: now, clockInLat: lat, clockInLng: lng, clockInSelfie: selfieDataUrl, status },
    update: { clockInAt: now, clockInLat: lat, clockInLng: lng, clockInSelfie: selfieDataUrl, status },
  })

  revalidatePath('/attendance')
  revalidatePath('/')

  return {
    ok: true,
    data: {
      id: record.id,
      clockInAt: record.clockInAt?.toISOString() ?? null,
      clockOutAt: null,
      status: record.status,
    },
  }
}

export async function clockOutAction(
  lat: number | null,
  lng: number | null,
  selfieDataUrl: string | null,
): Promise<AttendanceActionState> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const userId = session.user.id
  const now = new Date()
  const { bkk, dateOnly } = bangkokDateParts(now)

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: dateOnly } },
  })
  if (!existing?.clockInAt) return { ok: false, error: 'notClockedIn' }
  if (existing.clockOutAt) return { ok: false, error: 'alreadyClockedOut' }

  const isEarlyLeave = bkk.getHours() < 17
  const newStatus: AttendanceStatus = isEarlyLeave ? 'EARLY_LEAVE' : existing.status

  const record = await prisma.attendance.update({
    where: { id: existing.id },
    data: { clockOutAt: now, clockOutLat: lat, clockOutLng: lng, clockOutSelfie: selfieDataUrl, status: newStatus },
  })

  revalidatePath('/attendance')
  revalidatePath('/')

  return {
    ok: true,
    data: {
      id: record.id,
      clockInAt: record.clockInAt?.toISOString() ?? null,
      clockOutAt: record.clockOutAt?.toISOString() ?? null,
      status: record.status,
    },
  }
}

export async function getTodayAttendance() {
  const session = await auth()
  if (!session?.user?.id) return null

  const { dateOnly } = bangkokDateParts(new Date())
  return prisma.attendance.findUnique({
    where: { userId_date: { userId: session.user.id, date: dateOnly } },
    select: { id: true, clockInAt: true, clockOutAt: true, status: true, clockInLat: true, clockInLng: true },
  })
}

export async function getAttendanceHistory(page = 0) {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.attendance.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    take: 20,
    skip: page * 20,
    select: { id: true, date: true, clockInAt: true, clockOutAt: true, status: true },
  })
}
