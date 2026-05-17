'use client'

import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createKPI, updateKPI } from '@/server/actions/kpi'
import type { KPIPeriod } from '@prisma/client'
import type { KPIData } from '@/server/actions/kpi'

const PERIOD_OPTIONS: { value: KPIPeriod; label: string }[] = [
  { value: 'MONTHLY', label: 'รายเดือน' },
  { value: 'QUARTERLY', label: 'รายไตรมาส' },
  { value: 'YEARLY', label: 'รายปี' },
]

function getBuddhistYear(): number {
  return new Date().getFullYear() + 543
}

function getAutoLabel(period: KPIPeriod): string {
  const by = getBuddhistYear()
  const now = new Date()
  if (period === 'MONTHLY') {
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${by}-${month}`
  }
  if (period === 'QUARTERLY') {
    const q = Math.ceil((now.getMonth() + 1) / 3)
    return `${by}-Q${q}`
  }
  return String(by)
}

interface KpiFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kpi?: KPIData
  onSuccess?: () => void
}

export function KpiForm({ open, onOpenChange, kpi, onSuccess }: KpiFormProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!kpi

  const [title, setTitle] = useState(kpi?.title ?? '')
  const [unit, setUnit] = useState(kpi?.unit ?? '')
  const [target, setTarget] = useState(String(kpi?.target ?? ''))
  const [current, setCurrent] = useState(String(kpi?.current ?? '0'))
  const [period, setPeriod] = useState<KPIPeriod>(kpi?.period ?? 'MONTHLY')
  const [periodLabel, setPeriodLabel] = useState(kpi?.periodLabel ?? getAutoLabel('MONTHLY'))
  const [description, setDescription] = useState(kpi?.description ?? '')
  const [weight, setWeight] = useState(String(kpi?.weight ?? '1'))

  // Auto-suggest periodLabel when period changes (create mode)
  useEffect(() => {
    if (!isEdit) {
      setPeriodLabel(getAutoLabel(period))
    }
  }, [period, isEdit])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !unit.trim() || !target || !periodLabel.trim()) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็น')
      return
    }

    const targetNum = parseFloat(target)
    const currentNum = parseFloat(current)
    const weightNum = parseFloat(weight)

    if (isNaN(targetNum) || targetNum <= 0) {
      toast.error('เป้าหมายต้องเป็นตัวเลขมากกว่า 0')
      return
    }

    startTransition(async () => {
      if (isEdit) {
        const result = await updateKPI(kpi.id, {
          title: title.trim(),
          unit: unit.trim(),
          target: targetNum,
          current: isNaN(currentNum) ? 0 : currentNum,
          period,
          periodLabel: periodLabel.trim(),
          description: description.trim() || undefined,
          weight: isNaN(weightNum) ? 1 : weightNum,
        })
        if (result.ok) {
          toast.success('อัปเดต KPI สำเร็จ')
          onOpenChange(false)
          onSuccess?.()
        } else {
          toast.error('เกิดข้อผิดพลาด: ' + result.error)
        }
      } else {
        const result = await createKPI({
          title: title.trim(),
          unit: unit.trim(),
          target: targetNum,
          period,
          periodLabel: periodLabel.trim(),
          description: description.trim() || undefined,
          weight: isNaN(weightNum) ? 1 : weightNum,
        })
        if (result.ok) {
          toast.success('เพิ่ม KPI สำเร็จ')
          onOpenChange(false)
          onSuccess?.()
        } else {
          toast.error('เกิดข้อผิดพลาด: ' + result.error)
        }
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไข KPI' : 'เพิ่ม KPI ใหม่'}</DialogTitle>
        </DialogHeader>

        <form id="kpi-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kpi-title">ชื่อ KPI *</Label>
            <Input
              id="kpi-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น จำนวนสมาชิกใหม่"
              required
            />
          </div>

          {/* Unit */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kpi-unit">หน่วย *</Label>
            <Input
              id="kpi-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="เช่น คน, บาท, ครั้ง"
              required
            />
          </div>

          {/* Target & Current */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kpi-target">เป้าหมาย *</Label>
              <Input
                id="kpi-target"
                type="number"
                min="0.01"
                step="any"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kpi-current">ค่าปัจจุบัน</Label>
              <Input
                id="kpi-current"
                type="number"
                min="0"
                step="any"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Period */}
          <div className="flex flex-col gap-1.5">
            <Label>รอบ *</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as KPIPeriod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period label */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kpi-period-label">ป้ายกำกับรอบ *</Label>
            <Input
              id="kpi-period-label"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              placeholder="เช่น 2569-05, 2569-Q2, 2569"
              required
            />
          </div>

          {/* Weight */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kpi-weight">น้ำหนัก</Label>
            <Input
              id="kpi-weight"
              type="number"
              min="0.1"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="1"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kpi-desc">รายละเอียด</Label>
            <Textarea
              id="kpi-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม (ไม่จำเป็น)"
              rows={2}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            ยกเลิก
          </Button>
          <Button type="submit" form="kpi-form" disabled={isPending}>
            {isPending ? 'กำลังบันทึก...' : isEdit ? 'บันทึก' : 'เพิ่ม KPI'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
