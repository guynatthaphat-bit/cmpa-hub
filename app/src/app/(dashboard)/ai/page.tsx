import { getTranslations } from 'next-intl/server'
import { Sparkles } from 'lucide-react'
import { ComingSoon } from '@/components/shared/coming-soon'

export const metadata = { title: 'ผู้ช่วย AI' }

export default async function AiPage() {
  const t = await getTranslations('Ai')
  const features = t.raw('features') as string[]
  return (
    <ComingSoon
      icon={Sparkles}
      title={t('title')}
      description={t('description')}
      phase={2}
      features={features}
    />
  )
}
