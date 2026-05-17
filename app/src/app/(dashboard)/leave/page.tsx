import Link from 'next/link'
import { CalendarDays, Plus } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getMyLeaves, getLeaveBalance, getPendingLeaves } from '@/server/actions/leave'
import { BalanceWidget } from '@/components/modules/leave/balance-widget'
import { LeaveCard } from '@/components/modules/leave/leave-card'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'ลางาน' }
export const dynamic = 'force-dynamic'

export default async function LeavePage() {
  const session = await auth()
  const isManager = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER'

  const currentYear = new Date().getFullYear()

  const [{ items: myLeaves }, balance, pendingLeaves] = await Promise.all([
    getMyLeaves(),
    getLeaveBalance(currentYear),
    isManager ? getPendingLeaves() : Promise.resolve([]),
  ])

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-3 animate-fade-in">
      {/* Header */}
      <section className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarDays className="size-5" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">ลางาน</h1>
            <p className="text-xs text-muted-foreground">จัดการคำขอลางาน</p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link href="/leave/new">
            <Plus className="mr-1.5 size-4" />
            ยื่นลา
          </Link>
        </Button>
      </section>

      {/* Balance widget */}
      <BalanceWidget balance={balance} year={currentYear} />

      {/* Pending approval section (ADMIN/MANAGER only) */}
      {isManager && pendingLeaves.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            รออนุมัติ ({pendingLeaves.length})
          </h2>
          <div className="flex flex-col gap-2">
            {pendingLeaves.map((leave) => (
              <LeaveCard
                key={leave.id}
                leave={leave}
                showUser
                userName={`${leave.user.firstName} ${leave.user.lastName}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* My leave history */}
      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ประวัติการลา
        </h2>
        {myLeaves.length === 0 ? (
          <div className="surface-card flex flex-col items-center gap-2 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
              <CalendarDays className="size-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium">ยังไม่มีประวัติการลา</p>
            <p className="text-xs text-muted-foreground">กด "+ ยื่นลา" เพื่อยื่นคำขอลางาน</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {myLeaves.map((leave) => (
              <LeaveCard key={leave.id} leave={leave} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
