'use client'

import { BellRing, Info, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useAlertPrefs, useFavorites } from '@/lib/stores'
import type { Lineup, MatchDetail, TeamRef } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TeamLogo } from '../team-logo'

function shortName(name: string) {
  const parts = name.split(' ')
  return parts.length > 1 && name.length > 12 ? parts[parts.length - 1] : name
}

function Half({ lineup, side }: { lineup: Lineup; side: 'home' | 'away' }) {
  const maxRow = Math.max(...lineup.players.map((p) => p.row), 1)
  const rowCounts = new Map<number, number>()
  lineup.players.forEach((p) => rowCounts.set(p.row, Math.max(rowCounts.get(p.row) ?? 0, p.col + 1)))
  return (
    <>
      {lineup.players.map((p) => {
        const count = rowCounts.get(p.row) ?? 1
        const x = ((p.col + 0.5) / count) * 100
        const depth = 5 + (p.row / maxRow) * 38
        const y = side === 'home' ? depth : 100 - depth
        return (
          <div
            key={`${side}-${p.row}-${p.col}`}
            className="absolute flex w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
            style={{ left: `${side === 'home' ? x : 100 - x}%`, top: `${y}%` }}
          >
            <span
              className={cn(
                'flex size-7 items-center justify-center rounded-full border-2 font-display text-xs font-bold shadow-md',
                side === 'home'
                  ? 'border-primary-foreground/80 bg-primary text-primary-foreground'
                  : 'border-live-foreground/80 bg-live text-live-foreground',
                p.pos === 'G' && 'bg-warning text-background',
              )}
            >
              {p.number ?? ''}
            </span>
            <span className="max-w-full truncate rounded bg-background/70 px-1 text-[10px] font-semibold leading-tight text-foreground">
              {shortName(p.name)}
            </span>
          </div>
        )
      })}
    </>
  )
}

function Pitch({ home, away }: { home: Lineup; away: Lineup }) {
  return (
    <div
      className="relative mx-auto aspect-[2/3] w-full max-w-md overflow-hidden rounded-xl bg-pitch"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent 0 8.33%, rgb(255 255 255 / 0.05) 8.33% 16.66%)',
      }}
    >
      <div className="absolute inset-3 rounded border-2 border-primary-foreground/30" />
      <div className="absolute inset-x-3 top-1/2 h-0.5 bg-primary-foreground/30" />
      <div className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary-foreground/30" />
      <div className="absolute left-1/2 top-3 h-[14%] w-[44%] -translate-x-1/2 border-2 border-t-0 border-primary-foreground/30" />
      <div className="absolute bottom-3 left-1/2 h-[14%] w-[44%] -translate-x-1/2 border-2 border-b-0 border-primary-foreground/30" />
      <Half lineup={home} side="home" />
      <Half lineup={away} side="away" />
    </div>
  )
}

function TeamLine({ team, lineup }: { team: TeamRef; lineup: Lineup }) {
  return (
    <div className="flex items-center gap-2">
      <TeamLogo src={team.logo} name={team.name} size={24} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{team.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {lineup.formation}
          {lineup.coach ? ` · Téc.: ${lineup.coach}` : ''}
        </p>
      </div>
    </div>
  )
}

export function LineupTab({ match }: { match: MatchDetail }) {
  const { isTeamFavorite, toggleTeam } = useFavorites()
  const { prefs, update } = useAlertPrefs()
  const favTeam = [match.home, match.away].find((t) => isTeamFavorite(t.id))

  if (!match.lineups) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Escalações ainda não disponíveis para este jogo.</p>
  }

  const predicted = match.lineupStatus === 'prevista'

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border p-3 text-sm',
          predicted ? 'border-primary/30 bg-accent/50' : 'border-success/30 bg-success/10',
        )}
      >
        <Info className={cn('mt-0.5 size-4 shrink-0', predicted ? 'text-primary' : 'text-success')} />
        <p className="leading-relaxed">
          {predicted ? (
            <>
              <strong>Escalação prevista</strong> — baseada no último time titular e nas estatísticas recentes de cada
              equipe. A confirmação oficial sai cerca de 1h antes do jogo.
            </>
          ) : (
            <>
              <strong>Escalação confirmada</strong> pelos clubes.
            </>
          )}
        </p>
      </div>

      {favTeam ? (
        <div className="flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3">
          <Star className="size-5 shrink-0 fill-warning text-warning" />
          <p className="flex-1 text-sm leading-relaxed">
            <strong>{favTeam.name}</strong> está nos seus favoritos.{' '}
            {prefs.lineup ? 'Você será avisado quando a escalação sair.' : 'Ative o alerta de escalação.'}
          </p>
          {!prefs.lineup && (
            <button
              type="button"
              onClick={() => {
                update({ lineup: true })
                toast('Alerta de escalação ativado')
              }}
              className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              Ativar
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <BellRing className="size-5 shrink-0 text-muted-foreground" />
          <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
            Siga um time para ser notificado quando a escalação for divulgada.
          </p>
          <button
            type="button"
            onClick={() => {
              toggleTeam(match.home)
              update({ lineup: true })
              toast(`${match.home.name} nos favoritos`, { description: 'Alerta de escalação ativado.' })
            }}
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
          >
            Seguir {match.home.short}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
        <TeamLine team={match.home} lineup={match.lineups.home} />
        <Pitch home={match.lineups.home} away={match.lineups.away} />
        <TeamLine team={match.away} lineup={match.lineups.away} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(['home', 'away'] as const).map((side) => (
          <section key={side} className="rounded-xl border border-border bg-card p-3">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <TeamLogo src={match[side].logo} name={match[side].name} size={18} />
              {match[side].name}
            </h3>
            <ul className="flex flex-col">
              {match.lineups![side].players.map((p) => (
                <li key={`${p.row}-${p.col}`} className="flex items-center gap-3 border-b border-border py-1.5 text-sm last:border-0">
                  <span className="w-6 text-right font-display font-bold tabular-nums text-muted-foreground">{p.number}</span>
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="rounded bg-secondary px-1.5 text-[10px] font-semibold text-muted-foreground">
                    {{ G: 'GOL', D: 'DEF', M: 'MEI', F: 'ATA' }[p.pos]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
