'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import { createTask, updateTask } from '@/server/actions/projects'
import type { TaskStatus, TaskPriority } from '@prisma/client'
import type { TaskData, MemberData } from '@/server/actions/projects'

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'LOW', label: 'ต่ำ' },
  { value: 'MEDIUM', label: 'กลาง' },
  { value: 'HIGH', label: 'สูง' },
  { value: 'URGENT', label: 'ด่วน' },
]

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'รอดำเนินการ' },
  { value: 'IN_PROGRESS', label: 'กำลังทำ' },
  { value: 'REVIEW', label: 'รอตรวจสอบ' },
  { value: 'DONE', label: 'เสร็จแล้ว' },
  { value: 'CANCELLED', label: 'ยกเลิก' },
]

function toInputDate(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0] ?? ''
}

interface TaskDialogProps {
  projectId: string
  members: MemberData[]
  task?: TaskData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDialog({ projectId, members, task, open, onOpenChange }: TaskDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const isEdit = !!task

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'MEDIUM')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'TODO')
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? '__none__')
  const [dueDate, setDueDate] = useState(toInputDate(task?.dueDate))

  // Reset state when dialog opens fresh
  function handleOpenChange(open: boolean) {
    if (!open) {
      onOpenChange(false)
    } else {
      onOpenChange(true)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('กรุณาระบุชื่องาน')
      return
    }

    startTransition(async () => {
      const resolvedAssigneeId = assigneeId === '__none__' ? undefined : assigneeId

      if (isEdit) {
        const result = await updateTask(task.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          status,
          assigneeId: resolvedAssigneeId ?? null,
          dueDate: dueDate || null,
        })
        if (result.ok) {
          toast.success('อัปเดตงานสำเร็จ')
          onOpenChange(false)
          router.refresh()
        } else {
          toast.error('เกิดข้อผิดพลาด')
        }
      } else {
        const result = await createTask({
          projectId,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          assigneeId: resolvedAssigneeId,
          dueDate: dueDate || undefined,
        })
        if (result.ok) {
          toast.success('เพิ่มงานสำเร็จ')
          onOpenChange(false)
          router.refresh()
        } else {
          toast.error('เกิดข้อผิดพลาด')
        }
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}</DialogTitle>
        </DialogHeader>

        <form id="task-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-title">ชื่องาน *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ระบุชื่องาน"
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-desc">รายละเอียด</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียดงาน (ไม่จำเป็น)"
              rows={2}
            />
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1.5">
            <Label>ความสำคัญ</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status — edit mode only */}
          {isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label>สถานะ</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
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

          {/* Assignee */}
          {members.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>ผู้รับผิดชอบ</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">ไม่ระบุ</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Due date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-due">วันครบกำหนด</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            ยกเลิก
          </Button>
          <Button type="submit" form="task-form" disabled={isPending}>
            {isPending ? 'กำลังบันทึก...' : isEdit ? 'บันทึก' : 'เพิ่มงาน'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
