'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TargetCard, type TargetCardData } from '@/components/modules/targets/target-card'
import { FilterSheet } from '@/components/modules/targets/filter-sheet'
import { AutoSearchPanel } from '@/components/modules/targets/auto-search-panel'
import { BulkActionBar } from '@/components/modules/targets/bulk-action-bar'
import { toast } from 'sonner'
import { createTarget } from '@/server/actions/targets'
import type { TargetStatus } from '@prisma/client'

interface Category { id: string; nameTh: string; icon: string | null; color: string | null }

interface TargetsClientProps {
  initialItems: TargetCardData[]
  initialTotal: number
  categories: Category[]
}

export function TargetsClient({ initialItems, initialTotal, categories }: TargetsClientProps) {
  const router = useRouter()

  // filters
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [province, setProvince] = useState('')
  const [status, setStatus] = useState('')

  // pagination / loading
  const [items, setItems] = useState<TargetCardData[]>(initialItems)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)

  // select mode
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // exporting
  const [exporting, setExporting] = useState(false)

  const activeFilterCount = [categoryId, province, status].filter(Boolean).length

  async function fetchPage(p: number, overrides?: { search?: string; categoryId?: string; province?: string; status?: string }) {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      const s = overrides?.search ?? search
      const c = overrides?.categoryId ?? categoryId
      const prov = overrides?.province ?? province
      const st = overrides?.status ?? status
      if (s) q.set('search', s)
      if (c) q.set('categoryId', c)
      if (prov) q.set('province', prov)
      if (st) q.set('status', st)
      q.set('page', String(p))

      const res = await fetch(`/api/targets?${q}`)
      const data = await res.json() as { items: TargetCardData[]; total: number }
      if (p === 0) {
        setItems(data.items)
      } else {
        setItems((prev) => [...prev, ...data.items])
      }
      setTotal(data.total)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }

  function applyFilter(key: 'categoryId' | 'province' | 'status', value: string) {
    const overrides = { categoryId, province, status, [key]: value }
    if (key === 'categoryId') setCategoryId(value)
    if (key === 'province') setProvince(value)
    if (key === 'status') setStatus(value)
    fetchPage(0, overrides)
  }

  function resetFilters() {
    setCategoryId(''); setProvince(''); setStatus('')
    fetchPage(0, { categoryId: '', province: '', status: '' })
  }

  let searchTimeout: ReturnType<typeof setTimeout>
  function handleSearchChange(v: string) {
    setSearch(v)
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => fetchPage(0, { search: v }), 400)
  }

  function handleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id))
  }

  async function handleExport() {
    setExporting(true)
    try {
      const q = new URLSearchParams()
      if (search) q.set('search', search)
      if (categoryId) q.set('categoryId', categoryId)
      if (province) q.set('province', province)
      if (status) q.set('status', status)
      q.set('export', 'xlsx')
      const res = await fetch(`/api/targets?${q}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'targets.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('ส่งออกไม่สำเร็จ')
    } finally {
      setExporting(false)
    }
  }

  async function handleImportFromSearch(results: { name: string; province: string; address: string; phone?: string; website?: string; source: string }[]) {
    for (const r of results) {
      await createTarget({
        name: r.name,
        province: r.province,
        address: r.address,
        phone: r.phone,
        website: r.website,
        source: r.source,
      })
    }
    fetchPage(0)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ค้นหา..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <FilterSheet
          categories={categories}
          categoryId={categoryId}
          province={province}
          status={status}
          onCategoryChange={(v) => applyFilter('categoryId', v)}
          onProvinceChange={(v) => applyFilter('province', v)}
          onStatusChange={(v) => applyFilter('status', v)}
          onReset={resetFilters}
          activeCount={activeFilterCount}
        />
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2">
        <AutoSearchPanel onImport={handleImportFromSearch} />
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Excel
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          variant={selectMode ? 'secondary' : 'outline'}
          onClick={() => { setSelectMode((v) => !v); setSelectedIds([]) }}
        >
          {selectMode ? 'ยกเลิก' : 'เลือก'}
        </Button>
        <Button size="sm" asChild className="gap-1.5">
          <Link href="/targets/new">
            <Plus className="size-4" />
            เพิ่ม
          </Link>
        </Button>
      </div>

      {/* List */}
      {items.length === 0 && !loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          ไม่พบข้อมูล
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((t) => (
            <TargetCard
              key={t.id}
              target={t}
              selected={selectedIds.includes(t.id)}
              onSelect={handleSelect}
              selectMode={selectMode}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {items.length < total && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fetchPage(page + 1)}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : `โหลดเพิ่ม (${total - items.length} รายการ)`}
        </Button>
      )}

      <BulkActionBar selectedIds={selectedIds} onClear={() => { setSelectedIds([]); setSelectMode(false) }} />
    </div>
  )
}
