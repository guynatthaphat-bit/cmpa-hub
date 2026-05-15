'use client'

import { useRef, useState, useTransition } from 'react'
import { Camera, MapPin, Loader2, CheckCircle2, LogIn, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clockInAction, clockOutAction } from '@/server/actions/attendance'
import { toast } from 'sonner'

type Mode = 'in' | 'out'

interface ClockButtonProps {
  mode: Mode
  onSuccess: () => void
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 640
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    img.onerror = reject
    img.src = url
  })
}

function getGPS(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000 },
    )
  })
}

export function ClockButton({ mode, onSuccess }: ClockButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'idle' | 'photo' | 'gps' | 'saving' | 'done'>('idle')
  const [pending, startTransition] = useTransition()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setStep('photo')
    let selfie: string | null = null
    try {
      selfie = await compressImage(file)
    } catch {
      selfie = null
    }

    setStep('gps')
    const gps = await getGPS()

    setStep('saving')
    startTransition(async () => {
      const result =
        mode === 'in'
          ? await clockInAction(gps?.lat ?? null, gps?.lng ?? null, selfie)
          : await clockOutAction(gps?.lat ?? null, gps?.lng ?? null, selfie)

      if (result.ok) {
        setStep('done')
        onSuccess()
      } else {
        setStep('idle')
        const msgs: Record<string, string> = {
          alreadyClockedIn: 'ลงเวลาเข้างานแล้ววันนี้',
          alreadyClockedOut: 'ลงเวลาออกงานแล้ววันนี้',
          notClockedIn: 'ยังไม่ได้ลงเวลาเข้างาน',
          unauthorized: 'กรุณาเข้าสู่ระบบ',
        }
        toast.error(msgs[result.error ?? ''] ?? 'เกิดข้อผิดพลาด')
      }
    })

    // reset input so same file can retrigger
    e.target.value = ''
  }

  const isLoading = step !== 'idle' && step !== 'done' || pending

  const stepLabel: Record<string, string> = {
    photo: 'กำลังประมวลผลรูป…',
    gps: 'กำลังระบุตำแหน่ง…',
    saving: 'กำลังบันทึก…',
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        size="lg"
        variant={mode === 'in' ? 'default' : 'outline'}
        className="h-16 w-full gap-3 text-base"
        disabled={isLoading || step === 'done'}
        onClick={() => fileRef.current?.click()}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            {stepLabel[step] ?? 'กำลังดำเนินการ…'}
          </>
        ) : step === 'done' ? (
          <>
            <CheckCircle2 className="size-5 text-green-500" />
            {mode === 'in' ? 'ลงเวลาเข้างานแล้ว' : 'ลงเวลาออกงานแล้ว'}
          </>
        ) : (
          <>
            {mode === 'in' ? <LogIn className="size-5" /> : <LogOut className="size-5" />}
            {mode === 'in' ? 'ลงเวลาเข้างาน' : 'ลงเวลาออกงาน'}
            <span className="ml-auto flex items-center gap-1 text-xs opacity-70">
              <Camera className="size-3.5" />
              <MapPin className="size-3.5" />
            </span>
          </>
        )}
      </Button>
    </>
  )
}
