import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const BANNERS = [
  {
    href: '/ao-vivo',
    image: '/banners/estadio.png',
    tag: 'Ao vivo',
    title: 'Radar de pressão em tempo real',
    text: 'Ataques perigosos, chutes e escanteios minuto a minuto.',
  },
  {
    href: '/dicas',
    image: '/banners/analise.png',
    tag: 'Análise',
    title: 'Oportunidades do dia',
    text: 'Probabilidades por modelo estatístico para cada jogo.',
  },
  {
    href: '/vip',
    image: '/banners/vip.png',
    tag: 'VIP',
    title: 'Teste grátis por 1 dia',
    text: 'Cadastre-se com Gmail e libere tudo.',
  },
]

export function BannerCarousel() {
  return (
    <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 lg:px-0">
      {BANNERS.map((b, i) => (
        <Link
          key={b.href}
          href={b.href}
          className="group relative aspect-[16/7] w-[85%] shrink-0 snap-center overflow-hidden rounded-xl sm:w-[48%] lg:aspect-[16/6]"
        >
          <Image
            src={b.image}
            alt=""
            fill
            priority={i === 0}
            sizes="(max-width: 640px) 85vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background/95 via-background/40 to-transparent p-4">
            <span className="mb-1.5 w-fit rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              {b.tag}
            </span>
            <p className="font-display text-xl font-bold leading-tight text-foreground">{b.title}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {b.text} <ArrowRight className="size-3" />
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
