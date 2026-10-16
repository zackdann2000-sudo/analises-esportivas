'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { ArrowLeft, Building2, CalendarDays, Star, User } from 'lucide-react'
import { toast } from 'sonner'
import { fetcher, formatDate, formatTime } from '@/lib/format'
import { useFavorites } from '@/lib/stores'
import type { TeamDetail } from '@/lib/types'
import { cn } from '@/lib/utils'
import { FormBadge } from '../match/analysis-tab'
import { TeamLogo } from '../team-logo'

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg bg-surface p-3">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-display text-2xl font-bold tabular-nums">{value}</span>
    </div>
  )
}

export function TeamView({ id }: { id: string }) {
  const { data, error, isLoading } = useSWR<TeamDetail>(`/api/teams/${id}`, fetcher)
  const { isTeamFavorite, toggleTeam } = useFavorites()

  if (error) return <p className="m-4 rounded-xl bg-card p-8 text-center text-sm text-muted-foreground">Time não encontrado.</p>
  if (isLoading || !data)
    return (
      <div className="flex flex-col gap-3 p-2 lg:p-0">
        <div className="h-40 animate-pulse rounded-xl bg-card" />
        <div className="h-64 animate-pulse rounded-xl bg-card" />
      </div>
    )

  const fav = isTeamFavorite(data.team.id)
  const wins = data.form.filter((f) => f.result === 'V').length
  const draws = data.form.filter((f) => f.result === 'E').length
  const points = data.form.length ? Math.round(((wins * 3 + draws) / (data.form.length * 3)) * 100) : 0
  const a = data.averages

  return (
    <div className="flex flex-col gap-3 px-2 pt-2 lg:px-0 lg:pt-0">
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Link href="/" aria-label="Voltar" className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary lg:hidden">
            <ArrowLeft className="size-5" />
          </Link>
          {data.league && (
            <Link href={`/ligas/${data.league.id}`} className="text-xs text-muted-foreground hover:text-foreground">
              {data.country} · {data.league.name}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-surface p-2">
            <TeamLogo src={data.team.logo} name={data.team.name} size={60} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-bold leading-tight text-balance">{data.team.name}</h1>
            <div className="mt-1 flex gap-1">
              {data.form.slice(0, 5).map((f) => (
                <FormBadge key={f.matchId} result={f.result} />
              ))}
            </div>
          </div>
          <button
            type="button"
            aria-pressed={fav}
            onClick={() => {
              const added = toggleTeam(data.team)
              toast(added ? `Seguindo ${data.team.name}` : `Deixou de seguir ${data.team.name}`, {
                description: added ? 'Alertas de gols, escalação prevista e resultados ativados.' : undefined,
              })
            }}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold',
              fav ? 'bg-warning text-background' : 'bg-primary text-primary-foreground',
            )}
          >
            <Star className={cn('size-4', fav && 'fill-current')} />
            {fav ? 'Seguindo' : 'Seguir'}
          </button>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {data.coach && (
            <span className="flex items-center gap-1">
              <User className="size-3.5" /> {data.coach}
            </span>
          )}
          {data.venue && (
            <span className="flex items-center gap-1">
              <Building2 className="size-3.5" /> {data.venue}
            </span>
          )}
          {data.founded && (
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3.5" /> Fundado em {data.founded}
            </span>
          )}
        </div>
      </section>

      {a && (
        <section className="rounded-xl border border-border bg-card p-3">
          <h2 className="mb-3 font-display text-lg font-bold">Desempenho · últimos {data.form.length} jogos</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Aproveitamento" value={`${points}%`} />
            <Metric label="Gols marcados/j" value={a.goalsFor.toFixed(1)} />
            <Metric label="Gols sofridos/j" value={a.goalsAgainst.toFixed(1)} />
            <Metric label="Over 2.5" value={`${Math.round(a.over25Rate * 100)}%`} />
            <Metric label="Ambas marcam" value={`${Math.round(a.bttsRate * 100)}%`} />
            <Metric label="Sem sofrer gol" value={`${Math.round(a.cleanSheetRate * 100)}%`} />
            {a.corners != null && <Metric label="Escanteios/j" value={a.corners.toFixed(1)} />}
            {a.cards != null && <Metric label="Cartões/j" value={a.cards.toFixed(1)} />}
          </div>
        </section>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-3">
          <h2 className="mb-2 font-display text-lg font-bold">Últimos jogos</h2>
          <ul>
            {data.form.map((f) => (
              <li key={f.matchId}>
                <Link href={`/jogo/${f.matchId}`} className="flex items-center gap-2 border-b border-border py-2 text-sm last:border-0 hover:bg-secondary/50">
                  <span className="w-11 text-xs tabular-nums text-muted-foreground">{formatDate(f.date)}</span>
                  <span className="w-4 text-[10px] font-semibold text-muted-foreground">{f.home ? 'C' : 'F'}</span>
                  <TeamLogo src={f.opponent.logo} name={f.opponent.name} size={18} />
                  <span className="flex-1 truncate">{f.opponent.name}</span>
                  <span className="font-display font-bold tabular-nums">
                    {f.goalsFor}-{f.goalsAgainst}
                  </span>
                  <FormBadge result={f.result} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-border bg-card p-3">
          <h2 className="mb-2 font-display text-lg font-bold">Próximos jogos</h2>
          {data.upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sem jogos agendados.</p>
          ) : (
            <ul>
              {data.upcoming.map((m) => {
                const home = m.home.id === data.team.id
                const opp = home ? m.away : m.home
                return (
                  <li key={m.id}>
                    <Link href={`/jogo/${m.id}`} className="flex items-center gap-2 border-b border-border py-2 text-sm last:border-0 hover:bg-secondary/50">
                      <span className="w-16 text-xs leading-tight tabular-nums text-muted-foreground">
                        {formatDate(m.kickoff)}
                        <span className="block">{formatTime(m.kickoff)}</span>
                      </span>
                      <span className="w-4 text-[10px] font-semibold text-muted-foreground">{home ? 'C' : 'F'}</span>
                      <TeamLogo src={opp.logo} name={opp.name} size={18} />
                      <span className="flex-1 truncate">{opp.name}</span>
                      <span className="truncate text-[11px] text-muted-foreground">{m.league.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      {data.lineup && (
        <section className="rounded-xl border border-border bg-card p-3">
          <h2 className="font-display text-lg font-bold">Time provável · {data.lineup.formation}</h2>
          <p className="mb-2 text-xs text-muted-foreground">Baseado na última escalação titular.</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-6">
            {data.lineup.players.map((p) => (
              <li key={`${p.row}-${p.col}`} className="flex items-center gap-3 border-b border-border py-1.5 text-sm">
                <span className="w-6 text-right font-display font-bold tabular-nums text-muted-foreground">{p.number}</span>
                <span className="flex-1 truncate">{p.name}</span>
                <span className="rounded bg-secondary px-1.5 text-[10px] font-semibold text-muted-foreground">
                  {{ G: 'GOL', D: 'DEF', M: 'MEI', F: 'ATA' }[p.pos]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
