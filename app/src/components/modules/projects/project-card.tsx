'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { ProjectStatus } from '@prisma/client'

interface ProjectCardProps {
  project: {
    id: string
    code: string
    name: string
    status: ProjectStatus
    description: string | null
    startDate: Date | string | null
    endDate: Date | string | null
    budget: string | null
    owner: { firstName: string | null; lastName: string | null }
    _count: { tasks: number }
  }
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  PLANNING: 'วางแผน',
  ACTIVE: 'กำลังดำเนิน',
  ON_HOLD: 'พักไว้',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
}

const STATUS_VARIANT: Record<ProjectStatus, 'secondary' | 'default' | 'outline' | 'destructive'> = {
  PLANNING: 'secondary',
  ACTIVE: 'default',
  ON_HOLD: 'outline',
  COMPLETED: 'default',
  CANCELLED: 'destructive',
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

export function ProjectCard({ project }: ProjectCardProps) {
  const ownerName = [project.owner.firstName, project.owner.lastName].filter(Boolean).join(' ')

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <div className="surface-card flex flex-col gap-2 p-4 transition-colors hover:bg-muted/40 active:scale-[0.99]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-xs text-muted-foreground">{project.code}</p>
            <h3 className="truncate font-semibold leading-snug">{project.name}</h3>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[project.status]}`}
          >
            {STATUS_LABEL[project.status]}
          </span>
        </div>

        {project.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>เจ้าของ: {ownerName || '-'}</span>
          <span>{project._count.tasks} งาน</span>
          {(project.startDate || project.endDate) && (
            <span>
              {formatDate(project.startDate) ?? '?'} – {formatDate(project.endDate) ?? '?'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
