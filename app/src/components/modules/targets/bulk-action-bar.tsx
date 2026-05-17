'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { bulkUpdateStatus } from '@/server/actions/targets'
import { useRouter } from 'next/navigation'
import type { TargetStatus } from '@prisma/client'

const STATUS_OPTIONS: { value: TargetStatus; label: string }[] = [
  { value: 'NEW', label: 'ยังไม่ติดต่อ' },
  { value: 'CONTACTED', label: 'ส่งจดหมายแล้ว' },
  { value: 'PENDING', label: 'รอตอบรับ' },
  { value: 'DONE', label: 'ได้รับการตอบรับ' },
  { value: 'REJECTED', label: 'ปฏิเสธ' },
]

interface BulkActionBarProps {
  selectedIds: string[]
  onClear: () => void
}

export function BulkActionBar({ selectedIds, onClear }: BulkActionBarProps) {
  const router = useRouter()
  const [status, setStatus] = useState<TargetStatus>('CONTACTED')
  const [saving, setSaving] = useState(false)

  if (selectedIds.length === 0) return null

  async function handleUpdate() {
    setSaving(true)
    try {
      const res = await bulkUpdateStatus(selectedIds, status)
      if (!res.ok) throw new Error()
      toast.success(`อัปเดต ${selectedIds.length} รายการสำเร็จ`)
      onClear()
      router.refresh()
    } catch {
      toast.error('อัปเดตไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl border bg-background/95 backdrop-blur-sm shadow-lg px-4 py-3">
      <span className="text-sm font-medium shrink-0">{selectedIds.length} รายการ</span>
      <Select value={status} onValueChange={(v) => setStatus(v as TargetStatus)}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={handleUpdate} disabled={saving} className="shrink-0">
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : 'อัปเดต'}
      </Button>
      <button onClick={onClear} className="text-muted-foreground hover:text-foreground">
        <X className="size-4" />
      </button>
    </div>
  )
}
