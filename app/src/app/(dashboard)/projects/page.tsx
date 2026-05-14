import { getTranslations } from 'next-intl/server'
import { KanbanSquare } from 'lucide-react'
import { ComingSoon } from '@/components/shared/coming-soon'

export const metadata = { title: 'โครงการ' }

export default async function ProjectsPage() {
  const t = await getTranslations('Projects')
  const features = t.raw('features') as string[]
  return (
    <ComingSoon
      icon={KanbanSquare}
      title={t('title')}
      description={t('description')}
      phase={4}
      features={features}
    />
  )
}
