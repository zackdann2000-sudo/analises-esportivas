'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { LEAGUE_PRIORITY } from '@/lib/catalog'
import type { LeagueRef, Match } from '@/lib/types'
import { TeamLogo } from '../team-logo'
import { MatchRow } from './match-row'

export function groupByLeague(matches: Match[]) {
  const groups = new Map<number, { league: LeagueRef; matches: Match[] }>()
  for (const m of matches) {
    const g = groups.get(m.league.id) ?? { league: m.league, matches: [] }
    g.matches.push(m)
    groups.set(m.league.id, g)
  }
  const rank = (id: number) => {
    const i = LEAGUE_PRIORITY.indexOf(id)
    return i === -1 ? 999 : i
  }
  return [...groups.values()]
    .map((g) => ({ ...g, matches: g.matches.sort((a, b) => a.kickoff.localeCompare(b.kickoff)) }))
    .sort((a, b) => rank(a.league.id) - rank(b.league.id) || a.league.name.localeCompare(b.league.name))
}

export function LeagueHeader({ league }: { league: LeagueRef }) {
  return (
    <Link href={`/ligas/${league.id}`} className="flex items-center gap-2.5 bg-surface px-3 py-2 hover:bg-secondary">
      {league.flag ? (
        <TeamLogo src={league.flag} name={league.country} size={16} className="rounded-sm" />
      ) : (
        <TeamLogo src={league.logo} name={league.name} size={16} />
      )}
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{league.country}</span>
        <span className="truncate text-sm font-semibold">{league.name}</span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  )
}

export function MatchList({ matches, empty }: { matches: Match[]; empty?: React.ReactNode }) {
  const groups = groupByLeague(matches)
  if (!groups.length) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
        {empty ?? 'Nenhum jogo encontrado.'}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => (
        <section key={g.league.id} className="overflow-hidden rounded-xl border border-border bg-card" aria-label={g.league.name}>
          <LeagueHeader league={g.league} />
          <ul className="divide-y divide-border">
            {g.matches.map((m) => (
              <li key={m.id}>
                <MatchRow match={m} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export function MatchListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="h-11 animate-pulse bg-surface" />
          {[0, 1, 2].map((j) => (
            <div key={j} className="flex items-center gap-3 border-t border-border px-3 py-3">
              <div className="h-3 w-8 animate-pulse rounded bg-muted" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
