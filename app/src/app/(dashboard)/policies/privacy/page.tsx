import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const metadata = { title: 'นโยบายความเป็นส่วนตัว' }

export default async function PrivacyPolicyPage() {
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
        <h1 className="font-display text-xl font-bold tracking-tight">
          {t('aboutPrivacyPolicy')}
        </h1>
      </header>

      <article className="surface-card prose-sm flex flex-col gap-4 p-5 leading-relaxed text-sm">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          ปรับปรุงล่าสุด: 12 พฤษภาคม 2569
        </p>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">1. ข้อมูลที่เราเก็บรวบรวม</h2>
          <p className="text-muted-foreground">
            CMPA Hub เก็บข้อมูลส่วนบุคคลของผู้ใช้งานประกอบด้วย ชื่อ-นามสกุล อีเมล รหัสบุคลากร
            หมายเลขโทรศัพท์ ตำแหน่ง รวมถึงข้อมูลการใช้งานระบบ เช่น เวลาเข้าสู่ระบบ
            IP address และข้อมูลกิจกรรมต่างๆ ในระบบ
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">2. วัตถุประสงค์การใช้ข้อมูล</h2>
          <p className="text-muted-foreground">
            เพื่อจัดการบุคลากร การลงเวลา การลางาน การติดตามโครงการ และเอกสาร
            ภายในสมาคมสร้างเสริมอาชีพคนพิการภาคตะวันออก
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">3. สิทธิ์ของเจ้าของข้อมูล</h2>
          <p className="text-muted-foreground">
            ผู้ใช้งานมีสิทธิ์ตามที่กฎหมายกำหนด ได้แก่ สิทธิ์ในการเข้าถึง ขอสำเนา แก้ไข
            คัดค้าน ระงับการใช้งาน และลบข้อมูลส่วนบุคคล โดยติดต่อผู้ดูแลระบบหรือใช้เมนู
            "ความเป็นส่วนตัว (PDPA)" ในหน้าตั้งค่า
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">4. ระยะเวลาการเก็บข้อมูล</h2>
          <p className="text-muted-foreground">
            ข้อมูลส่วนบุคคลจะถูกเก็บไว้ตลอดระยะเวลาที่ท่านยังเป็นบุคลากรของสมาคม และเก็บต่อ
            10 ปี หลังจากนั้นเพื่อการตรวจสอบและภาระผูกพันทางกฎหมาย
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">5. การรักษาความปลอดภัย</h2>
          <p className="text-muted-foreground">
            ข้อมูลถูกเข้ารหัสระหว่างการรับส่ง (TLS) รหัสผ่านถูกแฮชด้วย bcrypt
            ทุกการเข้าถึงและการเปลี่ยนแปลงข้อมูลจะถูกบันทึก
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">6. ติดต่อเจ้าหน้าที่คุ้มครองข้อมูล</h2>
          <p className="text-muted-foreground">
            หากมีข้อสงสัยโปรดติดต่อผู้ดูแลระบบของสมาคม
          </p>
        </section>
      </article>
    </div>
  )
}
