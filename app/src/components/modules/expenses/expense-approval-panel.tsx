'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { approveClaim, rejectClaim, markPaid } from '@/server/actions/expenses'
import type { ExpenseStatus } from '@prisma/client'

interface ExpenseApprovalPanelProps {
  claimId: string
  status: ExpenseStatus
  amount: number | string
}

export function ExpenseApprovalPanel({ claimId, status, amount }: ExpenseApprovalPanelProps) {
  const router = useRouter()

  const [approving, setApproving] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)

  if (status === 'SUBMITTED') {
    async function handleApprove() {
      setApproving(true)
      try {
        const res = await approveClaim(claimId)
        if (!res.ok) {
          toast.error('อนุมัติไม่สำเร็จ')
          return
        }
        toast.success('อนุมัติเรียบร้อย')
        router.refresh()
      } catch {
        toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
      } finally {
        setApproving(false)
      }
    }

    async function handleReject() {
      if (!rejectionReason.trim()) {
        toast.error('กรุณากรอกเหตุผลการปฏิเสธ')
        return
      }
      setRejecting(true)
      try {
        const res = await rejectClaim(claimId, rejectionReason.trim())
        if (!res.ok) {
          toast.error('ปฏิเสธไม่สำเร็จ')
          return
        }
        toast.success('ปฏิเสธคำขอเรียบร้อย')
        setRejectOpen(false)
        setRejectionReason('')
        router.refresh()
      } catch {
        toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
      } finally {
        setRejecting(false)
      }
    }

    return (
      <>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setRejectOpen(true)}
            disabled={approving}
          >
            ปฏิเสธ
          </Button>
          <Button
            className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
            onClick={handleApprove}
            disabled={approving}
          >
            {approving && <Loader2 className="mr-2 size-4 animate-spin" />}
            อนุมัติ{' '}
            {Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
          </Button>
        </div>

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เหตุผลการปฏิเสธ</DialogTitle>
            </DialogHeader>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="กรอกเหตุผลการปฏิเสธ..."
              rows={3}
              className="mt-2"
              autoFocus
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectOpen(false)
                  setRejectionReason('')
                }}
                disabled={rejecting}
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejecting || !rejectionReason.trim()}
              >
                {rejecting && <Loader2 className="mr-2 size-4 animate-spin" />}
                ยืนยันปฏิเสธ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  if (status === 'APPROVED') {
    async function handleMarkPaid() {
      setMarkingPaid(true)
      try {
        const res = await markPaid(claimId)
        if (!res.ok) {
          toast.error('บันทึกการจ่ายไม่สำเร็จ')
          return
        }
        toast.success('บันทึกการจ่ายเรียบร้อย')
        router.refresh()
      } catch {
        toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
      } finally {
        setMarkingPaid(false)
      }
    }

    return (
      <Button
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        onClick={handleMarkPaid}
        disabled={markingPaid}
      >
        {markingPaid && <Loader2 className="mr-2 size-4 animate-spin" />}
        บันทึกการจ่าย{' '}
        {Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
      </Button>
    )
  }

  return null
}
