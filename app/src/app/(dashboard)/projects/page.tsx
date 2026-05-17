import Link from 'next/link'
import { KanbanSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getProjects } from '@/server/actions/projects'
import { ProjectCard } from '@/components/modules/projects/project-card'

export const metadata = { title: 'โครงการ' }
export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-3 animate-fade-in">
      {/* Header */}
      <section className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KanbanSquare className="size-5" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">โครงการ</h1>
            <p className="text-xs text-muted-foreground">{projects.length} โครงการ</p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link href="/projects/new">
            <Plus className="mr-1.5 size-4" />
            สร้างโครงการ
          </Link>
        </Button>
      </section>

      {/* List */}
      {projects.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-2 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
            <KanbanSquare className="size-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium">ยังไม่มีโครงการ</p>
          <p className="text-xs text-muted-foreground">กด &quot;+ สร้างโครงการ&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  )
}
