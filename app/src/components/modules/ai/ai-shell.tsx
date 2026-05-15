'use client'

import { useState } from 'react'
import { PanelLeft, X } from 'lucide-react'
import { ConversationList } from './conversation-list'
import { ChatInterface } from './chat-interface'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface Conversation {
  id: string
  title: string
  updatedAt: Date
}

interface StoredMessage {
  id: string
  role: string
  content: string
  createdAt: Date
}

interface AiShellProps {
  conversations: Conversation[]
  activeConversation: { id: string; messages: StoredMessage[] } | null
}

export function AiShell({ conversations: initialConvs, activeConversation }: AiShellProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [convs, setConvs] = useState(initialConvs)
  const [activeId, setActiveId] = useState<string | null>(activeConversation?.id ?? null)

  function handleSelectConv(id: string) {
    setActiveId(id)
    setSidebarOpen(false)
    router.push(`/ai?c=${id}`)
  }

  function handleNewConv() {
    setActiveId(null)
    setSidebarOpen(false)
    router.push('/ai')
  }

  function handleConvCreated(id: string) {
    setActiveId(id)
    // optimistically add to list — server revalidation will fill in title
    setConvs((prev) => [{ id, title: '…', updatedAt: new Date() }, ...prev])
    router.refresh()
  }

  return (
    <div className="relative flex h-[calc(100dvh-56px)] overflow-hidden">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`absolute inset-y-0 left-0 z-30 w-64 border-r bg-background p-3 transition-transform duration-200 md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-2 flex items-center justify-between md:hidden">
          <span className="text-sm font-semibold">บทสนทนา</span>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setSidebarOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>
        <ConversationList
          conversations={convs}
          activeId={activeId}
          onSelect={handleSelectConv}
          onNew={handleNewConv}
        />
      </aside>

      {/* Chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b px-4 py-2 md:hidden">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setSidebarOpen(true)}>
            <PanelLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium">AI วิจัย</span>
        </div>

        <ChatInterface
          conversationId={activeId}
          initialMessages={activeConversation?.messages ?? []}
          onNewConversation={handleConvCreated}
        />
      </div>
    </div>
  )
}
