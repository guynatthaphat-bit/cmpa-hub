import { Clock } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getTodayAttendance, getAttendanceHistory } from '@/server/actions/attendance'
import { TodayStatus } from '@/components/modules/attendance/today-status'
import { ClockArea } from '@/components/modules/attendance/clock-area'
import { AttendanceHistory } from '@/components/modules/attendance/attendance-history'

export const metadata = { title: 'ลงเวลา' }

export default async function AttendancePage() {
  const session = await auth()
  const locale = session?.user?.locale ?? 'th-TH'
  const dateSystem = session?.user?.dateSystem ?? 'BE'

  const [today, history] = await Promise.all([
    getTodayAttendance(),
    getAttendanceHistory(),
  ])

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-3 animate-fade-in">
      <section className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Clock className="size-5" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold">ลงเวลา</h1>
          <p className="text-xs text-muted-foreground">ถ่ายเซลฟี่ + GPS อัตโนมัติ</p>
        </div>
      </section>

      {today && (
        <TodayStatus
          clockInAt={today.clockInAt}
          clockOutAt={today.clockOutAt}
          status={today.status}
          lat={today.clockInLat}
          lng={today.clockInLng}
          locale={locale}
          dateSystem={dateSystem}
        />
      )}

      <ClockArea
        hasClockedIn={!!today?.clockInAt}
        hasClockedOut={!!today?.clockOutAt}
      />

      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ประวัติการเข้างาน
        </h2>
        <AttendanceHistory records={history} locale={locale} />
      </section>
    </div>
  )
}
