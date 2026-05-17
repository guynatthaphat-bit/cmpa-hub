'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { LeaveType, LeaveStatus } from '@prisma/client'

export interface LeaveCardLeave {
  id: string
  leaveType: LeaveType
  startDate: Date | string
  endDate: Date | string
  daysCount: number
  reason: string
  status: LeaveStatus
  rejectionReason: string | null
  approver: { firstName: string | null; lastName: string | null } | null
  approvedAt: Date | string | null
  createdAt: Date | string
}

interface LeaveCardProps {
  leave: LeaveCardLeave
  showUser?: boolean
  userName?: string
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
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Bangkok',
  })
}

export function LeaveCard({ leave, showUser, userName }: LeaveCardProps) {
  return (
    <Link href={`/leave/${leave.id}`} className="block">
      <div className="surface-card flex flex-col gap-2.5 p-4 transition-colors hover:border-primary/30">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold">ลา{LEAVE_TYPE_LABEL[leave.leaveType]}</span>
              {showUser && userName && (
                <span className="text-xs text-muted-foreground">— {userName}</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {fmtDate(leave.startDate)} – {fmtDate(leave.endDate)}
              <span className="ml-1.5">({leave.daysCount} วัน)</span>
            </span>
          </div>
          <Badge variant={STATUS_VARIANT[leave.status]} className="shrink-0 text-[10px]">
            {STATUS_LABEL[leave.status]}
          </Badge>
        </div>

        <p className="line-clamp-2 text-xs text-muted-foreground">{leave.reason}</p>

        {leave.status === 'APPROVED' && leave.approver && (
          <p className="text-xs text-muted-foreground">
            อนุมัติโดย {leave.approver.firstName} {leave.approver.lastName}
          </p>
        )}

        {leave.status === 'REJECTED' && leave.rejectionReason && (
          <p className="text-xs text-destructive line-clamp-1">
            เหตุผล: {leave.rejectionReason}
          </p>
        )}
      </div>
    </Link>
  )
}
