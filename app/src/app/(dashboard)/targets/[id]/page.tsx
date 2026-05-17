import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Phone, Mail, Globe, MapPin, Star, Trash2 } from 'lucide-react'
import { getTarget, getCategories, deleteTarget } from '@/server/actions/targets'
import { OutreachTimeline } from '@/components/modules/targets/outreach-timeline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DeleteTargetButton } from './delete-button'
import type { TargetStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const target = await getTarget(params.id)
  return { title: target?.name ?? 'เป้าหมาย' }
}

const STATUS_LABEL: Record<TargetStatus, string> = {
  NEW: 'ยังไม่ติดต่อ',
  CONTACTED: 'ส่งจดหมายแล้ว',
  PENDING: 'รอตอบรับ',
  DONE: 'ได้รับการตอบรับ',
  REJECTED: 'ปฏิเสธ',
}
const STATUS_VARIANT: Record<TargetStatus, string> = {
  NEW: 'secondary',
  CONTACTED: 'default',
  PENDING: 'warning',
  DONE: 'success',
  REJECTED: 'destructive',
}
const PRIORITY_LABEL = ['', '⭐ สูง', '— ปกติ', '↓ ต่ำ']

export default async function TargetDetailPage({ params }: { params: { id: string } }) {
  const target = await getTarget(params.id)
  if (!target) notFound()

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-3 animate-fade-in">
      {/* Header */}
      <section className="flex items-start gap-3">
        <Link href="/targets" className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mt-0.5">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-bold leading-tight">{target.name}</h1>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <Badge
              variant={STATUS_VARIANT[target.status] as Parameters<typeof Badge>[0]['variant']}
              className="text-[10px]"
            >
              {STATUS_LABEL[target.status]}
            </Badge>
            {target.category && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  background: (target.category.color ?? '#6b7280') + '22',
                  color: target.category.color ?? '#6b7280',
                }}
              >
                {target.category.icon} {target.category.nameTh}
              </span>
            )}
            <span className="text-xs text-muted-foreground">{PRIORITY_LABEL[target.priority]}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="icon" variant="outline" asChild className="size-9">
            <Link href={`/targets/${target.id}/edit`}>
              <Pencil className="size-4" />
            </Link>
          </Button>
          <DeleteTargetButton id={target.id} />
        </div>
      </section>

      {/* Info card */}
      <div className="surface-card flex flex-col gap-3 p-4">
        {(target.province || target.district) && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
            <span>{[target.district, target.province].filter(Boolean).join(' ')}</span>
          </div>
        )}
        {target.address && (
          <p className="text-sm text-muted-foreground pl-6">{target.address}</p>
        )}

        {(target.phone || target.email || target.website) && <Separator />}

        {target.phone && (
          <a href={`tel:${target.phone}`} className="flex items-center gap-2 text-sm hover:text-primary">
            <Phone className="size-4 text-muted-foreground" />
            {target.phone}
          </a>
        )}
        {target.email && (
          <a href={`mailto:${target.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
            <Mail className="size-4 text-muted-foreground" />
            {target.email}
          </a>
        )}
        {target.website && (
          <a href={target.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary">
            <Globe className="size-4 text-muted-foreground" />
            <span className="truncate">{target.website}</span>
          </a>
        )}

        {(target.contactPerson || target.contactTitle) && (
          <>
            <Separator />
            <div className="text-sm">
              <p className="font-medium">{target.contactPerson}</p>
              {target.contactTitle && <p className="text-muted-foreground text-xs">{target.contactTitle}</p>}
            </div>
          </>
        )}

        {target.notes && (
          <>
            <Separator />
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{target.notes}</p>
          </>
        )}
      </div>

      {/* Outreach timeline */}
      <div className="surface-card p-4">
        <OutreachTimeline targetId={target.id} logs={target.outreachLogs} />
      </div>
    </div>
  )
}
