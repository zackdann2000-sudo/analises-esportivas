import Image from 'next/image'
import { Activity, BellRing, Shirt } from 'lucide-react'

const PERKS = [
  { icon: Activity, text: 'Radar de pressão e chances de gol ao vivo' },
  { icon: BellRing, text: 'Alertas de gols, escanteios, cartões e pênaltis' },
  { icon: Shirt, text: 'Escalações previstas e análise de cada time' },
]

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:grid lg:min-h-[calc(100dvh-6rem)] lg:grid-cols-2 lg:overflow-hidden lg:rounded-xl lg:border lg:border-border">
      <section className="relative h-40 overflow-hidden lg:h-auto">
        <Image src="/banners/estadio.png" alt="" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent lg:bg-gradient-to-r lg:from-background/95 lg:via-background/60" />
        <ul className="relative hidden h-full flex-col justify-end gap-3 p-8 lg:flex">
          {PERKS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm font-medium">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Icon className="size-4" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </section>
      <section className="relative -mt-10 flex flex-col justify-center px-4 lg:mt-0 lg:bg-card lg:px-12">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6 rounded-xl border border-border bg-card p-5 lg:border-0 lg:p-0">
          <header className="flex flex-col gap-1">
            <h1 className="font-display text-3xl font-bold text-balance">{title}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{subtitle}</p>
          </header>
          {children}
        </div>
      </section>
    </div>
  )
}
