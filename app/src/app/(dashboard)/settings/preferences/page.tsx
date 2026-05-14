import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PreferencesForm } from './preferences-form'

export const metadata = { title: 'ตั้งค่าทั่วไป' }

export default async function PreferencesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { locale: true, dateSystem: true, theme: true },
  })

  const t = await getTranslations('Settings')

  return (
    <div className="flex flex-col gap-4 px-4 py-3 animate-fade-in">
      <header className="flex items-center gap-2">
        <Link
          href="/settings"
          className="-ml-2 flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary focus-ring"
          aria-label="กลับ"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-display text-xl font-bold tracking-tight">{t('preferences')}</h1>
      </header>

      <p className="text-sm text-muted-foreground">{t('preferencesDescription')}</p>

      <PreferencesForm
        initial={{
          locale: (user?.locale as 'th-TH' | 'en-US') ?? 'th-TH',
          dateSystem: (user?.dateSystem as 'BE' | 'CE') ?? 'BE',
          theme: (user?.theme as 'light' | 'dark' | 'system') ?? 'system',
        }}
      />
    </div>
  )
}
