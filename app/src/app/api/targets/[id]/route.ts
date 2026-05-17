import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const target = await prisma.target.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      outreachLogs: {
        orderBy: { sentAt: 'desc' },
        include: { createdBy: { select: { firstName: true, lastName: true } } },
      },
    },
  })
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(target)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const target = await prisma.target.update({ where: { id: params.id }, data: body })
  return NextResponse.json(target)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.target.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
