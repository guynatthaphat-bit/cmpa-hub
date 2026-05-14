import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const metadata = { title: 'ข้อกำหนดการใช้งาน' }

export default async function TermsPage() {
  const t = await getTranslations('Settings')

  return (
    <div className="flex flex-col gap-4 px-4 py-3 animate-fade-in">
      <header className="flex items-center gap-2">
        <Link
          href="/settings/about"
          className="-ml-2 flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary focus-ring"
          aria-label="กลับ"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-display text-xl font-bold tracking-tight">{t('aboutTerms')}</h1>
      </header>

      <article className="surface-card flex flex-col gap-4 p-5 text-sm leading-relaxed">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          ปรับปรุงล่าสุด: 12 พฤษภาคม 2569
        </p>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">1. การใช้งาน</h2>
          <p className="text-muted-foreground">
            CMPA Hub เป็นระบบจัดการภายในของสมาคม สงวนสิทธิ์ให้ใช้งานเฉพาะบุคลากรที่ได้รับ
            อนุญาตจากผู้ดูแลระบบเท่านั้น
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">2. การรักษาความปลอดภัยของบัญชี</h2>
          <p className="text-muted-foreground">
            ผู้ใช้ต้องเก็บรหัสผ่านเป็นความลับ ไม่เปิดเผยให้ผู้อื่น และต้องเปลี่ยนรหัสผ่าน
            ทันทีเมื่อสงสัยว่าถูกล่วงรู้
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">3. การใช้งานที่ไม่อนุญาต</h2>
          <p className="text-muted-foreground">
            ห้ามใช้ระบบเพื่อกิจกรรมที่ผิดกฎหมาย ละเมิดสิทธิ์ผู้อื่น หรือพยายามเข้าถึง
            ข้อมูลของผู้ใช้คนอื่นโดยไม่ได้รับอนุญาต
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">4. การยกเลิกสิทธิ์</h2>
          <p className="text-muted-foreground">
            สมาคมขอสงวนสิทธิ์ในการยกเลิกการเข้าถึงระบบของผู้ใช้ที่ละเมิดข้อกำหนด
          </p>
        </section>
      </article>
    </div>
  )
}
