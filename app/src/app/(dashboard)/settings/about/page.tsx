import Link from 'next/link'
import { ArrowLeft, Info, ExternalLink } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const metadata = { title: 'เกี่ยวกับ' }

export default async function AboutPage() {
  const t = await getTranslations('Settings')
  const tApp = await getTranslations('App')

  const rows: { label: string; value: string }[] = [
    { label: t('aboutAppName'), value: tApp('name') },
    { label: t('aboutVersion'), value: '0.1.0 — Phase 1' },
    { label: t('aboutOrg'), value: tApp('orgFull') },
    { label: t('aboutRegNumber'), value: tApp('regNumber') },
  ]

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
        <h1 className="font-display text-xl font-bold tracking-tight">{t('about')}</h1>
      </header>

      {/* Brand */}
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-2xl bg-primary/15 blur-xl" />
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
            <Info className="size-8 text-primary-foreground" strokeWidth={1.5} />
          </div>
        </div>
        <div className="text-center">
          <h2 className="font-display text-xl font-bold tracking-tight">{tApp('name')}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{tApp('orgFull')}</p>
        </div>
      </div>

      {/* Info rows */}
      <section className="surface-card divide-y divide-border overflow-hidden p-0">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4 p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {row.label}
            </span>
            <span className="text-right text-sm">{row.value}</span>
          </div>
        ))}
      </section>

      {/* Policies */}
      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('aboutPolicies')}
        </h2>
        <nav className="surface-card divide-y divide-border overflow-hidden p-0">
          <PolicyRow href="/policies/privacy" label={t('aboutPrivacyPolicy')} />
          <PolicyRow href="/policies/terms" label={t('aboutTerms')} />
        </nav>
      </section>

      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        {t('aboutCopyright')}
      </p>
    </div>
  )
}

function PolicyRow({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-secondary/40 focus-ring"
    >
      <span className="text-sm font-medium">{label}</span>
      <ExternalLink className="size-4 text-muted-foreground" />
    </Link>
  )
}
