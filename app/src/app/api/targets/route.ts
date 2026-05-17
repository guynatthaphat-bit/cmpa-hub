import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'
import type { TargetStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const categoryId = searchParams.get('categoryId') ?? undefined
  const province = searchParams.get('province') ?? undefined
  const status = (searchParams.get('status') as TargetStatus) ?? undefined
  const search = searchParams.get('search') ?? undefined
  const page = Number(searchParams.get('page') ?? 0)
  const exportFmt = searchParams.get('export')

  const where = {
    ...(categoryId ? { categoryId } : {}),
    ...(province ? { province } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { contactPerson: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  if (exportFmt === 'xlsx') {
    const targets = await prisma.target.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
      include: { category: { select: { nameTh: true } } },
    })

    const rows = targets.map((t) => ({
      ชื่อองค์กร: t.name,
      หมวดหมู่: t.category?.nameTh ?? '',
      จังหวัด: t.province ?? '',
      อำเภอ: t.district ?? '',
      ที่อยู่: t.address ?? '',
      โทรศัพท์: t.phone ?? '',
      อีเมล: t.email ?? '',
      เว็บไซต์: t.website ?? '',
      ผู้ติดต่อ: t.contactPerson ?? '',
      ตำแหน่ง: t.contactTitle ?? '',
      สถานะ: t.status,
      ลำดับความสำคัญ: t.priority === 1 ? 'สูง' : t.priority === 2 ? 'กลาง' : 'ต่ำ',
      หมายเหตุ: t.notes ?? '',
      แหล่งข้อมูล: t.source ?? '',
      วันที่สร้าง: t.createdAt.toLocaleDateString('th-TH'),
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'เป้าหมาย')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="targets-${Date.now()}.xlsx"`,
      },
    })
  }

  const [items, total] = await Promise.all([
    prisma.target.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
      take: 25,
      skip: page * 25,
      include: { category: { select: { id: true, nameTh: true, icon: true, color: true } } },
    }),
    prisma.target.count({ where }),
  ])

  return NextResponse.json({ items, total, page })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const target = await prisma.target.create({
    data: { ...body, createdById: session.user.id },
  })

  return NextResponse.json(target, { status: 201 })
}
