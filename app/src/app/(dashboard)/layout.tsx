import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AppHeader } from '@/components/shared/app-header'
import { BottomNav } from '@/components/shared/bottom-nav'
import { prisma } from '@/lib/db'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Unread notification count (lightweight — server-rendered into header)
  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  })

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader
        firstName={session.user.firstName}
        lastName={session.user.lastName}
        avatarUrl={session.user.avatarUrl}
        unreadNotifications={unreadCount}
      />

      <div className="mx-auto w-full max-w-md pb-24 pt-2">{children}</div>

      <BottomNav />
    </div>
  )
}
