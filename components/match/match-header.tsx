'use client'

import Link from 'next/link'
import { ArrowLeft, Bell, BellRing, Star } from 'lucide-react'
import { toast } from 'sonner'
import { isLive } from '@/lib/analysis'
import { formatDate, formatTime } from '@/lib/format'
import { useFavorites } from '@/lib/stores'
import type { MatchDetail, TeamRef } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TeamLogo } from '../team-logo'

function statusText(m: MatchDetail) {
  switch (m.status) {
    case 'NS':
      return `${formatDate(m.kickoff, { weekday: 'short', day: '2-digit', month: '2-digit' })} · ${formatTime(m.kickoff)}`
    case '1H':
      return `1º tempo · ${m.minute}'`
    case '2H':
      return `2º tempo · ${m.minute}'`
    case 'HT':
      return 'Intervalo'
    case 'ET':
      return `Prorrogação · ${m.minute}'`
    case 'P':
      return 'Pênaltis'
    case 'FT':
      return 'Encerrado'
    case 'AET':
      return 'Encerrado após prorrogação'
    case 'PEN':
      return 'Encerrado nos pênaltis'
    default:
      return m.status
  }
}

function TeamColumn({ team }: { team: TeamRef }) {
  const { isTeamFavorite, toggleTeam } = useFavorites()
  const fav = isTeamFavorite(team.id)
  return (
    <div className="flex w-28 flex-col items-center gap-2 text-center">
      <Link href={`/time/${team.id}`} className="flex flex-col items-center gap-2">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-surface p-2">
          <TeamLogo src={team.logo} name={team.name} size={48} />
        </span>
        <span className="line-clamp-2 text-sm font-semibold leading-tight text-balance">{team.name}</span>
      </Link>
      <button
        type="button"
        onClick={() => {
          const added = toggleTeam(team)
          toast(added ? `${team.name} nos favoritos` : `${team.name} removido`, {
            description: added ? 'Alertas de gols, escalação prevista e fim de jogo ativados.' : undefined,
          })
        }}
        aria-pressed={fav}
        aria-label={fav ? `Remover ${team.name} dos favoritos` : `Favoritar ${team.name}`}
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
          fav ? 'border-warning bg-warning/15 text-warning' : 'border-border text-muted-foreground',
        )}
      >
        <Star className={cn('size-3', fav && 'fill-warning')} />
        {fav ? 'Seguindo' : 'Seguir'}
      </button>
    </div>
  )
}

export function MatchHeader({ match }: { match: MatchDetail }) {
  const { isMatchFavorite, toggleMatch } = useFavorites()
  const live = isLive(match.status)
  const fav = isMatchFavorite(match.id)
  const goals = match.events.filter((e) => ['goal', 'own_goal', 'penalty_goal'].includes(e.type))
  const scorers = (teamId: number) =>
    goals
      .filter((g) => g.teamId === teamId)
      .map((g) => `${g.player} ${g.minute}'${g.type === 'penalty_goal' ? ' (P)' : g.type === 'own_goal' ? ' (GC)' : ''}`)

  return (
    <section className="relative overflow-hidden border-b border-border bg-card lg:rounded-xl lg:border">
      <div className="flex items-center justify-between px-2 pt-2">
        <Link href="/" aria-label="Voltar" className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary lg:hidden">
          <ArrowLeft className="size-5" />
        </Link>
        <Link href={`/ligas/${match.league.id}`} className="mx-auto flex min-w-0 items-center gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground">
          <TeamLogo src={match.league.logo} name={match.league.name} size={14} />
          <span className="truncate">
            {match.league.name}
            {match.round ? ` · ${match.round}` : ''}
          </span>
        </Link>
        <button
          type="button"
          aria-pressed={fav}
          aria-label={fav ? 'Desativar alertas deste jogo' : 'Ativar alertas deste jogo'}
          onClick={() => {
            const added = toggleMatch(match.id)
            toast(added ? 'Alertas ativados' : 'Alertas desativados', {
              description: added ? 'Gols, escanteios, cartões, pênaltis e fim de jogo.' : undefined,
            })
          }}
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-full hover:bg-secondary',
            fav ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {fav ? <BellRing className="size-5" /> : <Bell className="size-5" />}
        </button>
      </div>

      <div className="flex items-start justify-center gap-2 px-3 pb-5 pt-3">
        <TeamColumn team={match.home} />
        <div className="flex flex-1 flex-col items-center gap-1 pt-3">
          {match.status === 'NS' ? (
            <span className="font-display text-4xl font-bold tabular-nums">{formatTime(match.kickoff)}</span>
          ) : (
            <span className={cn('font-display text-5xl font-bold tabular-nums leading-none', live && 'text-live')}>
              {match.score.home} <span className="text-muted-foreground">-</span> {match.score.away}
            </span>
          )}
          <span
            className={cn(
              'mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
              live ? 'bg-live/15 text-live' : 'bg-secondary text-muted-foreground',
            )}
          >
            {live && <span className="size-1.5 animate-live rounded-full bg-live" />}
            {statusText(match)}
          </span>
          {match.halftime && match.status !== 'HT' && match.status !== '1H' && (
            <span className="text-[11px] text-muted-foreground">
              Intervalo: {match.halftime.home} - {match.halftime.away}
            </span>
          )}
        </div>
        <TeamColumn team={match.away} />
      </div>

      {goals.length > 0 && (
        <div className="grid grid-cols-2 gap-4 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <ul className="flex flex-col gap-0.5 text-right">
            {scorers(match.home.id).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <ul className="flex flex-col gap-0.5">
            {scorers(match.away.id).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
