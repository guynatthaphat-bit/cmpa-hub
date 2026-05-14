'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePasswordAction } from '@/server/actions/auth'
import type { ActionState } from '@/server/actions/auth'

const initial: ActionState = { ok: false }

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations('Auth')
  return (
    <Button type="submit" size="block" loading={pending} disabled={pending}>
      <KeyRound className="size-4" />
      {t('changePasswordSubmit')}
    </Button>
  )
}

export function ChangePasswordForm({ forceMode }: { forceMode: boolean }) {
  const t = useTranslations('Auth')
  const router = useRouter()
  const [state, action] = useFormState(changePasswordAction, initial)

  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newPwd, setNewPwd] = useState('')

  useEffect(() => {
    if (state.ok) {
      toast.success(t('passwordChangedSuccess'))
      if (forceMode) {
        router.replace('/')
      }
      router.refresh()
    } else if (state.error) {
      const map: Record<string, string> = {
        invalidCurrentPassword: 'รหัสผ่านปัจจุบันไม่ถูกต้อง',
        sameAsOld: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม',
        tooShort: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
        mustHaveLetter: 'รหัสผ่านต้องมีตัวอักษร',
        mustHaveNumber: 'รหัสผ่านต้องมีตัวเลข',
        mismatch: 'รหัสผ่านยืนยันไม่ตรงกัน',
        validation: t('passwordRequirements'),
        unauthorized: 'เซสชันหมดอายุ',
      }
      toast.error(map[state.error] ?? t('errorGeneric'))
    }
  }, [state, t, forceMode, router])

  // Live password strength rules
  const hasLen = newPwd.length >= 8
  const hasLetter = /[A-Za-z]/.test(newPwd)
  const hasNumber = /\d/.test(newPwd)

  return (
    <form action={action} className="surface-card flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            name="currentPassword"
            type={showCur ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="pr-12"
          />
          <ToggleBtn show={showCur} onToggle={() => setShowCur((v) => !v)} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">{t('newPassword')}</Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            className="pr-12"
          />
          <ToggleBtn show={showNew} onToggle={() => setShowNew((v) => !v)} />
        </div>

        <ul className="mt-1 flex flex-col gap-1 text-xs">
          <Rule ok={hasLen}>อย่างน้อย 8 ตัวอักษร</Rule>
          <Rule ok={hasLetter}>มีตัวอักษร (a-z, A-Z)</Rule>
          <Rule ok={hasNumber}>มีตัวเลข (0-9)</Rule>
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showNew ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>

      <SubmitButton />
    </form>
  )
}

function ToggleBtn({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-2 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      tabIndex={-1}
      aria-label={show ? 'Hide' : 'Show'}
    >
      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  )
}

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li
      className={`flex items-center gap-1.5 transition-colors ${
        ok ? 'text-success' : 'text-muted-foreground'
      }`}
    >
      <CheckCircle2
        className={`size-3.5 transition-opacity ${ok ? 'opacity-100' : 'opacity-30'}`}
      />
      <span>{children}</span>
    </li>
  )
}
