import { getTranslations } from 'next-intl/server'
import { Receipt } from 'lucide-react'
import { ComingSoon } from '@/components/shared/coming-soon'

export const metadata = { title: 'เบิกค่าใช้จ่าย' }

export default async function ExpensesPage() {
  const t = await getTranslations('Expenses')
  const features = t.raw('features') as string[]
  return (
    <ComingSoon
      icon={Receipt}
      title={t('title')}
      description={t('description')}
      phase={5}
      features={features}
    />
  )
}
