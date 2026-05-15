'use client'

import { useRouter } from 'next/navigation'
import { ClockButton } from './clock-button'

interface ClockAreaProps {
  hasClockedIn: boolean
  hasClockedOut: boolean
}

export function ClockArea({ hasClockedIn, hasClockedOut }: ClockAreaProps) {
  const router = useRouter()

  function refresh() {
    router.refresh()
  }

  if (hasClockedOut) {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
        ลงเวลาครบแล้ววันนี้ — พบกันพรุ่งนี้
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {!hasClockedIn && <ClockButton mode="in" onSuccess={refresh} />}
      {hasClockedIn && !hasClockedOut && <ClockButton mode="out" onSuccess={refresh} />}
    </div>
  )
}
