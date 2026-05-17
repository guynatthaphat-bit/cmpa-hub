import { Suspense } from 'react'
import { Target } from 'lucide-react'
import { getTargets, getCategories } from '@/server/actions/targets'
import { TargetsClient } from './targets-client'

export const metadata = { title: 'ฐานข้อมูลเป้าหมาย' }
export const dynamic = 'force-dynamic'

export default async function TargetsPage() {
  const [{ items, total }, categories] = await Promise.all([
    getTargets(),
    getCategories(),
  ])

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-3 animate-fade-in">
      <section className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Target className="size-5" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold">ฐานข้อมูลเป้าหมาย</h1>
          <p className="text-xs text-muted-foreground">{total} รายการ</p>
        </div>
      </section>

      <TargetsClient initialItems={items} initialTotal={total} categories={categories} />
    </div>
  )
}
