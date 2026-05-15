'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function createConversation(firstMessage: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const, error: 'unauthorized' }

  const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? '…' : '')
  const conversation = await prisma.aIConversation.create({
    data: { userId: session.user.id, title },
  })

  revalidatePath('/ai')
  return { ok: true as const, id: conversation.id }
}

export async function getConversations() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.aIConversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    take: 30,
    select: { id: true, title: true, updatedAt: true },
  })
}

export async function deleteConversation(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const }

  await prisma.aIConversation.deleteMany({
    where: { id, userId: session.user.id },
  })

  revalidatePath('/ai')
  return { ok: true as const }
}

export async function getConversationMessages(id: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const conv = await prisma.aIConversation.findFirst({
    where: { id, userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })
  return conv
}
