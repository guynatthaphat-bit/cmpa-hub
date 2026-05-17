import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTarget, getCategories } from '@/server/actions/targets'
import { TargetForm } from '@/components/modules/targets/target-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'แก้ไขเป้าหมาย' }

export default async function EditTargetPage({ params }: { params: { id: string } }) {
  const [target, categories] = await Promise.all([
    getTarget(params.id),
    getCategories(),
  ])
  if (!target) notFound()

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-3 animate-fade-in">
      <section className="flex items-center gap-3">
        <Link href={`/targets/${params.id}`} className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold">แก้ไขเป้าหมาย</h1>
          <p className="text-xs text-muted-foreground truncate max-w-48">{target.name}</p>
        </div>
      </section>

      <TargetForm
        categories={categories}
        initialData={{
          id: target.id,
          name: target.name,
          categoryId: target.categoryId,
          province: target.province,
          district: target.district,
          address: target.address,
          phone: target.phone,
          email: target.email,
          website: target.website,
          contactPerson: target.contactPerson,
          contactTitle: target.contactTitle,
          priority: target.priority,
          status: target.status,
          notes: target.notes,
        }}
      />
    </div>
  )
}
