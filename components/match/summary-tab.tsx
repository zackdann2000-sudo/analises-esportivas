'use client'

import { ArrowLeftRight, CircleDot, CircleOff, Goal, MapPin, MonitorPlay, User } from 'lucide-react'
import type { MatchDetail, MatchEvent } from '@/lib/types'
import { cn } from '@/lib/utils'
import { InsightCard } from './insight-card'
import { QuickStats } from './stats-tab'

function EventIcon({ type }: { type: MatchEvent['type'] }) {
  switch (type) {
    case 'goal':
    case 'own_goal':
      return <Goal className={cn('size-4', type === 'own_goal' ? 'text-live' : 'text-success')} />
    case 'penalty_goal':
      return <CircleDot className="size-4 text-success" />
    case 'penalty_missed':
      return <CircleOff className="size-4 text-live" />
    case 'yellow':
      return <span className="block h-4 w-3 rounded-[2px] bg-warning" />
    case 'red':
      return <span className="block h-4 w-3 rounded-[2px] bg-live" />
    case 'sub':
      return <ArrowLeftRight className="size-4 text-primary" />
    case 'var':
      return <MonitorPlay className="size-4 text-muted-foreground" />
  }
}

const LABEL: Record<MatchEvent['type'], string> = {
  goal: 'Gol',
  own_goal: 'Gol contra',
  penalty_goal: 'Gol de pênalti',
  penalty_missed: 'Pênalti perdido',
  yellow: 'Cartão amarelo',
  red: 'Cartão vermelho',
  sub: 'Substituição',
  var: 'VAR',
}

function Timeline({ match }: { match: MatchDetail }) {
  const events = [...match.events].sort((a, b) => b.minute - a.minute || (b.extra ?? 0) - (a.extra ?? 0))
  if (!events.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {match.status === 'NS' ? 'O jogo ainda não começou.' : 'Nenhum lance importante até agora.'}
      </p>
    )
  }
  return (
    <ol className="flex flex-col">
      {events.map((e) => {
        const home = e.teamId === match.home.id
        const content = (
          <span className={cn('flex min-w-0 items-center gap-2', home ? 'flex-row-reverse text-right' : '')}>
            <EventIcon type={e.type} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{e.player}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {e.assist ? (e.type === 'sub' ? `Troca com ${e.assist}` : `Assist.: ${e.assist}`) : LABEL[e.type]}
              </span>
            </span>
          </span>
        )
        return (
          <li key={e.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border py-2.5 last:border-0">
            <div className="flex justify-end">{home && content}</div>
            <span className="flex min-w-11 justify-center rounded-full bg-secondary px-2 py-0.5 font-display text-xs font-bold tabular-nums">
              {e.minute}
              {e.extra ? `+${e.extra}` : ''}&apos;
            </span>
            <div className="flex justify-start">{!home && content}</div>
          </li>
        )
      })}
    </ol>
  )
}

export function SummaryTab({ match, onOpenTab }: { match: MatchDetail; onOpenTab: (t: 'analise' | 'stats') => void }) {
  const top = match.insights.slice(0, 2)
  return (
    <div className="flex flex-col gap-3">
      {match.stats && (
        <section className="rounded-xl border border-border bg-card p-3 lg:border-0 lg:p-0">
          <QuickStats match={match} />
          <button type="button" onClick={() => onOpenTab('stats')} className="mt-3 w-full text-center text-xs font-semibold text-primary">
            Ver todas as estatísticas
          </button>
        </section>
      )}
      <section className="rounded-xl border border-border bg-card px-3 lg:border-0 lg:px-0">
        <h2 className="pt-3 font-display text-lg font-bold">Lances do jogo</h2>
        <Timeline match={match} />
      </section>
      {top.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-lg font-bold">Melhores oportunidades</h2>
            <button type="button" onClick={() => onOpenTab('analise')} className="text-xs font-semibold text-primary">
              Ver análise
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {top.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </div>
        </section>
      )}
      <section className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-3 text-sm lg:border-0 lg:p-0">
        {match.venue && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">{match.venue}</span>
          </p>
        )}
        {match.referee && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <User className="size-4 shrink-0" />
            <span className="truncate">{match.referee}</span>
          </p>
        )}
      </section>
    </div>
  )
}
