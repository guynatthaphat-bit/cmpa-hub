'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { KPIData } from '@/server/actions/kpi'

interface KpiCardProps {
  kpi: KPIData
  onEdit: () => void
  onDelete: () => void
}

function getProgressColor(pct: number): string {
  if (pct >= 100) return 'bg-green-500'
  if (pct >= 60) return 'bg-blue-500'
  return 'bg-red-500'
}

function getProgressTextColor(pct: number): string {
  if (pct >= 100) return 'text-green-600 dark:text-green-400'
  if (pct >= 60) return 'text-blue-600 dark:text-blue-400'
  return 'text-red-500 dark:text-red-400'
}

export function KpiCard({ kpi, onEdit, onDelete }: KpiCardProps) {
  const pct = kpi.target > 0 ? Math.min((kpi.current / kpi.target) * 100, 100) : 0
  const displayPct = kpi.target > 0 ? Math.round((kpi.current / kpi.target) * 100) : 0

  function handleDelete() {
    if (window.confirm(`ต้องการลบ KPI "${kpi.title}" ใช่หรือไม่?`)) {
      onDelete()
    }
  }

  return (
    <div className="surface-card flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="font-semibold leading-snug">{kpi.title}</h3>
          <p className="text-xs text-muted-foreground">{kpi.periodLabel}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" className="size-7" onClick={onEdit} title="แก้ไข">
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-destructive hover:text-destructive"
            onClick={handleDelete}
            title="ลบ"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">
            {kpi.current.toLocaleString('th-TH')} / {kpi.target.toLocaleString('th-TH')} {kpi.unit}
          </span>
          <span className={`text-sm font-semibold ${getProgressTextColor(displayPct)}`}>
            {displayPct}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${getProgressColor(displayPct)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {kpi.description && (
          <span className="line-clamp-1 flex-1">{kpi.description}</span>
        )}
        <span className="ml-auto shrink-0">น้ำหนัก {kpi.weight}</span>
      </div>
    </div>
  )
}
