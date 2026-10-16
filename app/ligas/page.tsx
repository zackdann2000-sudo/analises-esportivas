import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { TeamLogo } from '@/components/team-logo'
import { LEAGUES, TEAMS } from '@/lib/catalog'

export const metadata: Metadata = { title: 'Ligas e campeonatos' }

export default function LeaguesPage() {
  return (
    <div className="flex flex-col gap-3 px-2 pt-3 lg:px-0 lg:pt-0">
      <h1 className="px-2 font-display text-2xl font-bold lg:px-0">Ligas e campeonatos</h1>
      <ul className="overflow-hidden rounded-xl border border-border bg-card">
        {Object.values(LEAGUES).map((l) => {
          const teams = l.id === 2 ? TEAMS.filter((t) => t.league !== 71) : TEAMS.filter((t) => t.league === l.id)
          return (
            <li key={l.id} className="border-b border-border last:border-0">
              <Link href={`/ligas/${l.id}`} className="flex items-center gap-3 px-3 py-3 hover:bg-secondary/60">
                <span className="flex size-10 items-center justify-center rounded-lg bg-surface">
                  <TeamLogo src={l.logo} name={l.name} size={28} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{l.name}</span>
                  <span className="block text-xs text-muted-foreground">{l.country}</span>
                </span>
                <span className="hidden -space-x-1.5 sm:flex">
                  {teams.slice(0, 5).map((t) => (
                    <span key={t.id} className="flex size-6 items-center justify-center rounded-full border border-card bg-surface">
                      <TeamLogo src={`https://media.api-sports.io/football/teams/${t.id}.png`} name={t.name} size={16} />
                    </span>
                  ))}
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          )
        })}
      </ul>
      <h2 className="px-2 pt-2 font-display text-lg font-bold lg:px-0">Times populares</h2>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {TEAMS.map((t) => (
          <li key={t.id}>
            <Link href={`/time/${t.id}`} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center hover:border-primary/50">
              <TeamLogo src={`https://media.api-sports.io/football/teams/${t.id}.png`} name={t.name} size={36} />
              <span className="line-clamp-1 text-xs font-semibold">{t.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
