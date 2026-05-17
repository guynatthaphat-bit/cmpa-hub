'use client'

import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { TargetStatus } from '@prisma/client'

const PROVINCES = ['ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'ฉะเชิงเทรา', 'ปราจีนบุรี', 'สระแก้ว']

const STATUS_OPTIONS: { value: TargetStatus | ''; label: string }[] = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'NEW', label: 'ยังไม่ติดต่อ' },
  { value: 'CONTACTED', label: 'ส่งจดหมายแล้ว' },
  { value: 'PENDING', label: 'รอตอบรับ' },
  { value: 'DONE', label: 'ได้รับการตอบรับ' },
  { value: 'REJECTED', label: 'ปฏิเสธ' },
]

interface Category { id: string; nameTh: string; icon: string | null }

interface FilterSheetProps {
  categories: Category[]
  categoryId: string
  province: string
  status: string
  onCategoryChange: (v: string) => void
  onProvinceChange: (v: string) => void
  onStatusChange: (v: string) => void
  onReset: () => void
  activeCount: number
}

export function FilterSheet({
  categories, categoryId, province, status,
  onCategoryChange, onProvinceChange, onStatusChange, onReset, activeCount,
}: FilterSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative gap-1.5">
          <SlidersHorizontal className="size-4" />
          ตัวกรอง
          {activeCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>ตัวกรอง</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 mt-2">
          {/* Categories */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">หมวดหมู่</p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => onCategoryChange('')}
                className={`rounded-xl px-3 py-2 text-left text-sm transition-colors ${categoryId === '' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
              >
                ทั้งหมด
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onCategoryChange(c.id)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${categoryId === c.id ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
                >
                  {c.icon && <span>{c.icon}</span>}
                  {c.nameTh}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">สถานะ</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => onStatusChange(s.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${status === s.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Province */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">จังหวัด</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onProvinceChange('')}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${province === '' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50'}`}
              >
                ทั้งหมด
              </button>
              {PROVINCES.map((p) => (
                <button
                  key={p}
                  onClick={() => onProvinceChange(p)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${province === p ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {activeCount > 0 && (
            <Button variant="outline" size="sm" className="gap-2" onClick={onReset}>
              <RotateCcw className="size-3.5" />
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
