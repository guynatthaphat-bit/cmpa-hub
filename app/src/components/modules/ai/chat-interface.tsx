'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Send, Loader2, Sparkles, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createConversation } from '@/server/actions/ai'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface StoredMessage {
  id: string
  role: string
  content: string
  createdAt: Date
}

interface ChatInterfaceProps {
  conversationId: string | null
  initialMessages: StoredMessage[]
  onNewConversation: (id: string) => void
}

export function ChatInterface({ conversationId, initialMessages, onNewConversation }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  )
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [pending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const activeConvId = useRef<string | null>(conversationId)

  // Reset when conversation changes
  useEffect(() => {
    activeConvId.current = conversationId
    setMessages(
      initialMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || streaming) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])

    let convId = activeConvId.current

    // Create conversation on first message
    if (!convId) {
      const result = await createConversation(text)
      if (!result.ok) return
      convId = result.id
      activeConvId.current = convId
      onNewConversation(convId)
    }

    setStreaming(true)
    setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }])

    try {
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, message: text }),
      })

      if (!resp.body) throw new Error('No stream')

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data) as { text?: string; error?: string }
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) {
              setMessages((prev) => {
                const copy = [...prev]
                const last = copy[copy.length - 1]
                if (last?.role === 'assistant') {
                  copy[copy.length - 1] = { ...last, content: last.content + parsed.text! }
                }
                return copy
              })
            }
          } catch {
            // skip malformed line
          }
        }
      }
    } finally {
      setStreaming(false)
      setMessages((prev) => {
        const copy = [...prev]
        const last = copy[copy.length - 1]
        if (last?.streaming) copy[copy.length - 1] = { ...last, streaming: false }
        return copy
      })
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg">
              <Sparkles className="size-7" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-semibold">ผู้ช่วย AI สอค.ภอ</p>
              <p className="mt-1 text-sm text-muted-foreground">ถามเรื่องกฎหมาย นโยบาย MOU หรือแผนงานได้เลย</p>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-4">
          {messages.map((m, i) => (
            <div key={i} className={cn('flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
              <div
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground',
                )}
              >
                {m.role === 'user' ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
              </div>
              <div
                className={cn(
                  'max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground',
                )}
              >
                {m.content || (m.streaming && <Loader2 className="size-4 animate-spin" />)}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-background/80 px-4 py-3 backdrop-blur">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="พิมพ์คำถาม… (Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`
            }}
          />
          <Button
            size="icon"
            onClick={send}
            disabled={!input.trim() || streaming || pending}
            className="size-10 shrink-0 rounded-xl"
          >
            {streaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
