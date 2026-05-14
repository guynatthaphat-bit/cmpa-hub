import { getTranslations } from 'next-intl/server'
import { Bell } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { EmptyState } from '@/components/shared/empty-state'
import { formatRelative } from '@/lib/date'

export const metadata = { title: 'การแจ้งเตือน' }

export default async function NotificationsPage() {
  const session = await auth()
  const t = await getTranslations('Notifications')

  const notifications = session?.user?.id
    ? await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    : []

  // Mark unread as read on view
  if (session?.user?.id && notifications.some((n) => !n.readAt)) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    })
  }

  return (
    <div className="px-4 py-3 animate-fade-in">
      <h1 className="mb-4 font-display text-xl font-bold tracking-tight">{t('title')}</h1>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title={t('emptyTitle')} description={t('emptyBody')} />
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li key={n.id} className="surface-card p-4">
              <p className="text-sm font-medium">{n.title}</p>
              {n.body ? (
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {formatRelative(n.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
