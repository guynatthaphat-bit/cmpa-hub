import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import {
  Clock,
  CalendarDays,
  Receipt,
  Sparkles,
  ArrowRight,
  Calendar,
} from 'lucide-react'
import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/date'

function greetingKey(): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' | 'greetingNight' {
  // Bangkok local hour
  const now = new Date()
  const bkk = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const h = bkk.getHours()
  if (h >= 5 && h < 12) return 'greetingMorning'
  if (h >= 12 && h < 17) return 'greetingAfternoon'
  if (h >= 17 && h < 21) return 'greetingEvening'
  return 'greetingNight'
}

export default async function HomePage() {
  const session = await auth()
  const t = await getTranslations('Home')
  const tNav = await getTranslations('Nav')

  const displayName = session?.user?.nickname || session?.user?.firstName || ''
  const today = formatDate(new Date(), {
    locale: (session?.user?.locale as 'th-TH' | 'en-US') ?? 'th-TH',
    system: (session?.user?.dateSystem as 'BE' | 'CE') ?? 'BE',
    format: 'long',
  })

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-3 animate-fade-in">
      {/* Greeting */}
      <section className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{t(greetingKey())}</p>
        <h1 className="font-display text-2xl font-bold tracking-tight">{displayName}</h1>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3.5" />
          <span>
            {t('todayLabel')} · {today}
          </span>
        </p>
      </section>

      {/* Phase 1 notice */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="success" className="gap-1">
              <Sparkles className="size-3" /> Phase 1
            </Badge>
          </div>
          <CardTitle className="mt-2 text-base leading-snug">{t('phase1Notice')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">{t('phase1NoticeBody')}</p>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('quickActionsTitle')}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickActionCard
            href="/attendance"
            icon={Clock}
            label={tNav('attendance')}
            phase={2}
          />
          <QuickActionCard
            href="/leave"
            icon={CalendarDays}
            label={tNav('leave')}
            phase={3}
            disabled
          />
          <QuickActionCard
            href="/expenses"
            icon={Receipt}
            label={tNav('expenses')}
            phase={5}
            disabled
          />
          <QuickActionCard
            href="/ai"
            icon={Sparkles}
            label={tNav('ai')}
            phase={2}
          />
        </div>
      </section>

      {/* Recent activity (empty in Phase 1) */}
      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('recentActivityTitle')}
        </h2>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
              <Clock className="size-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium">{t('noActivity')}</p>
            <p className="text-xs text-muted-foreground">{t('noActivityHint')}</p>
          </CardContent>
        </Card>
      </section>

      {/* Settings shortcut */}
      <Link
        href="/settings"
        className="surface-card group flex items-center justify-between p-4 transition-colors hover:bg-secondary/40 focus-ring"
      >
        <div className="flex flex-col">
          <span className="text-sm font-medium">{tNav('settings')}</span>
          <span className="text-xs text-muted-foreground">โปรไฟล์ · ความปลอดภัย · ภาษา · ธีม</span>
        </div>
        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  )
}

interface QuickActionProps {
  href: string
  icon: typeof Clock
  label: string
  phase: number
  disabled?: boolean
}

function QuickActionCard({ href, icon: Icon, label, phase, disabled }: QuickActionProps) {
  const Content = (
    <div
      className={`surface-card relative flex flex-col gap-2.5 p-4 transition-all ${
        disabled ? 'opacity-60' : 'hover:border-primary/40 hover:shadow-md'
      }`}
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" strokeWidth={1.8} />
      </div>
      <span className="text-sm font-medium leading-tight">{label}</span>
      <span className="absolute right-2.5 top-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Phase {phase}
      </span>
    </div>
  )

  if (disabled) {
    return (
      <div role="button" aria-disabled className="cursor-not-allowed">
        {Content}
      </div>
    )
  }

  return (
    <Link href={href} className="focus-ring rounded-2xl">
      {Content}
    </Link>
  )
}
