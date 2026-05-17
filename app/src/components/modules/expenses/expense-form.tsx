'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ReceiptScanner } from './receipt-scanner'
import { createClaim, submitClaim } from '@/server/actions/expenses'
import type { ExpenseCategory } from '@prisma/client'

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: 'TRAVEL', label: 'เดินทาง' },
  { value: 'MEAL', label: 'อาหาร' },
  { value: 'OFFICE_SUPPLY', label: 'เครื่องเขียน' },
  { value: 'EVENT', label: 'จัดงาน' },
  { value: 'OVERTIME', label: 'OT' },
  { value: 'OTHER', label: 'อื่นๆ' },
]

interface OcrData {
  imageBase64: string
  vendor: string | null
  date: string | null
  amount: number | null
  confidence: number
}

interface ExpenseFormProps {
  initialOcr?: OcrData
}

export function ExpenseForm({ initialOcr }: ExpenseFormProps) {
  const router = useRouter()

  const [ocrData, setOcrData] = useState<OcrData | null>(initialOcr ?? null)
  const [category, setCategory] = useState<ExpenseCategory>('OTHER')
  const [amount, setAmount] = useState<string>(
    initialOcr?.amount != null ? String(initialOcr.amount) : '',
  )
  const [description, setDescription] = useState<string>(
    initialOcr?.vendor
      ? `ร้าน ${initialOcr.vendor}${initialOcr.date ? ` วันที่ ${initialOcr.date}` : ''}`
      : '',
  )
  const [saving, setSaving] = useState(false)

  function handleOcrResult(result: OcrData) {
    setOcrData(result)
    if (result.amount != null) {
      setAmount(String(result.amount))
    }
    if (result.vendor) {
      setDescription(
        `ร้าน ${result.vendor}${result.date ? ` วันที่ ${result.date}` : ''}`,
      )
    }
  }

  async function handleSaveDraft() {
    if (!validateForm()) return
    setSaving(true)
    try {
      const res = await createClaim(buildPayload())
      if (!res.ok) {
        toast.error(res.error ?? 'บันทึกไม่สำเร็จ')
        return
      }
      toast.success('บันทึก Draft สำเร็จ')
      router.push(`/expenses/${res.id}`)
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAndSubmit() {
    if (!validateForm()) return
    setSaving(true)
    try {
      const res = await createClaim(buildPayload())
      if (!res.ok) {
        toast.error(res.error ?? 'บันทึกไม่สำเร็จ')
        return
      }
      const submitRes = await submitClaim(res.id)
      if (!submitRes.ok) {
        toast.error('ยื่นเบิกไม่สำเร็จ')
        router.push(`/expenses/${res.id}`)
        return
      }
      toast.success('ยื่นเบิกค่าใช้จ่ายสำเร็จ')
      router.push('/expenses')
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  function validateForm(): boolean {
    if (!amount || Number(amount) <= 0) {
      toast.error('กรุณากรอกจำนวนเงินที่ถูกต้อง')
      return false
    }
    if (!description.trim()) {
      toast.error('กรุณากรอกรายละเอียด')
      return false
    }
    return true
  }

  function buildPayload() {
    return {
      category,
      amount: Number(amount),
      description: description.trim(),
      receiptUrl: ocrData?.imageBase64 ?? undefined,
      ocrVendor: ocrData?.vendor ?? undefined,
      ocrDate: ocrData?.date ?? undefined,
      ocrAmount: ocrData?.amount ?? undefined,
      ocrConfidence: ocrData?.confidence ?? undefined,
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Receipt scanner — shown only when no image yet */}
      {!ocrData?.imageBase64 && (
        <div>
          <Label className="mb-1.5 block">ใบเสร็จ</Label>
          <ReceiptScanner onResult={handleOcrResult} />
        </div>
      )}

      {/* Preview if already scanned */}
      {ocrData?.imageBase64 && (
        <div className="flex flex-col gap-2">
          <Label className="block">ใบเสร็จ</Label>
          <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
            <img
              src={ocrData.imageBase64}
              alt="ใบเสร็จ"
              className="mx-auto max-h-40 w-full object-contain"
            />
          </div>
          <button
            type="button"
            className="text-xs text-primary underline underline-offset-2 self-start"
            onClick={() => setOcrData(null)}
          >
            เปลี่ยนรูป
          </button>
        </div>
      )}

      {/* OCR badge */}
      {ocrData && (ocrData.vendor || ocrData.amount != null) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="secondary" className="gap-1 text-xs">
            <span>OCR:</span>
            {ocrData.vendor && <span>{ocrData.vendor}</span>}
            {ocrData.amount != null && (
              <span>
                |{' '}
                {Number(ocrData.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
              </span>
            )}
            <span>| {Math.round(ocrData.confidence * 100)}%</span>
          </Badge>
        </div>
      )}

      {/* Category */}
      <div>
        <Label htmlFor="category">หมวดหมู่ *</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
          <SelectTrigger className="mt-1" id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount */}
      <div>
        <Label htmlFor="amount">จำนวนเงิน (บาท) *</Label>
        <Input
          id="amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="mt-1"
          required
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">รายละเอียด *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="กรอกรายละเอียดค่าใช้จ่าย..."
          rows={3}
          className="mt-1"
          required
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={handleSaveDraft}
          disabled={saving}
        >
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          บันทึก Draft
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={handleSaveAndSubmit}
          disabled={saving}
        >
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          บันทึกและยื่น
        </Button>
      </div>
    </div>
  )
}
