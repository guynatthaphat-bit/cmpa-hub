import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface OcrResult {
  vendor: string | null
  date: string | null
  amount: number | null
  confidence: number
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fallback: OcrResult = { vendor: null, date: null, amount: null, confidence: 0 }

  try {
    const body = await req.json() as { imageBase64?: string; mimeType?: string }
    const { imageBase64, mimeType = 'image/jpeg' } = body

    if (!imageBase64) {
      return NextResponse.json(fallback)
    }

    const mediaType = (mimeType === 'image/png' ? 'image/png' : 'image/jpeg') as 'image/jpeg' | 'image/png'

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'Extract from this Thai receipt: vendor/store name, date (ISO YYYY-MM-DD), total amount paid (number only, no currency symbol). Return JSON only: {"vendor":"...","date":"YYYY-MM-DD or null","amount":0.00,"confidence":0.0}',
            },
          ],
        },
      ],
    })

    const rawText = message.content[0]?.type === 'text' ? message.content[0].text : ''

    try {
      // Extract JSON from response — Claude sometimes wraps in markdown
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return NextResponse.json(fallback)

      const parsed = JSON.parse(jsonMatch[0]) as {
        vendor?: string | null
        date?: string | null
        amount?: number | null
        confidence?: number
      }

      const result: OcrResult = {
        vendor: parsed.vendor ?? null,
        date: parsed.date ?? null,
        amount: typeof parsed.amount === 'number' ? parsed.amount : null,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      }

      return NextResponse.json(result)
    } catch {
      return NextResponse.json(fallback)
    }
  } catch {
    return NextResponse.json(fallback)
  }
}
