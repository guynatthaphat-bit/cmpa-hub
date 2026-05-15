import { Clock, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/date'
import type { AttendanceStatus } from '@prisma/client'

interface TodayStatusProps {
  clockInAt: Date | null
  clockOutAt: Date | null
  status: AttendanceStatus
  lat: number | null
  lng: number | null
  locale: string
  dateSystem: string
}

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: 'มาตรงเวลา',
  LATE: 'มาสาย',
  EARLY_LEAVE: 'ออกก่อนเวลา',
  ABSENT: 'ขาดงาน',
  REMOTE: 'Work from Home',
  ON_LEAVE: 'ลางาน',
}

const STATUS_VARIANT: Record<AttendanceStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  PRESENT: 'success',
  LATE: 'warning',
  EARLY_LEAVE: 'warning',
  ABSENT: 'destructive',
  REMOTE: 'secondary',
  ON_LEAVE: 'secondary',
}

function fmtTime(d: Date | null, locale: string) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString(locale === 'th-TH' ? 'th-TH' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  })
}

export function TodayStatus({ clockInAt, clockOutAt, status, lat, lng, locale, dateSystem }: TodayStatusProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock className="size-4.5" strokeWidth={1.8} />
            </div>
            <span className="font-semibold">สถานะวันนี้</span>
          </div>
          <Badge variant={STATUS_VARIANT[status] as Parameters<typeof Badge>[0]['variant']}>
            {STATUS_LABEL[status]}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5 rounded-xl bg-background/60 p-3">
            <span className="text-xs text-muted-foreground">เข้างาน</span>
            <span className="text-lg font-bold tabular-nums">{fmtTime(clockInAt, locale)}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl bg-background/60 p-3">
            <span className="text-xs text-muted-foreground">ออกงาน</span>
            <span className="text-lg font-bold tabular-nums">{fmtTime(clockOutAt, locale)}</span>
          </div>
        </div>

        {lat && lng && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
