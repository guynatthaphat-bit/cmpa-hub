import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { ChangePasswordForm } from './change-password-form'

export const metadata = { title: 'ความปลอดภัย' }

interface PageProps {
  searchParams: { force?: string }
}

export default async function SecurityPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const force = searchParams.force === '1' || session.user.mustChangePassword

  const t = await getTranslations('Settings')
  const tAuth = await getTranslations('Auth')

  return (
    <div className="flex flex-col gap-4 px-4 py-3 animate-fade-in">
      <header className="flex items-center gap-2">
        {!force && (
          <Link
            href="/settings"
            className="-ml-2 flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary focus-ring"
            aria-label="กลับ"
          >
            <ArrowLeft className="size-5" />
          </Link>
        )}
        <h1 className="font-display text-xl font-bold tracking-tight">{t('security')}</h1>
      </header>

      {force && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold">{tAuth('mustChangePasswordTitle')}</p>
            <p className="text-muted-foreground">{tAuth('mustChangePasswordBody')}</p>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground">{t('securityDescription')}</p>

      <ChangePasswordForm forceMode={force} />
    </div>
  )
}
