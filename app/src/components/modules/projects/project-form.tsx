'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
import { createProject, updateProject } from '@/server/actions/projects'
import type { ProjectStatus } from '@prisma/client'

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'PLANNING', label: 'วางแผน' },
  { value: 'ACTIVE', label: 'กำลังดำเนิน' },
  { value: 'ON_HOLD', label: 'พักไว้' },
  { value: 'COMPLETED', label: 'เสร็จสิ้น' },
  { value: 'CANCELLED', label: 'ยกเลิก' },
]

interface InitialData {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  startDate: Date | string | null
  endDate: Date | string | null
  budget: string | null
}

interface ProjectFormProps {
  initialData?: InitialData
}

function toInputDate(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0] ?? ''
}

export function ProjectForm({ initialData }: ProjectFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [status, setStatus] = useState<ProjectStatus>(initialData?.status ?? 'PLANNING')
  const [startDate, setStartDate] = useState(toInputDate(initialData?.startDate))
  const [endDate, setEndDate] = useState(toInputDate(initialData?.endDate))
  const [budget, setBudget] = useState(initialData?.budget ?? '')

  const isEdit = !!initialData

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('กรุณาระบุชื่อโครงการ')
      return
    }

    startTransition(async () => {
      if (isEdit) {
        const result = await updateProject(initialData.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          status,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          budget: budget || undefined,
        })
        if (result.ok) {
          toast.success('อัปเดตโครงการสำเร็จ')
          router.push('/projects/' + initialData.id)
        } else {
          toast.error('เกิดข้อผิดพลาด: ' + result.error)
        }
      } else {
        const result = await createProject({
          name: name.trim(),
          description: description.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          budget: budget || undefined,
        })
        if (result.ok) {
          toast.success('สร้างโครงการสำเร็จ')
          router.push('/projects')
        } else {
          toast.error('เกิดข้อผิดพลาด: ' + result.error)
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">ชื่อโครงการ *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ระบุชื่อโครงการ"
          required
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">รายละเอียด</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="รายละเอียดโครงการ (ไม่จำเป็น)"
          rows={3}
        />
      </div>

      {/* Status — only when editing */}
      {isEdit && (
        <div className="flex flex-col gap-1.5">
          <Label>สถานะ</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">วันเริ่มต้น</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endDate">วันสิ้นสุด</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Budget */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="budget">งบประมาณ (บาท)</Label>
        <Input
          id="budget"
          type="number"
          min="0"
          step="0.01"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="0.00 (ไม่จำเป็น)"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={isPending}
        >
          ยกเลิก
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'กำลังบันทึก...' : isEdit ? 'บันทึก' : 'สร้างโครงการ'}
        </Button>
      </div>
    </form>
  )
}
