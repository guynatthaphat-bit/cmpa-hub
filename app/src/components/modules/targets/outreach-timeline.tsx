'use client'

import { useState } from 'react'
import { Send, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { addOutreachLog } from '@/server/actions/targets'
import { useRouter } from 'next/navigation'

const LOG_TYPES = [
  { value: 'letter', label: '📄 จดหมาย' },
  { value: 'email', label: '📧 อีเมล' },
  { value: 'phone', label: '📞 โทรศัพท์' },
  { value: 'visit', label: '🚶 เยี่ยมชม' },
  { value: 'line', label: '💬 LINE' },
  { value: 'other', label: '📝 อื่นๆ' },
]

interface OutreachLog {
  id: string
  type: string
  sentAt: Date | string
  response: string | null
  createdBy: { firstName: string | null; lastName: string | null } | null
}

interface OutreachTimelineProps {
  targetId: string
  logs: OutreachLog[]
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function typeLabel(type: string) {
  return LOG_TYPES.find((t) => t.value === type)?.label ?? type
}

export function OutreachTimeline({ targetId, logs }: OutreachTimelineProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [logType, setLogType] = useState('letter')
  const [response, setResponse] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    setSaving(true)
    try {
      const res = await addOutreachLog({ targetId, type: logType, response: response || undefined })
      if (!res.ok) throw new Error()
      toast.success('บันทึกการติดต่อสำเร็จ')
      setShowForm(false)
      setResponse('')
      router.refresh()
    } catch {
      toast.error('บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">ประวัติการติดต่อ</p>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-3.5" />
          บันทึกการติดต่อ
        </Button>
      </div>

      {showForm && (
        <div className="surface-card flex flex-col gap-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">ช่องทาง</p>
              <Select value={logType} onValueChange={setLogType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOG_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">ผลการติดต่อ / หมายเหตุ</p>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="เช่น ส่งจดหมายขอรับบริจาค ยังไม่ได้รับการตอบกลับ"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowForm(false)}>ยกเลิก</Button>
            <Button size="sm" className="flex-1 gap-1.5" onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              บันทึก
            </Button>
          </div>
        </div>
      )}

      {logs.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">ยังไม่มีประวัติการติดต่อ</p>
      ) : (
        <div className="relative flex flex-col gap-0 pl-5">
          {/* vertical line */}
          <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
          {logs.map((log, i) => (
            <div key={log.id} className="relative flex flex-col gap-0.5 pb-5 last:pb-0">
              <div className="absolute -left-3.5 top-1 size-3 rounded-full border-2 border-primary bg-background" />
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">{typeLabel(log.type)}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(log.sentAt)}</span>
              </div>
              {log.response && (
                <p className="text-sm text-foreground/80 mt-1">{log.response}</p>
              )}
              {log.createdBy && (
                <p className="text-xs text-muted-foreground">
                  {log.createdBy.firstName} {log.createdBy.lastName}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
