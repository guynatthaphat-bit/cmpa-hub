'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfileAction } from '@/server/actions/profile'
import type { ActionState } from '@/server/actions/auth'

const initial: ActionState = { ok: false }

interface ProfileFormProps {
  initial: {
    firstName: string
    lastName: string
    nickname: string | null
    phone: string | null
  }
  readonly: {
    email: string
    employeeCode: string | null
    role: string
  }
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="block" loading={pending} disabled={pending}>
      <Save className="size-4" />
      บันทึก
    </Button>
  )
}

export function ProfileForm({ initial: data, readonly }: ProfileFormProps) {
  const t = useTranslations('Settings')
  const tErr = useTranslations('Errors')
  const [state, action] = useFormState(updateProfileAction, initial)

  useEffect(() => {
    if (state.ok) {
      toast.success(t('profileSaved'))
    } else if (state.error) {
      const msg =
        state.error === 'validation' || state.error === 'required'
          ? tErr('validation')
          : state.error === 'invalidPhone'
            ? 'รูปแบบเบอร์โทรไม่ถูกต้อง (เช่น 0812345678)'
            : tErr('generic')
      toast.error(msg)
    }
  }, [state, t, tErr])

  return (
    <form action={action} className="surface-card flex flex-col gap-4 p-5">
      <Field label={t('profileFirstName')} required>
        <Input name="firstName" defaultValue={data.firstName} required maxLength={100} />
      </Field>

      <Field label={t('profileLastName')} required>
        <Input name="lastName" defaultValue={data.lastName} required maxLength={100} />
      </Field>

      <Field label={t('profileNickname')}>
        <Input name="nickname" defaultValue={data.nickname ?? ''} maxLength={50} />
      </Field>

      <Field label={t('profilePhone')}>
        <Input
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={data.phone ?? ''}
          placeholder="0812345678"
          maxLength={10}
        />
      </Field>

      <div className="my-1 h-px bg-border" aria-hidden />

      {/* Read-only fields */}
      <Field label={t('profileEmail')} hint="ติดต่อผู้ดูแลระบบเพื่อเปลี่ยน">
        <Input value={readonly.email} disabled readOnly />
      </Field>

      <Field label={t('profileEmployeeCode')}>
        <Input value={readonly.employeeCode ?? '—'} disabled readOnly />
      </Field>

      <Field label={t('profileRole')}>
        <Input value={readonly.role} disabled readOnly />
      </Field>

      <SaveButton />
    </form>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
