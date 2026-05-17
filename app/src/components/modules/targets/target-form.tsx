'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { createTarget, updateTarget } from '@/server/actions/targets'
import type { TargetStatus } from '@prisma/client'

const PROVINCES = ['ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'ฉะเชิงเทรา', 'ปราจีนบุรี', 'สระแก้ว']

const STATUS_OPTIONS: { value: TargetStatus; label: string }[] = [
  { value: 'NEW', label: 'ยังไม่ติดต่อ' },
  { value: 'CONTACTED', label: 'ส่งจดหมายแล้ว' },
  { value: 'PENDING', label: 'รอตอบรับ' },
  { value: 'DONE', label: 'ได้รับการตอบรับ' },
  { value: 'REJECTED', label: 'ปฏิเสธ' },
]

interface Category { id: string; nameTh: string; icon: string | null }

interface TargetFormProps {
  categories: Category[]
  initialData?: {
    id: string
    name: string
    categoryId: string | null
    province: string | null
    district: string | null
    address: string | null
    phone: string | null
    email: string | null
    website: string | null
    contactPerson: string | null
    contactTitle: string | null
    priority: number
    status: TargetStatus
    notes: string | null
  }
}

export function TargetForm({ categories, initialData }: TargetFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    categoryId: initialData?.categoryId ?? '',
    province: initialData?.province ?? '',
    district: initialData?.district ?? '',
    address: initialData?.address ?? '',
    phone: initialData?.phone ?? '',
    email: initialData?.email ?? '',
    website: initialData?.website ?? '',
    contactPerson: initialData?.contactPerson ?? '',
    contactTitle: initialData?.contactTitle ?? '',
    priority: String(initialData?.priority ?? 2),
    status: (initialData?.status ?? 'NEW') as TargetStatus,
    notes: initialData?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('กรุณากรอกชื่อองค์กร'); return }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId || undefined,
        province: form.province || undefined,
        district: form.district || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        website: form.website || undefined,
        contactPerson: form.contactPerson || undefined,
        contactTitle: form.contactTitle || undefined,
        priority: Number(form.priority),
        status: form.status,
        notes: form.notes || undefined,
      }

      if (isEdit) {
        const res = await updateTarget(initialData.id, payload)
        if (!res.ok) throw new Error()
        toast.success('บันทึกสำเร็จ')
        router.push(`/targets/${initialData.id}`)
      } else {
        const res = await createTarget(payload)
        if (!res.ok) throw new Error()
        toast.success('เพิ่มเป้าหมายสำเร็จ')
        router.push(`/targets/${res.id}`)
      }
    } catch {
      toast.error('บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Basic info */}
      <div className="flex flex-col gap-3">
        <div>
          <Label htmlFor="name">ชื่อองค์กร / สถานที่ *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="เช่น วัดป่าประดู่"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>หมวดหมู่</Label>
            <Select value={form.categoryId} onValueChange={(v) => set('categoryId', v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ไม่ระบุ</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.nameTh}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>จังหวัด</Label>
            <Select value={form.province} onValueChange={(v) => set('province', v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="เลือกจังหวัด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ไม่ระบุ</SelectItem>
                {PROVINCES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="district">อำเภอ / เขต</Label>
          <Input
            id="district"
            value={form.district}
            onChange={(e) => set('district', e.target.value)}
            placeholder="เช่น เมืองชลบุรี"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="address">ที่อยู่</Label>
          <Textarea
            id="address"
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="ที่อยู่เต็ม"
            className="mt-1"
            rows={2}
          />
        </div>
      </div>

      <Separator />

      {/* Contact */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ข้อมูลติดต่อ</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="phone">เบอร์โทร</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="0XX-XXX-XXXX"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="example@domain.com"
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="website">เว็บไซต์</Label>
          <Input
            id="website"
            type="url"
            value={form.website}
            onChange={(e) => set('website', e.target.value)}
            placeholder="https://"
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="contactPerson">ผู้ติดต่อ</Label>
            <Input
              id="contactPerson"
              value={form.contactPerson}
              onChange={(e) => set('contactPerson', e.target.value)}
              placeholder="ชื่อ-สกุล"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="contactTitle">ตำแหน่ง</Label>
            <Input
              id="contactTitle"
              value={form.contactTitle}
              onChange={(e) => set('contactTitle', e.target.value)}
              placeholder="เช่น เจ้าอาวาส"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Status & priority */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">สถานะ</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>สถานะ</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v as TargetStatus)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>ความสำคัญ</Label>
            <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">⭐ สูง</SelectItem>
                <SelectItem value="2">— ปกติ</SelectItem>
                <SelectItem value="3">↓ ต่ำ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Notes */}
      <div>
        <Label htmlFor="notes">หมายเหตุ</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="ข้อมูลเพิ่มเติม..."
          className="mt-1"
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
          ยกเลิก
        </Button>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          {isEdit ? 'บันทึก' : 'เพิ่มเป้าหมาย'}
        </Button>
      </div>
    </form>
  )
}
