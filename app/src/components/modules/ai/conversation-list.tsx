'use client'

import { useState, useTransition } from 'react'
import { PlusCircle, Trash2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteConversation } from '@/server/actions/ai'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  title: string
  updatedAt: Date
}

interface ConversationListProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}

export function ConversationList({ conversations, activeId, onSelect, onNew }: ConversationListProps) {
  const [pending, startTransition] = useTransition()

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(async () => {
      await deleteConversation(id)
    })
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <Button size="sm" className="w-full gap-2" onClick={onNew}>
        <PlusCircle className="size-4" />
        บทสนทนาใหม่
      </Button>

      <div className="flex flex-col gap-1 overflow-y-auto">
        {conversations.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">ยังไม่มีบทสนทนา</p>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              'group flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary/60',
              activeId === c.id && 'bg-secondary/80 font-medium',
            )}
          >
            <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-xs">{c.title}</span>
            <button
              onClick={(e) => handleDelete(c.id, e)}
              className="hidden rounded-md p-0.5 text-muted-foreground hover:text-destructive group-hover:flex"
              disabled={pending}
            >
              <Trash2 className="size-3" />
            </button>
          </button>
        ))}
      </div>
    </div>
  )
}
