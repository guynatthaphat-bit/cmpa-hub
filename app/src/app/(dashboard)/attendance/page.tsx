import { getTranslations } from 'next-intl/server'
import { Clock } from 'lucide-react'
import { ComingSoon } from '@/components/shared/coming-soon'

export const metadata = { title: 'ลงเวลา' }

export default async function AttendancePage() {
  const t = await getTranslations('Attendance')
  const features = t.raw('features') as string[]

  return (
    <ComingSoon
      icon={Clock}
      title={t('title')}
      description={t('description')}
      phase={2}
      features={features}
    />
  )
}
