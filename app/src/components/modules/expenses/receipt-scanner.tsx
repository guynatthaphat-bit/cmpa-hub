'use client'

import { useRef, useState } from 'react'
import { Camera, FolderOpen, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OcrResult {
  imageBase64: string
  vendor: string | null
  date: string | null
  amount: number | null
  confidence: number
}

interface ReceiptScannerProps {
  onResult: (result: OcrResult) => void
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const MAX_SIZE = 1200
      let { width, height } = img

      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE) / width)
          width = MAX_SIZE
        } else {
          width = Math.round((width * MAX_SIZE) / height)
          height = MAX_SIZE
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Get base64 without the data URL prefix
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      const base64 = dataUrl.split(',')[1] ?? ''
      resolve(base64)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

export function ReceiptScanner({ onResult }: ReceiptScannerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [ocrData, setOcrData] = useState<Omit<OcrResult, 'imageBase64'> | null>(null)

  async function handleFile(file: File) {
    setOcrData(null)
    setScanning(true)

    try {
      const base64 = await compressImage(file)
      const previewUrl = `data:image/jpeg;base64,${base64}`
      setPreview(previewUrl)

      const res = await fetch('/api/expenses/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: 'image/jpeg' }),
      })

      const data = await res.json() as {
        vendor: string | null
        date: string | null
        amount: number | null
        confidence: number
      }

      setOcrData(data)
      onResult({ imageBase64: previewUrl, ...data })
    } catch {
      const fallback = { vendor: null, date: null, amount: null, confidence: 0 }
      setOcrData(fallback)
      onResult({ imageBase64: preview ?? '', ...fallback })
    } finally {
      setScanning(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const isHighConfidence = ocrData !== null && ocrData.confidence >= 0.8

  return (
    <div className="flex flex-col gap-3">
      {/* Buttons */}
      <div className="flex gap-2">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleInputChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />

        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => cameraInputRef.current?.click()}
          disabled={scanning}
        >
          <Camera className="size-4" />
          ถ่ายใบเสร็จ
        </Button>

        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning}
        >
          <FolderOpen className="size-4" />
          เลือกไฟล์
        </Button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/30">
          <img
            src={preview}
            alt="ใบเสร็จ"
            className="mx-auto max-h-48 w-full object-contain"
          />
        </div>
      )}

      {/* Scanning indicator */}
      {scanning && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">กำลังอ่านใบเสร็จ...</span>
        </div>
      )}

      {/* OCR Result */}
      {!scanning && ocrData && (
        <div
          className={`flex flex-col gap-1.5 rounded-xl border px-4 py-3 ${
            isHighConfidence
              ? 'border-success/30 bg-success/10'
              : 'border-warning/30 bg-warning/10'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {isHighConfidence ? (
              <CheckCircle className="size-4 text-success" />
            ) : (
              <AlertCircle className="size-4 text-warning" />
            )}
            <span
              className={`text-xs font-semibold ${
                isHighConfidence ? 'text-success' : 'text-warning'
              }`}
            >
              {isHighConfidence ? 'ความแม่นยำสูง' : 'กรุณาตรวจสอบ'}{' '}
              ({Math.round(ocrData.confidence * 100)}%)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">ร้านค้า</span>
              <p className="font-medium truncate">{ocrData.vendor ?? '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">วันที่</span>
              <p className="font-medium">{ocrData.date ?? '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">จำนวน</span>
              <p className="font-medium tabular-nums">
                {ocrData.amount != null
                  ? Number(ocrData.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
