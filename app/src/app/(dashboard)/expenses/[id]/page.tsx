import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Tag, Clock, Bot } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getClaim } from '@/server/actions/expenses'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ExpenseApprovalPanel } from '@/components/modules/expenses/expense-approval-panel'
import { SubmitButton } from './submit-button'
import type { ExpenseCategory, ExpenseStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const claim = await getClaim(params.id)
  if (!claim) return { title: 'ไม่พบรายการ' }
  return { title: `เบิก${CATEGORY_LABEL[claim.category]}` }
}

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

function fmtAmount(amount: unknown): string {
  return Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })
}

export default async function ExpenseDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return null

  const claim = await getClaim(params.id)
  if (!claim) notFound()

  const isManager = session.user.role === 'ADMIN' || session.user.role === 'MANAGER'
  const isOwner = claim.userId === session.user.id
  const canSubmit = isOwner && claim.status === 'DRAFT'
  const canApprove =
    isManager && (claim.status === 'SUBMITTED' || claim.status === 'APPROVED')

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-3 animate-fade-in">
      {/* Header */}
      <section className="flex items-start gap-3">
        <Link
          href="/expenses"
          className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mt-0.5"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-bold leading-tight">
            เบิก{CATEGORY_LABEL[claim.category]}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[claim.status]}>
              {STATUS_LABEL[claim.status]}
            </Badge>
            <span className="text-sm font-bold tabular-nums text-primary">
              {fmtAmount(claim.amount)} ฿
            </span>
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
            <p className="text-xs text-muted-foreground">ผู้ยื่นเบิก</p>
            <p className="text-sm font-semibold">
              {claim.user.firstName} {claim.user.lastName}
            </p>
          </div>
        </div>

        <Separator />

        {/* Category + Amount */}
        <div className="flex items-start gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Tag className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground">หมวดหมู่</p>
            <p className="text-sm font-semibold">{CATEGORY_LABEL[claim.category]}</p>
            <p className="text-lg font-bold tabular-nums text-primary">
              {fmtAmount(claim.amount)} บาท
            </p>
          </div>
        </div>

        <Separator />

        {/* Description */}
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">รายละเอียด</p>
          <p className="text-sm whitespace-pre-wrap">{claim.description}</p>
        </div>

        {/* Submitted at */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          ยื่นเมื่อ {fmtDateTime(claim.createdAt)}
        </div>

        {/* OCR info */}
        {(claim.ocrVendor || claim.ocrDate || claim.ocrAmount != null) && (
          <>
            <Separator />
            <div className="rounded-xl bg-muted/40 p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Bot className="size-4 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground">ข้อมูลจาก OCR</p>
                {claim.ocrConfidence != null && (
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(claim.ocrConfidence * 100)}%)
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {claim.ocrVendor && (
                  <div>
                    <span className="text-muted-foreground">ร้านค้า</span>
                    <p className="font-medium">{claim.ocrVendor}</p>
                  </div>
                )}
                {claim.ocrDate && (
                  <div>
                    <span className="text-muted-foreground">วันที่</span>
                    <p className="font-medium">{fmtDate(claim.ocrDate)}</p>
                  </div>
                )}
                {claim.ocrAmount != null && (
                  <div>
                    <span className="text-muted-foreground">จำนวน</span>
                    <p className="font-medium tabular-nums">{fmtAmount(claim.ocrAmount)} ฿</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Approval info */}
        {(claim.status === 'APPROVED' || claim.status === 'PAID') && claim.approver && claim.approvedAt && (
          <>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">อนุมัติโดย</p>
              <p className="text-sm font-semibold">
                {claim.approver.firstName} {claim.approver.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{fmtDateTime(claim.approvedAt)}</p>
            </div>
          </>
        )}

        {claim.status === 'PAID' && claim.paidAt && (
          <>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">จ่ายเงินวันที่</p>
              <p className="text-sm font-semibold text-purple-600">{fmtDate(claim.paidAt)}</p>
            </div>
          </>
        )}
      </div>

      {/* Receipt image */}
      {claim.receiptUrl && (
        <div className="surface-card p-4 flex flex-col gap-2">
          <p className="text-sm font-semibold">ใบเสร็จ</p>
          <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
            <img
              src={claim.receiptUrl}
              alt="ใบเสร็จ"
              className="mx-auto max-h-80 w-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Submit / Delete buttons for DRAFT owner */}
      {canSubmit && (
        <div className="surface-card flex flex-col gap-3 p-4">
          <p className="text-sm font-semibold">การดำเนินการ</p>
          <SubmitButton claimId={claim.id} />
        </div>
      )}

      {/* Approval panel for managers */}
      {canApprove && (
        <div className="surface-card flex flex-col gap-3 p-4">
          <p className="text-sm font-semibold">การดำเนินการ (ผู้อนุมัติ)</p>
          <ExpenseApprovalPanel
            claimId={claim.id}
            status={claim.status}
            amount={Number(claim.amount)}
          />
        </div>
      )}
    </div>
  )
}
