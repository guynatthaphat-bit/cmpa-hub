import { ArrowLeft, Target } from 'lucide-react'
import Link from 'next/link'
import { getCategories } from '@/server/actions/targets'
import { TargetForm } from '@/components/modules/targets/target-form'

export const metadata = { title: 'เพิ่มเป้าหมายใหม่' }

export default async function NewTargetPage() {
  const categories = await getCategories()

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-3 animate-fade-in">
      <section className="flex items-center gap-3">
        <Link href="/targets" className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold">เพิ่มเป้าหมายใหม่</h1>
          <p className="text-xs text-muted-foreground">กรอกข้อมูลองค์กรเป้าหมาย</p>
        </div>
      </section>

      <TargetForm categories={categories} />
    </div>
  )
}
