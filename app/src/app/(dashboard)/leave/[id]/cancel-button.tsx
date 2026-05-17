'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cancelLeave } from '@/server/actions/leave'

interface CancelLeaveButtonProps {
  leaveId: string
}

export function CancelLeaveButton({ leaveId }: CancelLeaveButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    if (!confirm('ยืนยันยกเลิกคำขอลางานนี้?')) return

    setLoading(true)
    try {
      const res = await cancelLeave(leaveId)
      if (!res.ok) {
        toast.error('ยกเลิกไม่สำเร็จ')
        return
      }
      toast.success('ยกเลิกคำขอลางานสำเร็จ')
      router.refresh()
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={handleCancel}
      disabled={loading}
    >
      {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
      ยกเลิกคำขอ
    </Button>
  )
}
