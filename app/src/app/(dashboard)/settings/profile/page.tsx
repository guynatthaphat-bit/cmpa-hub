import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ProfileForm } from './profile-form'

export const metadata = { title: 'โปรไฟล์' }

export default async function ProfileSettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      nickname: true,
      phone: true,
      role: true,
    },
  })

  if (!user) redirect('/login')

  const t = await getTranslations('Settings')
  const tRoles = await getTranslations('Roles')

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
        <h1 className="font-display text-xl font-bold tracking-tight">{t('profile')}</h1>
      </header>

      <p className="text-sm text-muted-foreground">{t('profileDescription')}</p>

      <ProfileForm
        initial={{
          firstName: user.firstName,
          lastName: user.lastName,
          nickname: user.nickname,
          phone: user.phone,
        }}
        readonly={{
          email: user.email,
          employeeCode: user.employeeCode,
          role: tRoles(user.role as 'ADMIN' | 'MANAGER' | 'STAFF' | 'VOLUNTEER'),
        }}
      />
    </div>
  )
}
