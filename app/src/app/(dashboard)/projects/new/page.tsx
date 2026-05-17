import Link from 'next/link'
import { ArrowLeft, KanbanSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProjectForm } from '@/components/modules/projects/project-form'

export const metadata = { title: 'สร้างโครงการใหม่' }

export default function NewProjectPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-3 animate-fade-in">
      {/* Header */}
      <section className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="-ml-1">
          <Link href="/projects">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KanbanSquare className="size-5" strokeWidth={1.8} />
          </div>
          <h1 className="font-display text-xl font-bold">สร้างโครงการใหม่</h1>
        </div>
      </section>

      {/* Form */}
      <div className="surface-card p-4">
        <ProjectForm />
      </div>
    </div>
  )
}
