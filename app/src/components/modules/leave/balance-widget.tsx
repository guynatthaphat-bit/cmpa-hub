'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { LeaveBalance } from '@prisma/client'

interface BalanceWidgetProps {
  balance: LeaveBalance | null
  year: number
}

interface ProgressBarProps {
  label: string
  used: number
  total: number
  color: 'blue' | 'red' | 'yellow'
}

const COLOR_MAP = {
  blue: {
    track: 'bg-blue-100 dark:bg-blue-900/30',
    bar: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
  },
  red: {
    track: 'bg-red-100 dark:bg-red-900/30',
    bar: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
  },
  yellow: {
    track: 'bg-yellow-100 dark:bg-yellow-900/30',
    bar: 'bg-yellow-500',
    text: 'text-yellow-600 dark:text-yellow-400',
  },
}

function ProgressBar({ label, used, total, color }: ProgressBarProps) {
  const remaining = Math.max(total - used, 0)
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0
  const colors = COLOR_MAP[color]

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={`text-xs font-semibold tabular-nums ${colors.text}`}>
          ใช้ไป {used} / {total} วัน
        </span>
      </div>
      <div className={`h-2 w-full overflow-hidden rounded-full ${colors.track}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">เหลือ {remaining} วัน</p>
    </div>
  )
}

export function BalanceWidget({ balance, year }: BalanceWidgetProps) {
  if (!balance) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-sm font-medium">ยังไม่มีข้อมูลวันลา</p>
          <p className="text-xs text-muted-foreground">ติดต่อผู้ดูแลระบบเพื่อตั้งค่าวันลาประจำปี {year}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">วันลาคงเหลือปี {year}</h2>
        </div>
        <ProgressBar
          label="ลาพักร้อน"
          used={balance.annualUsed}
          total={balance.annualTotal}
          color="blue"
        />
        <ProgressBar
          label="ลาป่วย"
          used={balance.sickUsed}
          total={balance.sickTotal}
          color="red"
        />
        <ProgressBar
          label="ลากิจ"
          used={balance.personalUsed}
          total={balance.personalTotal}
          color="yellow"
        />
      </CardContent>
    </Card>
  )
}
