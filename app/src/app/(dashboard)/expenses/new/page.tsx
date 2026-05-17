import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ExpenseForm } from '@/components/modules/expenses/expense-form'

export const metadata = { title: 'ยื่นเบิกค่าใช้จ่าย' }

export default function NewExpensePage() {
  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-3 animate-fade-in">
      {/* Header */}
      <section className="flex items-center gap-3">
        <Link
          href="/expenses"
          className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-muted-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold">ยื่นเบิกค่าใช้จ่าย</h1>
          <p className="text-xs text-muted-foreground">ถ่ายใบเสร็จเพื่อ OCR อัตโนมัติ</p>
        </div>
      </section>

      {/* Form */}
      <div className="surface-card p-5">
        <ExpenseForm />
      </div>
    </div>
  )
}
