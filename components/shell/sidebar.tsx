'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LEAGUES } from '@/lib/catalog'
import { useFavorites } from '@/lib/stores'
import { cn } from '@/lib/utils'
import { TeamLogo } from '../team-logo'

export function Sidebar() {
  const pathname = usePathname()
  const { favorites } = useFavorites()
  return (
    <aside className="sticky top-18 hidden h-[calc(100dvh-5.5rem)] w-60 shrink-0 flex-col gap-4 overflow-y-auto lg:flex">
      <section className="rounded-xl border border-border bg-card p-2">
        <h2 className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ligas principais</h2>
        <ul>
          {Object.values(LEAGUES).map((l) => (
            <li key={l.id}>
              <Link
                href={`/ligas/${l.id}`}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-secondary',
                  pathname === `/ligas/${l.id}` && 'bg-accent text-accent-foreground',
                )}
              >
                <span className="flex size-6 items-center justify-center rounded-md bg-surface">
                  <TeamLogo src={l.logo} name={l.name} size={18} />
                </span>
                <span className="truncate">{l.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border border-border bg-card p-2">
        <h2 className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meus times</h2>
        {favorites.teams.length === 0 ? (
          <p className="px-2 py-2 text-xs leading-relaxed text-muted-foreground">
            Toque na estrela de um time para acompanhar e receber alertas.
          </p>
        ) : (
          <ul>
            {favorites.teams.map((t) => (
              <li key={t.id}>
                <Link href={`/time/${t.id}`} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-secondary">
                  <TeamLogo src={t.logo} name={t.name} size={20} />
                  <span className="truncate">{t.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  )
}
