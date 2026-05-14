'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Languages, Calendar, Palette, Check } from 'lucide-react'
import { updatePreferencesAction } from '@/server/actions/preferences'

interface PreferencesFormProps {
  initial: {
    locale: 'th-TH' | 'en-US'
    dateSystem: 'BE' | 'CE'
    theme: 'light' | 'dark' | 'system'
  }
}

export function PreferencesForm({ initial }: PreferencesFormProps) {
  const t = useTranslations('Settings')
  const router = useRouter()
  const { setTheme } = useTheme()
  const [pending, start] = useTransition()

  function update(field: 'locale' | 'dateSystem' | 'theme', value: string) {
    start(async () => {
      const fd = new FormData()
      fd.set(field, value)
      const res = await updatePreferencesAction({ ok: false }, fd)
      if (res.ok) {
        toast.success(t('preferencesSaved'))
        if (field === 'theme') setTheme(value)
        router.refresh()
      } else {
        toast.error('ไม่สามารถบันทึกได้')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Language */}
      <section className="surface-card flex flex-col gap-3 p-5">
        <SectionHeader icon={Languages} label={t('preferencesLanguage')} />
        <Segmented
          value={initial.locale}
          disabled={pending}
          options={[
            { value: 'th-TH', label: 'ภาษาไทย' },
            { value: 'en-US', label: 'English' },
          ]}
          onChange={(v) => update('locale', v)}
        />
      </section>

      {/* Date system */}
      <section className="surface-card flex flex-col gap-3 p-5">
        <SectionHeader icon={Calendar} label={t('preferencesDateSystem')} />
        <Segmented
          value={initial.dateSystem}
          disabled={pending}
          options={[
            { value: 'BE', label: t('preferencesDateSystemBE') },
            { value: 'CE', label: t('preferencesDateSystemCE') },
          ]}
          onChange={(v) => update('dateSystem', v)}
        />
      </section>

      {/* Theme */}
      <section className="surface-card flex flex-col gap-3 p-5">
        <SectionHeader icon={Palette} label={t('preferencesTheme')} />
        <Segmented
          value={initial.theme}
          disabled={pending}
          options={[
            { value: 'light', label: t('preferencesThemeLight') },
            { value: 'dark', label: t('preferencesThemeDark') },
            { value: 'system', label: t('preferencesThemeSystem') },
          ]}
          onChange={(v) => update('theme', v)}
        />
      </section>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: typeof Languages
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div
      role="radiogroup"
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-muted p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-all ${
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            } disabled:opacity-50`}
          >
            {active && <Check className="size-3.5 text-primary" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
