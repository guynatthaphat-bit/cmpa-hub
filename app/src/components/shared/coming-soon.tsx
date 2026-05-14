import { type LucideIcon } from 'lucide-react'

interface ComingSoonProps {
  icon: LucideIcon
  title: string
  description: string
  phase: number
  features: string[]
}

export function ComingSoon({ icon: Icon, title, description, phase, features }: ComingSoonProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-6 px-6 py-12 text-center animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-full bg-primary/10 blur-2xl" />
        <div className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg">
          <Icon className="size-9" strokeWidth={1.5} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Phase {phase}
        </span>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="surface-card w-full p-5 text-left">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ฟีเจอร์ที่จะพร้อมใช้
        </p>
        <ul className="space-y-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        เร็วๆ นี้ — ทยอยปล่อยตามแผน 5 phases
      </p>
    </div>
  )
}
