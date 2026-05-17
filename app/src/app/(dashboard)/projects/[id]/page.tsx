import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, KanbanSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getProject } from '@/server/actions/projects'
import { KanbanBoard } from '@/components/modules/projects/kanban-board'
import type { ProjectStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<ProjectStatus, string> = {
  PLANNING: 'วางแผน',
  ACTIVE: 'กำลังดำเนิน',
  ON_HOLD: 'พักไว้',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
}

const STATUS_CLASS: Record<ProjectStatus, string> = {
  PLANNING: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  ACTIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  ON_HOLD: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  CANCELLED: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

function formatDate(d: Date | string | null): string | null {
  if (!d) return null
  return new Date(d).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props) {
  const project = await getProject(params.id)
  return { title: project?.name ?? 'โครงการ' }
}

export default async function ProjectDetailPage({ params }: Props) {
  const project = await getProject(params.id)
  if (!project) notFound()

  const ownerName = [project.owner.firstName, project.owner.lastName].filter(Boolean).join(' ')

  const members = project.members.map((m) => ({
    id: m.user.id,
    firstName: m.user.firstName,
    lastName: m.user.lastName,
    avatarUrl: m.user.avatarUrl,
  }))

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-3 animate-fade-in">
      {/* Header */}
      <section className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="-ml-1 shrink-0">
            <Link href="/projects">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold">{project.name}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[project.status]}`}
              >
                {STATUS_LABEL[project.status]}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{project.code}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href={`/projects/${project.id}/edit`}>
            <Pencil className="mr-1.5 size-3.5" />
            แก้ไข
          </Link>
        </Button>
      </section>

      {/* Info row */}
      <section className="surface-card flex flex-wrap gap-4 p-4 text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">เจ้าของโครงการ</span>
          <span className="font-medium">{ownerName || '-'}</span>
        </div>
        {(project.startDate || project.endDate) && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">ระยะเวลา</span>
            <span className="font-medium">
              {formatDate(project.startDate) ?? '?'} – {formatDate(project.endDate) ?? '?'}
            </span>
          </div>
        )}
        {project.budget && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">งบประมาณ</span>
            <span className="font-medium">
              {parseFloat(project.budget).toLocaleString('th-TH', {
                style: 'currency',
                currency: 'THB',
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        )}
        {project.description && (
          <div className="w-full">
            <span className="text-xs text-muted-foreground">รายละเอียด</span>
            <p className="mt-0.5 text-sm">{project.description}</p>
          </div>
        )}
      </section>

      {/* Kanban board */}
      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          บอร์ดงาน
        </h2>
        <KanbanBoard
          projectId={project.id}
          tasks={project.tasks}
          members={members}
        />
      </section>
    </div>
  )
}
