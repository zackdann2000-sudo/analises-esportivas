'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Radar, SlidersHorizontal } from 'lucide-react'
import { liveSignals } from '@/lib/analysis'
import { fetcher, statusLabel } from '@/lib/format'
import type { Match, MatchesResponse } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PressureChart } from '../match/stats-tab'
import { TeamLogo } from '../team-logo'

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'pressure', label: 'Pressão alta' },
  { id: 'ht', label: 'Over 0.5 HT' },
  { id: 'late', label: 'Gol tardio' },
  { id: 'corners', label: 'Escanteios' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

function Stat({ label, h, a }: { label: string; h: string | number; a: string | number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-display text-sm font-bold tabular-nums">
        <span className="text-primary">{h}</span>
        <span className="px-0.5 text-muted-foreground">:</span>
        <span className="text-live">{a}</span>
      </span>
    </div>
  )
}

function RadarCard({ match }: { match: Match }) {
  const s = liveSignals(match)
  const st = match.stats
  return (
    <Link href={`/jogo/${match.id}`} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/50">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <TeamLogo src={match.league.logo} name={match.league.name} size={14} />
        <span className="flex-1 truncate">{match.league.name}</span>
        <span className="flex items-center gap-1 font-bold text-live">
          <span className="size-1.5 animate-live rounded-full bg-live" />
          {statusLabel(match)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <TeamLogo src={match.home.logo} name={match.home.name} size={24} />
          <span className="truncate text-sm font-semibold">{match.home.name}</span>
        </span>
        <span className="rounded-md bg-secondary px-2 py-0.5 font-display text-lg font-bold tabular-nums">
          {match.score.home} - {match.score.away}
        </span>
        <span className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2 text-right">
          <TeamLogo src={match.away.logo} name={match.away.name} size={24} />
          <span className="truncate text-sm font-semibold">{match.away.name}</span>
        </span>
      </div>

      {s && (
        <div className="flex flex-col gap-1">
          <div className="flex h-2 overflow-hidden rounded-full">
            <div className="bg-primary transition-all duration-700" style={{ width: `${s.pressureHome}%` }} />
            <div className="bg-live transition-all duration-700" style={{ width: `${s.pressureAway}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-semibold tabular-nums text-muted-foreground">
            <span>Pressão {s.pressureHome}%</span>
            <span>{s.pressureAway}%</span>
          </div>
        </div>
      )}

      {match.pressure && <PressureChart match={match} height={56} />}

      {st && s && (
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-surface py-2 sm:grid-cols-6">
          {s.appmHome != null && <Stat label="APPM" h={s.appmHome.toFixed(1)} a={(s.appmAway ?? 0).toFixed(1)} />}
          <Stat label="CG" h={s.cgHome} a={s.cgAway} />
          <Stat label="Chutes" h={st.home.shots} a={st.away.shots} />
          <Stat label="No gol" h={st.home.shotsOnTarget} a={st.away.shotsOnTarget} />
          <Stat label="Escant." h={st.home.corners} a={st.away.corners} />
          <Stat label="Cartões" h={st.home.yellow + st.home.red} a={st.away.yellow + st.away.red} />
          <Stat label="Posse" h={st.home.possession} a={st.away.possession} />
          <Stat label="Faltas" h={st.home.fouls} a={st.away.fouls} />
          {st.home.xg != null && <Stat label="xG" h={st.home.xg.toFixed(1)} a={(st.away.xg ?? 0).toFixed(1)} />}
          <Stat label="Imped." h={st.home.offsides} a={st.away.offsides} />
        </div>
      )}

      {s && s.alerts.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {s.alerts.map((a) => (
            <li
              key={a.label}
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                a.tone === 'live' && 'bg-live text-live-foreground',
                a.tone === 'green' && 'bg-success text-success-foreground',
                a.tone === 'blue' && 'bg-primary text-primary-foreground',
              )}
            >
              {a.label}
            </li>
          ))}
        </ul>
      )}
    </Link>
  )
}

export function LiveRadar() {
  const [filter, setFilter] = useState<FilterId>('all')
  const { data, isLoading } = useSWR<MatchesResponse>('/api/matches?live=1', fetcher, { refreshInterval: 15_000 })

  const list = useMemo(() => {
    const all = (data?.matches ?? []).map((m) => ({ m, s: liveSignals(m) }))
    const by = (label: string) => all.filter(({ s }) => s?.alerts.some((a) => a.label.startsWith(label)))
    let res = all
    if (filter === 'pressure') res = by('Pressão forte')
    if (filter === 'ht') res = by('Over 0.5 HT')
    if (filter === 'late') res = by('Gol tardio')
    if (filter === 'corners') res = by('Ritmo alto')
    return res
      .sort((a, b) => Math.max(b.s?.pressureHome ?? 0, b.s?.pressureAway ?? 0) - Math.max(a.s?.pressureHome ?? 0, a.s?.pressureAway ?? 0))
      .map(({ m }) => m)
  }, [data, filter])

  return (
    <div className="flex flex-col gap-3 px-2 pt-3 lg:px-0 lg:pt-0">
      <header className="flex items-end justify-between gap-3 px-2 lg:px-0">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Radar className="size-6 text-live" /> Radar ao vivo
          </h1>
          <p className="text-sm text-muted-foreground">Pressão, APPM e chances de gol atualizados a cada 15s.</p>
        </div>
        <Link href="/alertas" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card" aria-label="Configurar alertas">
          <SlidersHorizontal className="size-4" />
        </Link>
      </header>
      <div role="tablist" aria-label="Filtros do radar" className="no-scrollbar flex gap-1.5 overflow-x-auto px-2 lg:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            type="button"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold',
              filter === f.id ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-muted-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-14 text-center">
          <p className="font-semibold">Nenhum jogo ao vivo neste filtro</p>
          <p className="mt-1 text-sm text-muted-foreground">Veja os próximos jogos na aba Jogos.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((m) => (
            <RadarCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  )
}
