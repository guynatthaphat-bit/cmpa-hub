'use client'

import Link from 'next/link'
import { Phone, Mail, Globe, MapPin, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TargetStatus } from '@prisma/client'

export interface TargetCardData {
  id: string
  name: string
  province: string | null
  phone: string | null
  email: string | null
  website: string | null
  contactPerson: string | null
  priority: number
  status: TargetStatus
  category: { id: string; nameTh: string; icon: string | null; color: string | null } | null
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

const PRIORITY_COLOR = ['', 'text-red-500', 'text-yellow-500', 'text-muted-foreground']

interface Props {
  target: TargetCardData
  selected?: boolean
  onSelect?: (id: string, checked: boolean) => void
  selectMode?: boolean
}

export function TargetCard({ target, selected, onSelect, selectMode }: Props) {
  return (
    <div
      className={cn(
        'surface-card flex items-start gap-3 p-4 transition-colors',
        selected && 'border-primary/50 bg-primary/[0.04]',
      )}
    >
      {selectMode && (
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect?.(target.id, e.target.checked)}
          className="mt-1 size-4 accent-primary"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/targets/${target.id}`} className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {target.category?.icon && (
                <span className="text-sm">{target.category.icon}</span>
              )}
              <p className="font-medium text-sm leading-snug truncate">{target.name}</p>
              <Star
                className={cn('size-3 shrink-0', PRIORITY_COLOR[target.priority])}
                fill={target.priority === 1 ? 'currentColor' : 'none'}
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              {target.category && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    background: (target.category.color ?? '#6b7280') + '22',
                    color: target.category.color ?? '#6b7280',
                  }}
                >
                  {target.category.nameTh}
                </span>
              )}
              {target.province && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="size-3" />{target.province}
                </span>
              )}
              {target.contactPerson && <span>{target.contactPerson}</span>}
            </div>
          </Link>
          <Badge variant={STATUS_VARIANT[target.status] as Parameters<typeof Badge>[0]['variant']} className="shrink-0 text-[10px]">
            {STATUS_LABEL[target.status]}
          </Badge>
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          {target.phone && (
            <a href={`tel:${target.phone}`} className="flex items-center gap-1 hover:text-foreground" onClick={(e) => e.stopPropagation()}>
              <Phone className="size-3" />{target.phone}
            </a>
          )}
          {target.email && (
            <a href={`mailto:${target.email}`} className="flex items-center gap-1 hover:text-foreground truncate" onClick={(e) => e.stopPropagation()}>
              <Mail className="size-3" /><span className="truncate max-w-32">{target.email}</span>
            </a>
          )}
          {target.website && (
            <a href={target.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground" onClick={(e) => e.stopPropagation()}>
              <Globe className="size-3" />เว็บ
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
