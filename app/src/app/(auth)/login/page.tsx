import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ',
}

export default async function LoginPage() {
  const t = await getTranslations('Auth')
  const tApp = await getTranslations('App')

  return (
    <div className="flex flex-col gap-8">
      {/* Brand mark */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-2xl bg-primary/20 blur-xl" />
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
            <svg
              viewBox="0 0 32 32"
              className="size-9 text-primary-foreground"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" />
              <path
                d="M10 16.5l3.5 3.5L22 11"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight">{tApp('name')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('loginSubtitle')}</p>
        </div>
      </div>

      <LoginForm />

      <p className="text-center text-xs text-muted-foreground">
        {tApp('orgShort')} · {tApp('regNumber')}
      </p>
    </div>
  )
}
