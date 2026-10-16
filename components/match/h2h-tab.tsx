import { formatDate } from '@/lib/format'
import type { MatchDetail } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TeamLogo } from '../team-logo'

export function H2HTab({ match }: { match: MatchDetail }) {
  const list = match.h2h
  if (!list.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Sem confrontos diretos recentes.</p>
  }
  let homeWins = 0
  let draws = 0
  let awayWins = 0
  let goals = 0
  for (const h of list) {
    goals += h.score.home + h.score.away
    if (h.score.home === h.score.away) draws++
    else {
      const winner = h.score.home > h.score.away ? h.home.id : h.away.id
      if (winner === match.home.id) homeWins++
      else awayWins++
    }
  }
  return (
    <div className="flex flex-col gap-3">
      <section className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-card p-3 text-center">
        <div>
          <TeamLogo src={match.home.logo} name={match.home.name} size={28} className="mx-auto" />
          <p className="mt-1 font-display text-2xl font-bold text-primary">{homeWins}</p>
          <p className="text-xs text-muted-foreground">Vitórias</p>
        </div>
        <div className="flex flex-col justify-end">
          <p className="font-display text-2xl font-bold">{draws}</p>
          <p className="text-xs text-muted-foreground">Empates</p>
        </div>
        <div>
          <TeamLogo src={match.away.logo} name={match.away.name} size={28} className="mx-auto" />
          <p className="mt-1 font-display text-2xl font-bold text-live">{awayWins}</p>
          <p className="text-xs text-muted-foreground">Vitórias</p>
        </div>
        <p className="col-span-3 border-t border-border pt-2 text-xs text-muted-foreground">
          Média de {(goals / list.length).toFixed(1)} gols nos últimos {list.length} confrontos
        </p>
      </section>
      <ul className="overflow-hidden rounded-xl border border-border bg-card">
        {list.map((h, i) => (
          <li key={i} className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-0">
            <span className="w-14 shrink-0 text-xs leading-tight text-muted-foreground">
              {formatDate(h.date, { day: '2-digit', month: '2-digit', year: '2-digit' })}
              <span className="block truncate text-[10px]">{h.league}</span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              {(['home', 'away'] as const).map((s) => (
                <span key={s} className="flex items-center gap-2 text-sm">
                  <TeamLogo src={h[s].logo} name={h[s].name} size={16} />
                  <span className={cn('truncate', h.score[s] > h.score[s === 'home' ? 'away' : 'home'] && 'font-semibold')}>
                    {h[s].name}
                  </span>
                </span>
              ))}
            </span>
            <span className="flex flex-col items-end gap-1 font-display font-bold tabular-nums">
              <span>{h.score.home}</span>
              <span>{h.score.away}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
