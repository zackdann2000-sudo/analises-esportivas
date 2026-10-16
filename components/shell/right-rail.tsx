import Image from 'next/image'
import Link from 'next/link'
import { Crown } from 'lucide-react'
import { DataSourceBadge } from '../data-source-badge'

export function RightRail() {
  return (
    <aside className="sticky top-18 hidden h-fit w-72 shrink-0 flex-col gap-4 xl:flex">
      <Link href="/vip" className="group relative block overflow-hidden rounded-xl border border-border">
        <Image src="/banners/vip.png" alt="" width={576} height={720} className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background via-background/70 to-transparent p-4">
          <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-xs font-bold text-background">
            <Crown className="size-3" /> VIP
          </span>
          <p className="font-display text-2xl font-bold leading-tight text-foreground text-balance">
            Radar completo, alertas ilimitados e todas as dicas
          </p>
          <p className="mt-1 text-sm text-muted-foreground">A partir de R$ 19,90/mês</p>
        </div>
      </Link>
      <DataSourceBadge />
    </aside>
  )
}
