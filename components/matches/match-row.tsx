'use client'

import Link from 'next/link'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { isLive } from '@/lib/analysis'
import { statusLabel } from '@/lib/format'
import { useFavorites } from '@/lib/stores'
import type { Match } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TeamLogo } from '../team-logo'

function RedCards({ count }: { count: number }) {
  if (!count) return null
  return (
    <span className="flex gap-0.5" aria-label={`${count} cartão vermelho`}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="h-3 w-2 rounded-[2px] bg-live" />
      ))}
    </span>
  )
}

export function MatchRow({ match }: { match: Match }) {
  const { isMatchFavorite, toggleMatch } = useFavorites()
  const live = isLive(match.status)
  const finished = ['FT', 'AET', 'PEN'].includes(match.status)
  const fav = isMatchFavorite(match.id)
  const reds = (teamId: number) => match.events.filter((e) => e.type === 'red' && e.teamId === teamId).length
  const homeWin = finished && (match.score.home ?? 0) > (match.score.away ?? 0)
  const awayWin = finished && (match.score.away ?? 0) > (match.score.home ?? 0)

  return (
    <div className="group relative flex items-center hover:bg-secondary/60">
      <Link href={`/jogo/${match.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-3 pr-1">
        <span
          className={cn(
            'w-11 shrink-0 text-center text-xs font-semibold tabular-nums',
            live ? 'text-live' : 'text-muted-foreground',
          )}
        >
          {statusLabel(match)}
          {live && match.status !== 'HT' && <span className="sr-only"> ao vivo</span>}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          {(['home', 'away'] as const).map((side) => {
            const team = match[side]
            const win = side === 'home' ? homeWin : awayWin
            return (
              <span key={side} className="flex items-center gap-2">
                <TeamLogo src={team.logo} name={team.name} size={18} />
                <span className={cn('truncate text-sm', win || live ? 'font-semibold' : '', finished && !win && 'text-muted-foreground')}>
                  {team.name}
                </span>
                <RedCards count={reds(team.id)} />
              </span>
            )
          })}
        </span>
        <span className="flex w-7 shrink-0 flex-col items-end gap-1.5 font-display text-base font-bold tabular-nums leading-[18px]">
          <span className={cn(live && 'text-live')}>{match.score.home ?? ''}</span>
          <span className={cn(live && 'text-live')}>{match.score.away ?? ''}</span>
        </span>
      </Link>
      <button
        type="button"
        aria-label={fav ? 'Remover jogo dos favoritos' : 'Favoritar jogo e receber alertas'}
        aria-pressed={fav}
        onClick={() => {
          const added = toggleMatch(match.id)
          toast(added ? 'Jogo favoritado' : 'Removido dos favoritos', {
            description: added ? 'Você receberá alertas de gols, escanteios, cartões e mais.' : undefined,
          })
        }}
        className="flex size-11 shrink-0 items-center justify-center text-muted-foreground hover:text-warning"
      >
        <Star className={cn('size-4.5', fav && 'fill-warning text-warning')} />
      </button>
    </div>
  )
}
