import { getConversations, getConversationMessages } from '@/server/actions/ai'
import { AiShell } from '@/components/modules/ai/ai-shell'

export const metadata = { title: 'AI วิจัย' }

interface Props {
  searchParams: { c?: string }
}

export default async function AiPage({ searchParams }: Props) {
  const [conversations, activeConversation] = await Promise.all([
    getConversations(),
    searchParams.c ? getConversationMessages(searchParams.c) : null,
  ])

  const active = activeConversation
    ? {
        id: activeConversation.id,
        messages: activeConversation.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
      }
    : null

  return (
    <AiShell
      conversations={conversations.map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt,
      }))}
      activeConversation={active}
    />
  )
}
