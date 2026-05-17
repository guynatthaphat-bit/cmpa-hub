import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY

const EASTERN_PROVINCES = [
  'ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'ฉะเชิงเทรา', 'ปราจีนบุรี', 'สระแก้ว',
]

interface PlacesResult {
  name: string
  province: string
  address: string
  phone?: string
  website?: string
  source: string
  rawData: object
}

async function searchGooglePlaces(
  keyword: string,
  province: string,
): Promise<PlacesResult[]> {
  if (!GOOGLE_PLACES_KEY) return getMockResults(keyword, province)

  const query = `${keyword} ${province} ประเทศไทย`
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_KEY}&language=th`

  const resp = await fetch(url)
  if (!resp.ok) return getMockResults(keyword, province)

  const data = await resp.json() as { results?: Array<{ name: string; formatted_address?: string; formatted_phone_number?: string; website?: string }> }
  return (data.results ?? []).slice(0, 10).map((r) => ({
    name: r.name,
    province,
    address: r.formatted_address ?? '',
    phone: r.formatted_phone_number,
    website: r.website,
    source: 'google_places',
    rawData: r,
  }))
}

function getMockResults(keyword: string, province: string): PlacesResult[] {
  return Array.from({ length: 5 }, (_, i) => ({
    name: `${keyword} ${province} ตัวอย่างที่ ${i + 1}`,
    province,
    address: `${i + 10} ถ.ตัวอย่าง ต.ทดสอบ อ.เมือง จ.${province}`,
    phone: `03${i}${i + 1}-${i + 2}${i + 3}${i + 4}${i + 5}-${i + 6}${i + 7}${i + 8}${i + 9}`,
    source: 'mock',
    rawData: { mock: true },
  }))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { keyword, provinces = EASTERN_PROVINCES, sources = ['google_places'] } = await req.json() as {
    keyword?: string
    provinces?: string[]
    sources?: string[]
  }

  if (!keyword) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

  const results: PlacesResult[] = []
  for (const province of provinces.slice(0, 3)) {
    if (sources.includes('google_places')) {
      const found = await searchGooglePlaces(keyword, province)
      results.push(...found)
    }
  }

  const isMock = !GOOGLE_PLACES_KEY
  return NextResponse.json({ results, total: results.length, isMock })
}
