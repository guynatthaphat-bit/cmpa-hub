import { getTranslations } from 'next-intl/server'
import { FolderClosed } from 'lucide-react'
import { ComingSoon } from '@/components/shared/coming-soon'

export const metadata = { title: 'เอกสาร' }

export default async function DocumentsPage() {
  const t = await getTranslations('Documents')
  const features = t.raw('features') as string[]
  return (
    <ComingSoon
      icon={FolderClosed}
      title={t('title')}
      description={t('description')}
      phase={3}
      features={features}
    />
  )
}
