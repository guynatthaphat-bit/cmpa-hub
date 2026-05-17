import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getProject } from '@/server/actions/projects'
import { ProjectForm } from '@/components/modules/projects/project-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'แก้ไขโครงการ' }

interface Props {
  params: { id: string }
}

export default async function EditProjectPage({ params }: Props) {
  const project = await getProject(params.id)
  if (!project) notFound()

  const initialData = {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate,
    budget: project.budget,
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-3 animate-fade-in">
      {/* Header */}
      <section className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="-ml-1">
          <Link href={`/projects/${project.id}`}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="font-display text-xl font-bold">แก้ไขโครงการ</h1>
      </section>

      {/* Form */}
      <div className="surface-card p-4">
        <ProjectForm initialData={initialData} />
      </div>
    </div>
  )
}
