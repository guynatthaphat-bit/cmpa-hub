import { getTranslations } from 'next-intl/server'
import { LineChart } from 'lucide-react'
import { ComingSoon } from '@/components/shared/coming-soon'

export const metadata = { title: 'KPI' }

export default async function KpiPage() {
  const t = await getTranslations('Kpi')
  const features = t.raw('features') as string[]
  return (
    <ComingSoon
      icon={LineChart}
      title={t('title')}
      description={t('description')}
      phase={4}
      features={features}
    />
  )
}
