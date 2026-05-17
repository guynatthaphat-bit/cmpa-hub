import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Clock, User } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ApprovalPanel } from '@/components/modules/leave/approval-panel'
import { CancelLeaveButton } from './cancel-button'
import type { LeaveType, LeaveStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: params.id },
    select: { leaveType: true },
  })
  if (!leave) return { title: 'ไม่พบรายการ' }
  return { title: `ลา${LEAVE_TYPE_LABEL[leave.leaveType]}` }
}

const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  ANNUAL: 'พักร้อน',
  SICK: 'ป่วย',
  PERSONAL: 'กิจ',
  MATERNITY: 'คลอด',
  ORDINATION: 'บวช',
  BEREAVEMENT: 'งานศพ',
  OTHER: 'อื่นๆ',
}

const LEAVE_TYPE_FULL: Record<LeaveType, string> = {
  ANNUAL: 'ลาพักร้อน',
  SICK: 'ลาป่วย',
  PERSONAL: 'ลากิจ',
  MATERNITY: 'ลาคลอด',
  ORDINATION: 'ลาบวช',
  BEREAVEMENT: 'ลาเนื่องจากงานศพ',
  OTHER: 'ลาอื่นๆ',
}

const STATUS_LABEL: Record<LeaveStatus, string> = {
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติ',
  REJECTED: 'ปฏิเสธ',
  CANCELLED: 'ยกเลิก',
}

const STATUS_VARIANT: Record<LeaveStatus, 'warning' | 'success' | 'destructive' | 'secondary'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'secondary',
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  })
}

function fmtDateTime(d: Date | string): string {
  return new Date(d).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  })
}

export default async function LeaveDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return null

  const leave = await prisma.leaveRequest.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { firstName: true, lastName: true, employeeCode: true } },
      approver: { select: { firstName: true, lastName: true } },
    },
  })

  if (!leave) notFound()

  const isManager = session.user.role === 'ADMIN' || session.user.role === 'MANAGER'
  const isOwner = leave.userId === session.user.id
  const canApprove = isManager && leave.status === 'PENDING'
  const canCancel = isOwner && leave.status === 'PENDING'

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-3 animate-fade-in">
      {/* Header */}
      <section className="flex items-start gap-3">
        <Link
          href="/leave"
          className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mt-0.5"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-bold leading-tight">
            {LEAVE_TYPE_FULL[leave.leaveType]}
          </h1>
          <div className="mt-1">
            <Badge variant={STATUS_VARIANT[leave.status]}>
              {STATUS_LABEL[leave.status]}
            </Badge>
          </div>
        </div>
      </section>

      {/* Detail card */}
      <div className="surface-card flex flex-col gap-4 p-5">
        {/* Requester */}
        <div className="flex items-start gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <User className="size-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ผู้ยื่นคำขอ</p>
            <p className="text-sm font-semibold">
              {leave.user.firstName} {leave.user.lastName}
              {leave.user.employeeCode && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  ({leave.user.employeeCode})
                </span>
              )}
            </p>
          </div>
        </div>

        <Separator />

        {/* Date range */}
        <div className="flex items-start gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <CalendarDays className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground">ช่วงเวลาที่ลา</p>
            <p className="text-sm font-semibold">{fmtDate(leave.startDate)}</p>
            {leave.startDate.toString() !== leave.endDate.toString() && (
              <p className="text-sm text-muted-foreground">ถึง {fmtDate(leave.endDate)}</p>
            )}
            <p className="mt-0.5 text-xs text-primary font-medium">
              รวม {leave.daysCount} วัน
            </p>
          </div>
        </div>

        <Separator />

        {/* Reason */}
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">เหตุผลการลา</p>
          <p className="text-sm whitespace-pre-wrap">{leave.reason}</p>
        </div>

        {/* Submitted at */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          ยื่นเมื่อ {fmtDateTime(leave.createdAt)}
        </div>

        {/* Approval info */}
        {leave.status === 'APPROVED' && leave.approver && leave.approvedAt && (
          <>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">อนุมัติโดย</p>
              <p className="text-sm font-semibold">
                {leave.approver.firstName} {leave.approver.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{fmtDateTime(leave.approvedAt)}</p>
            </div>
          </>
        )}

        {/* Rejection reason */}
        {leave.status === 'REJECTED' && leave.rejectionReason && (
          <>
            <Separator />
            <div className="rounded-xl bg-destructive/10 p-3">
              <p className="text-xs font-medium text-destructive mb-1">เหตุผลการปฏิเสธ</p>
              <p className="text-sm text-destructive">{leave.rejectionReason}</p>
            </div>
          </>
        )}
      </div>

      {/* Approval panel — manager only, PENDING status only */}
      {canApprove && (
        <div className="surface-card flex flex-col gap-3 p-4">
          <p className="text-sm font-semibold">การดำเนินการ</p>
          <ApprovalPanel leaveId={leave.id} status={leave.status} />
        </div>
      )}

      {/* Cancel button — owner, PENDING only */}
      {canCancel && !isManager && (
        <CancelLeaveButton leaveId={leave.id} />
      )}
    </div>
  )
}
