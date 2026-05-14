import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock, Download, Trash2, FileText, ShieldCheck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/date'
import { Badge } from '@/components/ui/badge'
import { PrivacyActions } from './privacy-actions'

export const metadata = { title: 'ความเป็นส่วนตัว' }

export default async function PrivacyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      consentedAt: true,
      deletionRequestedAt: true,
      deletionScheduledAt: true,
      locale: true,
      dateSystem: true,
    },
  })
  if (!user) redirect('/login')

  const t = await getTranslations('Settings')
  const locale = (user.locale as 'th-TH' | 'en-US') ?? 'th-TH'
  const system = (user.dateSystem as 'BE' | 'CE') ?? 'BE'

  const deletionScheduled = user.deletionScheduledAt
    ? formatDate(user.deletionScheduledAt, { locale, system, format: 'long' })
    : null

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
        <h1 className="font-display text-xl font-bold tracking-tight">{t('privacy')}</h1>
      </header>

      <p className="text-sm text-muted-foreground">{t('privacyDescription')}</p>

      {/* Pending deletion banner */}
      {user.deletionRequestedAt && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <Trash2 className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="font-semibold text-destructive">{t('privacyDeletionPending')}</p>
            {deletionScheduled && (
              <p className="text-muted-foreground">
                {t('privacyDeletionScheduled')}: <span className="font-medium">{deletionScheduled}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Consent status */}
      <section className="surface-card flex items-center gap-3 p-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
          <ShieldCheck className="size-5" />
        </div>
        <div className="flex flex-1 flex-col">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('privacyConsentStatus')}
          </span>
          <span className="text-sm">
            {user.consentedAt ? (
              <Badge variant="success">{t('privacyConsented')}</Badge>
            ) : (
              <Badge variant="warning">{t('privacyNotConsented')}</Badge>
            )}
          </span>
        </div>
      </section>

      {/* Audit trail notice */}
      <section className="surface-card flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileText className="size-5" />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium">{t('privacyAuditTrail')}</span>
          <p className="text-xs text-muted-foreground">{t('privacyAuditTrailBody')}</p>
        </div>
      </section>

      {/* Data export */}
      <section className="surface-card flex flex-col gap-3 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Download className="size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm font-medium">{t('privacyDataExport')}</span>
            <p className="text-xs text-muted-foreground">{t('privacyDataExportBody')}</p>
          </div>
        </div>
      </section>

      {/* Deletion request */}
      <section className="surface-card flex flex-col gap-3 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <Lock className="size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm font-medium">{t('privacyDeleteAccount')}</span>
            <p className="text-xs text-muted-foreground">{t('privacyDeleteAccountBody')}</p>
          </div>
        </div>
      </section>

      <PrivacyActions deletionRequested={!!user.deletionRequestedAt} />
    </div>
  )
}
