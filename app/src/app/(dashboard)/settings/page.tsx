import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import {
  User,
  Shield,
  Settings as SettingsIcon,
  Lock,
  Info,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { auth } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { logoutAction } from '@/server/actions/auth'
import { getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const metadata = { title: 'ตั้งค่า' }

export default async function SettingsPage() {
  const session = await auth()
  const t = await getTranslations('Settings')
  const tRoles = await getTranslations('Roles')

  if (!session?.user) return null
  const { user } = session
  const displayName =
    `${user.firstName} ${user.lastName}` + (user.nickname ? ` (${user.nickname})` : '')

  const items = [
    {
      href: '/settings/profile',
      icon: User,
      label: t('profile'),
      desc: t('profileDescription'),
    },
    {
      href: '/settings/security',
      icon: Shield,
      label: t('security'),
      desc: t('securityDescription'),
    },
    {
      href: '/settings/preferences',
      icon: SettingsIcon,
      label: t('preferences'),
      desc: t('preferencesDescription'),
    },
    {
      href: '/settings/privacy',
      icon: Lock,
      label: t('privacy'),
      desc: t('privacyDescription'),
    },
    {
      href: '/settings/about',
      icon: Info,
      label: t('about'),
      desc: t('aboutDescription'),
    },
  ]

  return (
    <div className="flex flex-col gap-5 px-4 py-3 animate-fade-in">
      <h1 className="font-display text-xl font-bold tracking-tight">{t('title')}</h1>

      {/* User card */}
      <div className="surface-card flex items-center gap-4 p-4">
        <Avatar className="size-14 ring-2 ring-border">
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={displayName} /> : null}
          <AvatarFallback className="text-base">
            {getInitials(user.firstName, user.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <div className="mt-1.5">
            <Badge variant="outline" className="text-[10px]">
              {tRoles(user.role as 'ADMIN' | 'MANAGER' | 'STAFF' | 'VOLUNTEER')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Settings rows */}
      <nav className="surface-card divide-y divide-border overflow-hidden p-0">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="flex items-center gap-3 p-4 transition-colors hover:bg-secondary/40 focus-ring focus:bg-secondary/40"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <it.icon className="size-5" strokeWidth={1.8} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{it.label}</span>
              <span className="truncate text-xs text-muted-foreground">{it.desc}</span>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <form action={logoutAction}>
        <button
          type="submit"
          className="surface-card flex w-full items-center justify-center gap-2 p-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 focus-ring"
        >
          <LogOut className="size-4" />
          {t('logout')}
        </button>
      </form>

      <p className="text-center text-[10px] text-muted-foreground">
        CMPA Hub · v0.1.0 · Phase 1
      </p>
    </div>
  )
}
