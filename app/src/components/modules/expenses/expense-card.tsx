'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { ExpenseCategory, ExpenseStatus } from '@prisma/client'

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  TRAVEL: 'เดินทาง',
  MEAL: 'อาหาร',
  OFFICE_SUPPLY: 'เครื่องเขียน',
  EVENT: 'จัดงาน',
  OVERTIME: 'OT',
  OTHER: 'อื่นๆ',
}

const STATUS_LABEL: Record<ExpenseStatus, string> = {
  DRAFT: 'ร่าง',
  SUBMITTED: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ปฏิเสธ',
  PAID: 'จ่ายแล้ว',
}

const STATUS_VARIANT: Record<
  ExpenseStatus,
  'secondary' | 'warning' | 'success' | 'destructive' | 'default'
> = {
  DRAFT: 'secondary',
  SUBMITTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  PAID: 'default',
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  })
}

function fmtAmount(amount: unknown): string {
  return Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })
}

export interface ExpenseCardClaim {
  id: string
  category: ExpenseCategory
  amount: { toFixed?: (n: number) => string } | string | number
  description: string
  status: ExpenseStatus
  ocrVendor: string | null
  ocrConfidence: number | null
  createdAt: Date | string
  approver: { firstName: string | null; lastName: string | null } | null
  approvedAt: Date | string | null
  paidAt: Date | string | null
}

interface ExpenseCardProps {
  claim: ExpenseCardClaim
  showUser?: boolean
  userName?: string
}

export function ExpenseCard({ claim, showUser, userName }: ExpenseCardProps) {
  return (
    <Link href={`/expenses/${claim.id}`} className="block">
      <div className="surface-card flex flex-col gap-2.5 p-4 transition-colors hover:border-primary/30">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold">
                {CATEGORY_LABEL[claim.category]}
              </span>
              {showUser && userName && (
                <span className="text-xs text-muted-foreground">— {userName}</span>
              )}
              {claim.ocrVendor && (
                <span className="text-xs text-muted-foreground">
                  (OCR: {claim.ocrVendor})
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {fmtDate(claim.createdAt)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant={STATUS_VARIANT[claim.status]} className="text-[10px]">
              {STATUS_LABEL[claim.status]}
            </Badge>
            <span className="text-sm font-bold tabular-nums">
              {fmtAmount(claim.amount)} ฿
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-xs text-muted-foreground">{claim.description}</p>

        {/* Approval info */}
        {(claim.status === 'APPROVED' || claim.status === 'PAID') && claim.approver && (
          <p className="text-xs text-muted-foreground">
            อนุมัติโดย {claim.approver.firstName} {claim.approver.lastName}
            {claim.approvedAt && ` — ${fmtDate(claim.approvedAt)}`}
          </p>
        )}

        {claim.status === 'PAID' && claim.paidAt && (
          <p className="text-xs text-primary font-medium">
            จ่ายแล้ว {fmtDate(claim.paidAt)}
          </p>
        )}
      </div>
    </Link>
  )
}
