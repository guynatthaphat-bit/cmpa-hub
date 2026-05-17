import Link from 'next/link'
import { Receipt, Plus } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getMyClaims, getPendingClaims, getExpenseSummary } from '@/server/actions/expenses'
import { ExpenseCard } from '@/components/modules/expenses/expense-card'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'ค่าใช้จ่าย' }
export const dynamic = 'force-dynamic'

export default async function ExpensesPage() {
  const session = await auth()
  const isManager = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER'

  const [myClaims, pendingClaims, summary] = await Promise.all([
    getMyClaims(),
    isManager ? getPendingClaims() : Promise.resolve([]),
    getExpenseSummary(),
  ])

  const approvedTotal = summary.total
  const submittedCount = summary.byStatus['SUBMITTED'] ?? 0

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-3 animate-fade-in">
      {/* Header */}
      <section className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Receipt className="size-5" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">ค่าใช้จ่าย</h1>
            <p className="text-xs text-muted-foreground">เบิกค่าใช้จ่าย</p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link href="/expenses/new">
            <Plus className="mr-1.5 size-4" />
            ยื่นเบิก
          </Link>
        </Button>
      </section>

      {/* Summary widget */}
      <div className="surface-card grid grid-cols-2 gap-4 p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">อนุมัติแล้ว / จ่ายแล้ว</span>
          <span className="text-lg font-bold tabular-nums text-success">
            {approvedTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">รออนุมัติ</span>
          <span className="text-lg font-bold tabular-nums text-warning">
            {submittedCount} รายการ
          </span>
        </div>
      </div>

      {/* Pending approval section (ADMIN/MANAGER only) */}
      {isManager && pendingClaims.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            รออนุมัติ ({pendingClaims.length})
          </h2>
          <div className="flex flex-col gap-2">
            {pendingClaims.map((claim) => (
              <ExpenseCard
                key={claim.id}
                claim={claim}
                showUser
                userName={`${claim.user.firstName ?? ''} ${claim.user.lastName ?? ''}`.trim()}
              />
            ))}
          </div>
        </section>
      )}

      {/* My claims */}
      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          รายการของฉัน
        </h2>
        {myClaims.length === 0 ? (
          <div className="surface-card flex flex-col items-center gap-2 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
              <Receipt className="size-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium">ยังไม่มีรายการ</p>
            <p className="text-xs text-muted-foreground">กด &quot;+ ยื่นเบิก&quot; เพื่อยื่นเบิกค่าใช้จ่าย</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {myClaims.map((claim) => (
              <ExpenseCard key={claim.id} claim={claim} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
