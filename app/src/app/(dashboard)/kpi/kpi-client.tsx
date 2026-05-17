'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/modules/kpi/kpi-card'
import { KpiForm } from '@/components/modules/kpi/kpi-form'
import { KpiChart } from '@/components/modules/kpi/kpi-chart'
import { deleteKPI } from '@/server/actions/kpi'
import type { KPIData, KPIWithUser } from '@/server/actions/kpi'

interface KpiClientProps {
  myKPIs: KPIData[]
  teamKPIs: KPIWithUser[]
  isPrivileged: boolean
}

export function KpiClient({ myKPIs, teamKPIs, isPrivileged }: KpiClientProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [formOpen, setFormOpen] = useState(false)
  const [editingKPI, setEditingKPI] = useState<KPIData | undefined>(undefined)

  function openCreate() {
    setEditingKPI(undefined)
    setFormOpen(true)
  }

  function openEdit(kpi: KPIData) {
    setEditingKPI(kpi)
    setFormOpen(true)
  }

  function handleDelete(kpi: KPIData) {
    startTransition(async () => {
      const result = await deleteKPI(kpi.id)
      if (result.ok) {
        toast.success('ลบ KPI สำเร็จ')
        router.refresh()
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + result.error)
      }
    })
  }

  function handleFormSuccess() {
    router.refresh()
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          KPI ของฉัน
        </h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 size-4" />
          เพิ่ม KPI
        </Button>
      </div>

      {/* Chart */}
      {myKPIs.length > 0 && <KpiChart kpis={myKPIs} />}

      {/* My KPI cards */}
      {myKPIs.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-sm font-medium">ยังไม่มี KPI</p>
          <p className="text-xs text-muted-foreground">กด &quot;+ เพิ่ม KPI&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {myKPIs.map((kpi) => (
            <KpiCard
              key={kpi.id}
              kpi={kpi}
              onEdit={() => openEdit(kpi)}
              onDelete={() => handleDelete(kpi)}
            />
          ))}
        </div>
      )}

      {/* Team KPIs — ADMIN/MANAGER only */}
      {isPrivileged && teamKPIs.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            KPI ทีม ({teamKPIs.length})
          </h2>
          <div className="flex flex-col gap-2">
            {teamKPIs.map((kpi) => (
              <div key={kpi.id} className="surface-card p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {kpi.user.firstName} {kpi.user.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground">{kpi.periodLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{kpi.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {kpi.current.toLocaleString('th-TH')} / {kpi.target.toLocaleString('th-TH')} {kpi.unit}
                  </span>
                </div>
                {kpi.target > 0 && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        (kpi.current / kpi.target) * 100 >= 100
                          ? 'bg-green-500'
                          : (kpi.current / kpi.target) * 100 >= 60
                          ? 'bg-blue-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min((kpi.current / kpi.target) * 100, 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* KPI Form Dialog */}
      <KpiForm
        open={formOpen}
        onOpenChange={setFormOpen}
        kpi={editingKPI}
        onSuccess={handleFormSuccess}
      />
    </>
  )
}
