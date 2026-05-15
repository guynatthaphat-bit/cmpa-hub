import { CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AttendanceStatus } from '@prisma/client'

interface AttendanceRecord {
  id: string
  date: Date
  clockInAt: Date | null
  clockOutAt: Date | null
  status: AttendanceStatus
}

interface AttendanceHistoryProps {
  records: AttendanceRecord[]
  locale: string
}

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: 'ตรงเวลา',
  LATE: 'สาย',
  EARLY_LEAVE: 'ออกก่อน',
  ABSENT: 'ขาด',
  REMOTE: 'WFH',
  ON_LEAVE: 'ลา',
}

const STATUS_VARIANT: Record<AttendanceStatus, string> = {
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

function fmtDate(d: Date, locale: string) {
  return new Date(d).toLocaleDateString(locale === 'th-TH' ? 'th-TH' : 'en-US', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
    timeZone: 'Asia/Bangkok',
  })
}

export function AttendanceHistory({ records, locale }: AttendanceHistoryProps) {
  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
            <CalendarDays className="size-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium">ยังไม่มีประวัติการเข้างาน</p>
          <p className="text-xs text-muted-foreground">เริ่มลงเวลาเพื่อเห็นประวัติที่นี่</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">ประวัติ 20 วันล่าสุด</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {records.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{fmtDate(r.date, locale)}</span>
                <span className="text-xs text-muted-foreground">
                  {fmtTime(r.clockInAt, locale)} – {fmtTime(r.clockOutAt, locale)}
                </span>
              </div>
              <Badge variant={STATUS_VARIANT[r.status] as Parameters<typeof Badge>[0]['variant']}>
                {STATUS_LABEL[r.status]}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
