'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Home,
  Clock,
  CalendarDays,
  KanbanSquare,
  MoreHorizontal,
  LineChart,
  FolderClosed,
  Receipt,
  Sparkles,
  Bell,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

type NavItem = {
  key: string
  href: string
  icon: typeof Home
  primary?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', href: '/', icon: Home, primary: true },
  { key: 'attendance', href: '/attendance', icon: Clock, primary: true },
  { key: 'leave', href: '/leave', icon: CalendarDays, primary: true },
  { key: 'projects', href: '/projects', icon: KanbanSquare, primary: true },
  // primary 5th slot is "More"
  { key: 'kpi', href: '/kpi', icon: LineChart },
  { key: 'documents', href: '/documents', icon: FolderClosed },
  { key: 'expenses', href: '/expenses', icon: Receipt },
  { key: 'ai', href: '/ai', icon: Sparkles },
  { key: 'notifications', href: '/notifications', icon: Bell },
  { key: 'settings', href: '/settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations('Nav')
  const [moreOpen, setMoreOpen] = useState(false)

  const primary = NAV_ITEMS.filter((i) => i.primary)
  const overflow = NAV_ITEMS.filter((i) => !i.primary)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Backdrop for "more" sheet */}
      {moreOpen ? (
        <button
          aria-label="ปิดเมนู"
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm animate-fade-in"
          onClick={() => setMoreOpen(false)}
        />
      ) : null}

      {/* More sheet */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out',
          moreOpen ? 'translate-y-0' : 'translate-y-full',
        )}
        aria-hidden={!moreOpen}
      >
        <div className="surface-card mx-3 mb-3 rounded-3xl border-border/60 bg-card pb-safe shadow-2xl">
          <div className="flex justify-center pt-3">
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="grid grid-cols-3 gap-1 p-4">
            {overflow.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex min-h-[80px] flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center text-xs transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary',
                  )}
                >
                  <Icon className="size-6" />
                  <span className="font-medium">{t(item.key)}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-md pb-safe"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5">
          {primary.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <li key={item.key} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    'flex min-h-tap flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon
                    className={cn('size-6 transition-transform', active && 'scale-110')}
                    strokeWidth={active ? 2.4 : 1.8}
                  />
                  <span className="leading-tight">{t(item.key)}</span>
                </Link>
              </li>
            )
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-expanded={moreOpen}
              aria-controls="more-menu"
              className={cn(
                'flex min-h-tap w-full flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors',
                overflow.some((i) => isActive(i.href))
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <MoreHorizontal className="size-6" strokeWidth={1.8} />
              <span className="leading-tight">{t('more')}</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  )
}
