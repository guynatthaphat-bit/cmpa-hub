import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { streamChat } from '@/lib/ai-client'
import type { ChatMessage } from '@/lib/ai-client'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { conversationId, message } = (await req.json()) as {
    conversationId: string
    message: string
  }

  if (!conversationId || !message?.trim()) {
    return new Response('Bad Request', { status: 400 })
  }

  const conversation = await prisma.aIConversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 40 } },
  })
  if (!conversation) return new Response('Not found', { status: 404 })

  // Persist user message immediately
  await prisma.aIMessage.create({
    data: { conversationId, role: 'user', content: message },
  })

  const history: ChatMessage[] = [
    ...conversation.messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ]

  const encoder = new TextEncoder()
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChat(history)) {
          fullResponse += chunk
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()

        const model =
          process.env.PAPERCLIP_ENABLED === 'true'
            ? 'paperclip'
            : (process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6')

        await prisma.aIMessage.create({
          data: { conversationId, role: 'assistant', content: fullResponse, model },
        })

        // Update title on first user message
        if (conversation.messages.length === 0) {
          await prisma.aIConversation.update({
            where: { id: conversationId },
            data: { title: message.slice(0, 60) + (message.length > 60 ? '…' : '') },
          })
        } else {
          // bump updatedAt
          await prisma.aIConversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          })
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Error'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
