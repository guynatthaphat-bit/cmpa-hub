'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { ProjectStatus, TaskStatus, TaskPriority } from '@prisma/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProjectListItem = {
  id: string
  code: string
  name: string
  description: string | null
  status: ProjectStatus
  startDate: Date | null
  endDate: Date | null
  budget: string | null
  ownerId: string
  owner: { firstName: string | null; lastName: string | null }
  _count: { tasks: number }
  createdAt: Date
  updatedAt: Date
}

export type TaskData = {
  id: string
  projectId: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string | null
  assignee: { firstName: string | null; lastName: string | null } | null
  dueDate: Date | null
  completedAt: Date | null
  position: number
  createdAt: Date
  updatedAt: Date
}

export type MemberData = {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function getProjects(): Promise<ProjectListItem[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      owner: { select: { firstName: true, lastName: true } },
      _count: { select: { tasks: true } },
    },
  })

  return projects.map((p) => ({
    ...p,
    budget: p.budget ? p.budget.toString() : null,
  }))
}

export async function getProject(id: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      tasks: {
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      },
      members: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      },
    },
  })

  if (!project) return null

  return {
    ...project,
    budget: project.budget ? project.budget.toString() : null,
  }
}

export async function createProject(data: {
  name: string
  description?: string
  startDate?: string
  endDate?: string
  budget?: string
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const code = 'P' + Date.now().toString(36).toUpperCase().slice(-4)

  const project = await prisma.project.create({
    data: {
      code,
      name: data.name,
      description: data.description ?? null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      budget: data.budget ? parseFloat(data.budget) : null,
      ownerId: session.user.id,
    },
  })

  revalidatePath('/projects')
  return { ok: true, id: project.id }
}

export async function updateProject(
  id: string,
  data: Partial<{
    name: string
    description: string
    status: ProjectStatus
    startDate: string
    endDate: string
    budget: string
  }>,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const project = await prisma.project.findUnique({ where: { id }, select: { ownerId: true } })
  if (!project) return { ok: false, error: 'not_found' }

  const isOwner = project.ownerId === session.user.id
  const isPrivileged = session.user.role === 'ADMIN' || session.user.role === 'MANAGER'
  if (!isOwner && !isPrivileged) return { ok: false, error: 'forbidden' }

  await prisma.project.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.startDate !== undefined ? { startDate: data.startDate ? new Date(data.startDate) : null } : {}),
      ...(data.endDate !== undefined ? { endDate: data.endDate ? new Date(data.endDate) : null } : {}),
      ...(data.budget !== undefined ? { budget: data.budget ? parseFloat(data.budget) : null } : {}),
    },
  })

  revalidatePath('/projects')
  revalidatePath('/projects/' + id)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function createTask(data: {
  projectId: string
  title: string
  description?: string
  priority?: TaskPriority
  assigneeId?: string
  dueDate?: string
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const task = await prisma.task.create({
    data: {
      projectId: data.projectId,
      title: data.title,
      description: data.description ?? null,
      priority: data.priority ?? 'MEDIUM',
      assigneeId: data.assigneeId ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  })

  revalidatePath('/projects/' + data.projectId)
  return { ok: true, id: task.id }
}

export async function updateTask(
  id: string,
  data: Partial<{
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    assigneeId: string | null
    dueDate: string | null
  }>,
): Promise<{ ok: boolean; projectId?: string; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const existing = await prisma.task.findUnique({ where: { id }, select: { projectId: true, status: true } })
  if (!existing) return { ok: false, error: 'not_found' }

  const isCompletingNow = data.status === 'DONE' && existing.status !== 'DONE'

  await prisma.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.assigneeId !== undefined ? { assigneeId: data.assigneeId } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
      ...(isCompletingNow ? { completedAt: new Date() } : {}),
    },
  })

  revalidatePath('/projects/' + existing.projectId)
  return { ok: true, projectId: existing.projectId }
}

export async function deleteTask(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' }

  const existing = await prisma.task.findUnique({ where: { id }, select: { projectId: true } })
  if (!existing) return { ok: false, error: 'not_found' }

  await prisma.task.delete({ where: { id } })

  revalidatePath('/projects/' + existing.projectId)
  return { ok: true }
}

export async function getProjectMembers(projectId: string): Promise<MemberData[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  })

  return members.map((m) => ({
    id: m.user.id,
    firstName: m.user.firstName,
    lastName: m.user.lastName,
    avatarUrl: m.user.avatarUrl,
  }))
}
