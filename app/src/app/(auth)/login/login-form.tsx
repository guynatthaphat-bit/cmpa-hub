'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginAction, type ActionState } from '@/server/actions/auth'

const initial: ActionState = { ok: false }

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations('Auth')
  return (
    <Button type="submit" size="block" loading={pending} disabled={pending}>
      {pending ? t('submitting') : t('submit')}
    </Button>
  )
}

export function LoginForm() {
  const t = useTranslations('Auth')
  const [state, action] = useFormState(loginAction, initial)
  const params = useSearchParams()
  const next = params.get('next')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (state.error) {
      const map: Record<string, string> = {
        invalidCredentials: t('errorInvalidCredentials'),
        rateLimit: t('errorRateLimit'),
        suspended: t('errorSuspended'),
        pendingDeletion: t('errorPendingDeletion'),
        validation: t('errorGeneric'),
      }
      toast.error(map[state.error] ?? t('errorGeneric'))
    }
  }, [state, t])

  return (
    <form action={action} className="surface-card flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold tracking-tight">{t('loginTitle')}</h2>
      </div>

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0 translate-y-0.5" aria-hidden />
          <span>
            {state.error === 'invalidCredentials' && t('errorInvalidCredentials')}
            {state.error === 'rateLimit' && t('errorRateLimit')}
            {state.error === 'suspended' && t('errorSuspended')}
            {state.error === 'pendingDeletion' && t('errorPendingDeletion')}
            {state.error === 'validation' && t('errorGeneric')}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          spellCheck={false}
          required
          placeholder={t('emailPlaceholder')}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t('passwordLabel')}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            placeholder={t('passwordPlaceholder')}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {next && <input type="hidden" name="next" value={next} />}

      <SubmitButton />

      <button
        type="button"
        className="self-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() =>
          toast.info('กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน', { duration: 5000 })
        }
      >
        {t('forgotPassword')}
      </button>
    </form>
  )
}
