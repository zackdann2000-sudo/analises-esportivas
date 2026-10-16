'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { fetcher } from '@/lib/format'
import type { LeagueDetail } from '@/lib/types'
import { cn } from '@/lib/utils'
import { FormBadge } from '../match/analysis-tab'
import { MatchList } from '../matches/match-list'
import { TeamLogo } from '../team-logo'

export function LeagueView({ id }: { id: string }) {
  const [tab, setTab] = useState<'tabela' | 'jogos'>('tabela')
  const { data, error, isLoading } = useSWR<LeagueDetail>(`/api/leagues/${id}`, fetcher, { refreshInterval: 60_000 })

  if (error) return <p className="m-4 rounded-xl bg-card p-8 text-center text-sm text-muted-foreground">Liga indisponível.</p>
  if (isLoading || !data) return <div className="m-2 h-96 animate-pulse rounded-xl bg-card lg:m-0" />

  const size = data.standings.length
  return (
    <div className="flex flex-col gap-3 px-2 pt-2 lg:px-0 lg:pt-0">
      <section className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <span className="flex size-14 items-center justify-center rounded-xl bg-surface">
          <TeamLogo src={data.league.logo} name={data.league.name} size={40} />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{data.league.country}</p>
          <h1 className="font-display text-2xl font-bold">{data.league.name}</h1>
        </div>
      </section>
      <div role="tablist" className="flex gap-1 rounded-xl border border-border bg-card p-1">
        {(['tabela', 'jogos'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-semibold capitalize',
              tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
            )}
          >
            {t === 'tabela' ? 'Classificação' : 'Jogos'}
          </button>
        ))}
      </div>
      {tab === 'tabela' ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="w-8 py-2 pl-3 text-left font-semibold">#</th>
                <th className="py-2 text-left font-semibold">Time</th>
                <th className="px-1.5 py-2 font-semibold">J</th>
                <th className="px-1.5 py-2 font-semibold">V</th>
                <th className="px-1.5 py-2 font-semibold">E</th>
                <th className="px-1.5 py-2 font-semibold">D</th>
                <th className="hidden px-1.5 py-2 font-semibold sm:table-cell">Gols</th>
                <th className="px-1.5 py-2 font-semibold">SG</th>
                <th className="px-2 py-2 font-semibold">Pts</th>
                <th className="hidden py-2 pr-3 font-semibold md:table-cell">Forma</th>
              </tr>
            </thead>
            <tbody>
              {data.standings.map((r) => {
                const top = r.rank <= Math.max(1, Math.round(size * 0.2))
                const bottom = r.rank > size - Math.max(1, Math.round(size * 0.2))
                return (
                  <tr key={r.team.id} className="border-b border-border last:border-0">
                    <td className="py-2 pl-3">
                      <span
                        className={cn(
                          'flex size-6 items-center justify-center rounded-md font-display text-xs font-bold',
                          top && 'bg-primary text-primary-foreground',
                          bottom && 'bg-live text-live-foreground',
                        )}
                      >
                        {r.rank}
                      </span>
                    </td>
                    <td className="py-2">
                      <Link href={`/time/${r.team.id}`} className="flex items-center gap-2 hover:underline">
                        <TeamLogo src={r.team.logo} name={r.team.name} size={18} />
                        <span className="max-w-32 truncate font-medium sm:max-w-none">{r.team.name}</span>
                      </Link>
                    </td>
                    <td className="px-1.5 text-center tabular-nums">{r.played}</td>
                    <td className="px-1.5 text-center tabular-nums">{r.win}</td>
                    <td className="px-1.5 text-center tabular-nums">{r.draw}</td>
                    <td className="px-1.5 text-center tabular-nums">{r.lose}</td>
                    <td className="hidden px-1.5 text-center tabular-nums sm:table-cell">
                      {r.goalsFor}:{r.goalsAgainst}
                    </td>
                    <td className="px-1.5 text-center tabular-nums">{r.goalsFor - r.goalsAgainst}</td>
                    <td className="px-2 text-center font-display font-bold tabular-nums">{r.points}</td>
                    <td className="hidden py-2 pr-3 md:table-cell">
                      <span className="flex justify-center gap-0.5">
                        {r.form.map((f, i) => (
                          <FormBadge key={i} result={f} />
                        ))}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <MatchList matches={data.matches} empty="Sem jogos próximos." />
      )}
    </div>
  )
}
