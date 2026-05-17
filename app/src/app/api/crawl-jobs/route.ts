import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const jobs = await prisma.crawlJob.findMany({
    where: { createdById: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { category: { select: { nameTh: true } } },
  })
  return NextResponse.json(jobs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { categoryId, provinces, sources } = await req.json() as {
    categoryId?: string
    provinces: string[]
    sources: string[]
  }

  const job = await prisma.crawlJob.create({
    data: {
      categoryId,
      provinces,
      sources,
      status: 'PENDING',
      createdById: session.user.id,
    },
  })

  // Kick off async processing (fire-and-forget)
  void runCrawlJob(job.id, { categoryId, provinces, sources })

  return NextResponse.json(job, { status: 201 })
}

async function runCrawlJob(
  jobId: string,
  opts: { categoryId?: string; provinces: string[]; sources: string[] },
) {
  await prisma.crawlJob.update({
    where: { id: jobId },
    data: { status: 'RUNNING', startedAt: new Date(), total: opts.provinces.length },
  })

  let resultCount = 0
  for (let i = 0; i < opts.provinces.length; i++) {
    await new Promise((r) => setTimeout(r, 600)) // simulate work

    // In real use: call search API here and upsert targets
    resultCount += Math.floor(Math.random() * 8) + 2

    await prisma.crawlJob.update({
      where: { id: jobId },
      data: { progress: i + 1, resultCount },
    })
  }

  await prisma.crawlJob.update({
    where: { id: jobId },
    data: { status: 'DONE', completedAt: new Date(), resultCount },
  })
}
