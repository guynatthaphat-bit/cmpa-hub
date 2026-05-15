import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
const PAPERCLIP_ENABLED = process.env.PAPERCLIP_ENABLED === 'true'
const PAPERCLIP_URL = process.env.PAPERCLIP_URL ?? ''

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

const SYSTEM_PROMPT = `คุณคือผู้ช่วย AI ของสมาคมสร้างเสริมอาชีพคนพิการภาคตะวันออก (สอค.ภอ ทะเบียน จ.๓๗๙๘/๒๕๕๒)
ช่วยเรื่อง: กฎหมาย นโยบาย แม่แบบ MOU แผนงาน และคำแนะนำสำหรับองค์กร
ตอบเป็นภาษาไทย ชัดเจน กระชับ ถ้าไม่แน่ใจให้บอกว่าไม่แน่ใจ ห้ามแต่งข้อมูลขึ้นมาเอง`

export async function* streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
  if (PAPERCLIP_ENABLED && PAPERCLIP_URL) {
    yield* streamPaperclip(messages)
  } else {
    yield* streamAnthropic(messages)
  }
}

async function* streamAnthropic(messages: ChatMessage[]): AsyncGenerator<string> {
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages,
  })
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      yield chunk.delta.text
    }
  }
}

async function* streamPaperclip(messages: ChatMessage[]): AsyncGenerator<string> {
  try {
    const resp = await fetch(PAPERCLIP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, system: SYSTEM_PROMPT }),
    })
    if (!resp.ok || !resp.body) {
      yield* streamAnthropic(messages)
      return
    }
    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      yield decoder.decode(value, { stream: true })
    }
  } catch {
    yield* streamAnthropic(messages)
  }
}
