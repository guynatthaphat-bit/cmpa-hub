import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LeaveForm } from '@/components/modules/leave/leave-form'

export const metadata = { title: 'ยื่นลา' }

export default function NewLeavePage() {
  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-3 animate-fade-in">
      {/* Header */}
      <section className="flex items-center gap-3">
        <Link
          href="/leave"
          className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-muted-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold">ยื่นลา</h1>
          <p className="text-xs text-muted-foreground">กรอกรายละเอียดการลา</p>
        </div>
      </section>

      <LeaveForm />
    </div>
  )
}
