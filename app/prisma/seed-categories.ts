import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_CATEGORIES = [
  {
    nameTh: 'วัด / ศาสนสถาน',
    icon: '🏯',
    color: '#f59e0b',
    searchKeywords: ['วัด', 'ศาสนสถาน', 'โบสถ์', 'มัสยิด'],
    sources: { google: 'place_of_worship', dhammasathan: true },
  },
  {
    nameTh: 'บริษัท EEC',
    icon: '🏭',
    color: '#3b82f6',
    searchKeywords: ['บริษัท', 'โรงงาน', 'นิคมอุตสาหกรรม', 'EEC'],
    sources: { google: 'establishment', dbd: true },
  },
  {
    nameTh: 'ห้างสรรพสินค้า',
    icon: '🏬',
    color: '#ec4899',
    searchKeywords: ['ห้าง', 'ซูเปอร์มาร์เก็ต', 'โลตัส', 'บิ๊กซี'],
    sources: { google: 'shopping_mall' },
  },
  {
    nameTh: 'หน่วยงานรัฐ',
    icon: '🏛️',
    color: '#8b5cf6',
    searchKeywords: ['อำเภอ', 'เทศบาล', 'อบต', 'สาธารณสุข', 'พัฒนาสังคม'],
    sources: { google: 'government' },
  },
  {
    nameTh: 'มูลนิธิ / สมาคม',
    icon: '🤝',
    color: '#10b981',
    searchKeywords: ['มูลนิธิ', 'สมาคม', 'องค์กร', 'NGO'],
    sources: { google: 'establishment' },
  },
  {
    nameTh: 'โรงแรม / รีสอร์ท',
    icon: '🏨',
    color: '#f97316',
    searchKeywords: ['โรงแรม', 'รีสอร์ท', 'เกสต์เฮาส์'],
    sources: { google: 'lodging' },
  },
]

async function main() {
  const existing = await prisma.targetCategory.count()
  if (existing > 0) {
    console.log(`ℹ️  ${existing} categories already exist — skipping`)
    return
  }
  await prisma.targetCategory.createMany({ data: DEFAULT_CATEGORIES })
  console.log('✅ seeded 6 default categories')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
