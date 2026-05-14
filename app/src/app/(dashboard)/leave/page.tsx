import { getTranslations } from 'next-intl/server'
import { CalendarDays } from 'lucide-react'
import { ComingSoon } from '@/components/shared/coming-soon'

export const metadata = { title: 'ลางาน' }

export default async function LeavePage() {
  const t = await getTranslations('Leave')
  const features = t.raw('features') as string[]
  return (
    <ComingSoon
      icon={CalendarDays}
      title={t('title')}
      description={t('description')}
      phase={3}
      features={features}
    />
  )
}
