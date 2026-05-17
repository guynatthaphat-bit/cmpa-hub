'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { createLeaveRequest } from '@/server/actions/leave'
import type { LeaveType } from '@prisma/client'

const LEAVE_TYPE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: 'ANNUAL', label: 'ลาพักร้อน' },
  { value: 'SICK', label: 'ลาป่วย' },
  { value: 'PERSONAL', label: 'ลากิจ' },
  { value: 'MATERNITY', label: 'ลาคลอด' },
  { value: 'ORDINATION', label: 'ลาบวช' },
  { value: 'BEREAVEMENT', label: 'ลาเนื่องจากงานศพ' },
  { value: 'OTHER', label: 'ลาอื่นๆ' },
]

/**
 * Count weekdays (Mon–Fri) between two Date objects, inclusive.
 */
function countWeekdays(start: Date, end: Date): number {
  let count = 0
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  const endDate = new Date(end)
  endDate.setHours(0, 0, 0, 0)

  while (cur <= endDate) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export function LeaveForm() {
  const router = useRouter()

  const [leaveType, setLeaveType] = useState<LeaveType>('ANNUAL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [halfDay, setHalfDay] = useState(false)
  const [daysCount, setDaysCount] = useState(0)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  // Auto-calculate daysCount whenever dates or halfDay changes
  useEffect(() => {
    if (!startDate || !endDate) {
      setDaysCount(0)
      return
    }
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end < start) {
      setDaysCount(0)
      return
    }
    let days = countWeekdays(start, end)
    if (halfDay) days = days / 2
    setDaysCount(Math.max(days, 0))
  }, [startDate, endDate, halfDay])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!startDate || !endDate) {
      toast.error('กรุณาเลือกวันที่')
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error('วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น')
      return
    }
    if (daysCount < 0.5) {
      toast.error('จำนวนวันลาต้องมากกว่า 0')
      return
    }
    if (!reason.trim()) {
      toast.error('กรุณากรอกเหตุผลการลา')
      return
    }

    setSaving(true)
    try {
      const res = await createLeaveRequest({
        leaveType,
        startDate,
        endDate,
        daysCount,
        reason: reason.trim(),
      })

      if (!res.ok) {
        toast.error(res.error ?? 'บันทึกไม่สำเร็จ')
        return
      }

      toast.success('ยื่นคำขอลางานสำเร็จ')
      router.push('/leave')
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Leave type */}
      <div>
        <Label htmlFor="leaveType">ประเภทการลา *</Label>
        <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
          <SelectTrigger className="mt-1" id="leaveType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEAVE_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="startDate">วันที่เริ่มลา *</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="endDate">วันสุดท้าย *</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1"
            required
          />
        </div>
      </div>

      {/* Half-day toggle + days count display */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium select-none">
          <input
            type="checkbox"
            checked={halfDay}
            onChange={(e) => setHalfDay(e.target.checked)}
            className="size-4 accent-primary"
          />
          ครึ่งวัน
        </label>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">จำนวนวันลา</span>
          <p className="text-lg font-bold tabular-nums text-primary">
            {daysCount > 0 ? daysCount : '—'} วัน
          </p>
        </div>
      </div>

      {/* Reason */}
      <div>
        <Label htmlFor="reason">เหตุผลการลา *</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="กรอกเหตุผลการลา..."
          className="mt-1"
          rows={3}
          required
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={saving}
        >
          ยกเลิก
        </Button>
        <Button type="submit" className="flex-1" disabled={saving || daysCount < 0.5}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          ยื่นคำขอลา
        </Button>
      </div>
    </form>
  )
}
