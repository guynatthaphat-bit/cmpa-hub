'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { TaskDialog } from './task-dialog'
import { updateTask } from '@/server/actions/projects'
import type { TaskStatus, TaskPriority } from '@prisma/client'
import type { TaskData, MemberData } from '@/server/actions/projects'

// ---------------------------------------------------------------------------
// Column config
// ---------------------------------------------------------------------------

type Column = { status: TaskStatus; label: string }

const COLUMNS: Column[] = [
  { status: 'TODO', label: 'รอดำเนินการ' },
  { status: 'IN_PROGRESS', label: 'กำลังทำ' },
  { status: 'REVIEW', label: 'รอตรวจสอบ' },
  { status: 'DONE', label: 'เสร็จแล้ว' },
]

const COLUMN_STATUSES = COLUMNS.map((c) => c.status)

function nextStatus(s: TaskStatus): TaskStatus | null {
  const idx = COLUMN_STATUSES.indexOf(s)
  if (idx === -1 || idx === COLUMN_STATUSES.length - 1) return null
  return COLUMN_STATUSES[idx + 1] ?? null
}

function prevStatus(s: TaskStatus): TaskStatus | null {
  const idx = COLUMN_STATUSES.indexOf(s)
  if (idx <= 0) return null
  return COLUMN_STATUSES[idx - 1] ?? null
}

// ---------------------------------------------------------------------------
// Priority styling
// ---------------------------------------------------------------------------

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: 'ต่ำ',
  MEDIUM: 'กลาง',
  HIGH: 'สูง',
  URGENT: 'ด่วน',
}

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  URGENT: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

// ---------------------------------------------------------------------------
// Task Card
// ---------------------------------------------------------------------------

interface TaskCardProps {
  task: TaskData
  members: MemberData[]
  projectId: string
  onMoved: () => void
}

function getInitials(first: string | null, last: string | null): string {
  return [(first ?? '').charAt(0), (last ?? '').charAt(0)].filter(Boolean).join('').toUpperCase()
}

function TaskCard({ task, members, projectId, onMoved }: TaskCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [, startTransition] = useTransition()

  function moveTask(newStatus: TaskStatus) {
    startTransition(async () => {
      const result = await updateTask(task.id, { status: newStatus })
      if (result.ok) {
        onMoved()
      } else {
        toast.error('ไม่สามารถย้ายงานได้')
      }
    })
  }

  const prev = prevStatus(task.status)
  const next = nextStatus(task.status)

  const isDue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'

  return (
    <>
      <div className="group flex flex-col gap-2 rounded-xl border bg-background p-3 shadow-sm">
        {/* Header row */}
        <div className="flex items-start justify-between gap-1">
          <button
            className="min-w-0 text-left"
            onClick={() => setDialogOpen(true)}
            type="button"
          >
            <p className="text-sm font-medium leading-snug group-hover:text-primary">{task.title}</p>
          </button>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASS[task.priority]}`}
          >
            {PRIORITY_LABEL[task.priority]}
          </span>
        </div>

        {/* Footer row: assignee + dueDate + move buttons */}
        <div className="flex items-center gap-2">
          {task.assignee && (
            <div
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary"
              title={`${task.assignee.firstName ?? ''} ${task.assignee.lastName ?? ''}`}
            >
              {getInitials(task.assignee.firstName, task.assignee.lastName)}
            </div>
          )}

          {task.dueDate && (
            <span
              className={`text-xs ${isDue ? 'font-medium text-red-500' : 'text-muted-foreground'}`}
            >
              {new Date(task.dueDate).toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}

          <div className="ml-auto flex items-center gap-1">
            {prev && (
              <button
                onClick={() => moveTask(prev)}
                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="ย้ายไปก่อนหน้า"
                type="button"
              >
                <ChevronLeft className="size-3.5" />
              </button>
            )}
            {next && (
              <button
                onClick={() => moveTask(next)}
                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="ย้ายไปถัดไป"
                type="button"
              >
                <ChevronRight className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {dialogOpen && (
        <TaskDialog
          projectId={projectId}
          members={members}
          task={task}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Kanban Board
// ---------------------------------------------------------------------------

interface KanbanBoardProps {
  projectId: string
  tasks: TaskData[]
  members: MemberData[]
}

export function KanbanBoard({ projectId, tasks, members }: KanbanBoardProps) {
  const router = useRouter()
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const visibleTasks = tasks.filter((t) => t.status !== 'CANCELLED')

  function handleMoved() {
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:overflow-x-auto md:pb-2">
        {COLUMNS.map((col) => {
          const colTasks = visibleTasks.filter((t) => t.status === col.status)
          return (
            <div
              key={col.status}
              className="flex flex-col gap-2 md:w-64 md:shrink-0"
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {col.label}
                </h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="flex flex-col gap-2">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    members={members}
                    projectId={projectId}
                    onMoved={handleMoved}
                  />
                ))}
              </div>

              {/* Add task button in TODO column */}
              {col.status === 'TODO' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-1.5 text-muted-foreground"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="size-4" />
                  เพิ่มงาน
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {addDialogOpen && (
        <TaskDialog
          projectId={projectId}
          members={members}
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
        />
      )}
    </>
  )
}
