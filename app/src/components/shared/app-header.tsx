'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

interface HeaderProps {
  firstName: string
  lastName: string
  avatarUrl: string | null
  unreadNotifications?: number
}

export function AppHeader({
  firstName,
  lastName,
  avatarUrl,
  unreadNotifications = 0,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md pt-safe">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 focus-ring rounded-lg" aria-label="CMPA Hub">
          <CmpaMark />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">CMPA Hub</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              สอค.ภอ
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="relative inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-ring"
            aria-label="การแจ้งเตือน"
          >
            <Bell className="size-5" strokeWidth={1.8} />
            {unreadNotifications > 0 ? (
              <span className="absolute right-1.5 top-1.5 flex size-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            ) : null}
          </Link>

          <Link
            href="/settings/profile"
            className="rounded-full focus-ring"
            aria-label="โปรไฟล์"
          >
            <Avatar className="size-10 ring-2 ring-border">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={`${firstName} ${lastName}`} /> : null}
              <AvatarFallback>{getInitials(firstName, lastName)}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  )
}

function CmpaMark() {
  return (
    <svg viewBox="0 0 40 40" className="size-9" aria-hidden="true">
      <defs>
        <linearGradient id="cmpa-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(168 52% 30%)" />
          <stop offset="100%" stopColor="hsl(168 60% 42%)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#cmpa-mark)" />
      <path
        d="M12 24c0-4 3-7 7-7s7 3 7 7"
        stroke="hsl(38 88% 60%)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="20" cy="14" r="3.2" fill="hsl(36 30% 98%)" />
    </svg>
  )
}
