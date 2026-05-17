'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { submitClaim, deleteDraft } from '@/server/actions/expenses'

interface SubmitButtonProps {
  claimId: string
}

export function SubmitButton({ claimId }: SubmitButtonProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await submitClaim(claimId)
      if (!res.ok) {
        toast.error('ยื่นเบิกไม่สำเร็จ')
        return
      }
      toast.success('ยื่นเบิกค่าใช้จ่ายสำเร็จ')
      router.refresh()
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('ต้องการลบรายการนี้?')) return
    setDeleting(true)
    try {
      const res = await deleteDraft(claimId)
      if (!res.ok) {
        toast.error('ลบไม่สำเร็จ')
        return
      }
      toast.success('ลบรายการเรียบร้อย')
      router.push('/expenses')
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleDelete}
        disabled={submitting || deleting}
      >
        {deleting ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Trash2 className="mr-2 size-4" />
        )}
        ลบ
      </Button>
      <Button className="flex-1" onClick={handleSubmit} disabled={submitting || deleting}>
        {submitting ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Send className="mr-2 size-4" />
        )}
        ยื่นเบิก
      </Button>
    </div>
  )
}
