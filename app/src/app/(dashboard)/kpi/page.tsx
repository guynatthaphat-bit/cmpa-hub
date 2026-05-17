import { LineChart } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getMyKPIs, getAllKPIs } from '@/server/actions/kpi'
import { KpiClient } from './kpi-client'

export const metadata = { title: 'KPI' }
export const dynamic = 'force-dynamic'

export default async function KpiPage() {
  const session = await auth()
  const isPrivileged =
    session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER'

  const [myKPIs, teamKPIs] = await Promise.all([
    getMyKPIs(),
    isPrivileged ? getAllKPIs() : Promise.resolve([]),
  ])

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-3 animate-fade-in">
      {/* Header */}
      <section className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LineChart className="size-5" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold">KPI</h1>
          <p className="text-xs text-muted-foreground">ตัวชี้วัดผลการปฏิบัติงาน</p>
        </div>
      </section>

      <KpiClient myKPIs={myKPIs} teamKPIs={teamKPIs} isPrivileged={isPrivileged} />
    </div>
  )
}
