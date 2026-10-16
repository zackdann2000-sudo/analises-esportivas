'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Search } from 'lucide-react'
import { LEAGUES, TEAMS, teamLogo } from '@/lib/catalog'
import { fetcher, todayKeyClient } from '@/lib/format'
import type { MatchesResponse, TeamRef } from '@/lib/types'
import { TeamLogo } from './team-logo'

const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function SearchView() {
  const [q, setQ] = useState('')
  const { data } = useSWR<MatchesResponse>(`/api/matches?date=${todayKeyClient()}`, fetcher)

  const teams = useMemo(() => {
    const map = new Map<number, TeamRef>()
    TEAMS.forEach((t) => map.set(t.id, { id: t.id, name: t.name, short: t.short, logo: teamLogo(t.id) }))
    data?.matches.forEach((m) => {
      map.set(m.home.id, m.home)
      map.set(m.away.id, m.away)
    })
    return [...map.values()]
  }, [data])

  const term = normalize(q.trim())
  const teamResults = term ? teams.filter((t) => normalize(t.name).includes(term)).slice(0, 30) : []
  const leagueResults = term
    ? Object.values(LEAGUES).filter((l) => normalize(l.name).includes(term) || normalize(l.country).includes(term))
    : []

  return (
    <div className="flex flex-col gap-3 px-2 pt-3 lg:px-0 lg:pt-0">
      <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
        <Search className="size-5 text-muted-foreground" />
        <span className="sr-only">Buscar times e ligas</span>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar times, ligas, países…"
          className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </label>
      {!term && <p className="px-2 text-sm text-muted-foreground">Digite o nome de um time ou campeonato.</p>}
      {leagueResults.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-border bg-card">
          {leagueResults.map((l) => (
            <li key={l.id} className="border-b border-border last:border-0">
              <Link href={`/ligas/${l.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/60">
                <TeamLogo src={l.logo} name={l.name} size={24} />
                <span className="flex-1 font-medium">{l.name}</span>
                <span className="text-xs text-muted-foreground">{l.country}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {teamResults.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-border bg-card">
          {teamResults.map((t) => (
            <li key={t.id} className="border-b border-border last:border-0">
              <Link href={`/time/${t.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/60">
                <TeamLogo src={t.logo} name={t.name} size={24} />
                <span className="flex-1 font-medium">{t.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {term && !teamResults.length && !leagueResults.length && (
        <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Nada encontrado para “{q}”.</p>
      )}
    </div>
  )
}
