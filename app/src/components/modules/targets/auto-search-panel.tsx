'use client'

import { useState } from 'react'
import { Search, Loader2, Plus, AlertCircle, Wand2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const PROVINCES = ['ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'ฉะเชิงเทรา', 'ปราจีนบุรี', 'สระแก้ว']

interface SearchResult {
  name: string
  province: string
  address: string
  phone?: string
  website?: string
  source: string
}

interface AutoSearchPanelProps {
  onImport: (results: SearchResult[]) => Promise<void>
}

export function AutoSearchPanel({ onImport }: AutoSearchPanelProps) {
  const [keyword, setKeyword] = useState('')
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>(['ชลบุรี', 'ระยอง'])
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isMock, setIsMock] = useState(false)
  const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set())
  const [importing, setImporting] = useState(false)

  function toggleProvince(p: string) {
    setSelectedProvinces((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    )
  }

  async function handleSearch() {
    if (!keyword.trim()) return
    setLoading(true)
    setResults([])
    setSelectedResults(new Set())
    try {
      const resp = await fetch('/api/targets/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, provinces: selectedProvinces, sources: ['google_places'] }),
      })
      const data = await resp.json() as { results: SearchResult[]; isMock?: boolean }
      setResults(data.results)
      setIsMock(data.isMock ?? false)
    } catch {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  function toggleResult(i: number) {
    setSelectedResults((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  async function handleImport() {
    const toImport = [...selectedResults].map((i) => results[i]).filter((r): r is SearchResult => Boolean(r))
    if (toImport.length === 0) return
    setImporting(true)
    try {
      await onImport(toImport)
      toast.success(`นำเข้า ${toImport.length} รายการสำเร็จ`)
      setResults([])
      setSelectedResults(new Set())
    } catch {
      toast.error('นำเข้าไม่สำเร็จ')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Wand2 className="size-4" />
          ค้นอัตโนมัติ
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col overflow-hidden p-0">
        <div className="border-b p-5">
          <SheetHeader>
            <SheetTitle>ค้นหาอัตโนมัติ</SheetTitle>
          </SheetHeader>
          {isMock && (
            <div className="mt-2 flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-xs text-warning">
              <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
              <span>ใช้ข้อมูลจำลอง — ใส่ GOOGLE_PLACES_API_KEY เพื่อค้นหาจริง</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto flex-1 p-5">
          <div className="flex gap-2">
            <Input
              placeholder="คำค้นหา เช่น วัด, โรงแรม…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSearch} disabled={loading || !keyword.trim()}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            </Button>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">จังหวัด</p>
            <div className="flex flex-wrap gap-1.5">
              {PROVINCES.map((p) => (
                <button
                  key={p}
                  onClick={() => toggleProvince(p)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${selectedProvinces.includes(p) ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {results.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ผลลัพธ์ {results.length} รายการ
                </p>
                <button
                  className="text-xs text-primary"
                  onClick={() => setSelectedResults(new Set(results.map((_, i) => i)))}
                >
                  เลือกทั้งหมด
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {results.map((r, i) => (
                  <label key={i} className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedResults.has(i)}
                      onChange={() => toggleResult(i)}
                      className="mt-1 size-4 accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.address}</p>
                      {r.phone && <p className="text-xs text-muted-foreground">{r.phone}</p>}
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">{r.province}</Badge>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedResults.size > 0 && (
          <div className="border-t p-4">
            <Button className="w-full gap-2" onClick={handleImport} disabled={importing}>
              {importing ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              นำเข้า {selectedResults.size} รายการ
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
