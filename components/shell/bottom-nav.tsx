'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import { CalendarDays, Lightbulb, Menu, Radar, Star } from 'lucide-react'
import { fetcher } from '@/lib/format'
import type { MatchesResponse } from '@/lib/types'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/', label: 'Jogos', icon: CalendarDays },
  { href: '/ao-vivo', label: 'Ao vivo', icon: Radar },
  { href: '/dicas', label: 'Dicas', icon: Lightbulb },
  { href: '/favoritos', label: 'Favoritos', icon: Star },
  { href: '/mais', label: 'Mais', icon: Menu },
]

export function BottomNav() {
  const pathname = usePathname()
  const { data } = useSWR<MatchesResponse>('/api/matches?live=1', fetcher, { refreshInterval: 20_000 })
  const liveCount = data?.matches.length ?? 0

  return (
    <nav
      aria-label="Navegação"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <span className="relative">
                  <Icon className="size-6" strokeWidth={active ? 2.4 : 1.8} />
                  {href === '/ao-vivo' && liveCount > 0 && (
                    <span className="absolute -right-2.5 -top-1 rounded-full bg-live px-1 text-[10px] font-bold leading-4 text-live-foreground">
                      {liveCount}
                    </span>
                  )}
                </span>
                {label}
                {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-primary" />}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
