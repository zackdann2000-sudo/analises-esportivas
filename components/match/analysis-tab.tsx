'use client'

import Link from 'next/link'
import { Activity, Brain, Crown } from 'lucide-react'
import { isLive, liveSignals } from '@/lib/analysis'
import { formatDate } from '@/lib/format'
import type { FormItem, MatchDetail, TeamAverages, TeamRef } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TeamLogo } from '../team-logo'
import { InsightCard } from './insight-card'

export function FormBadge({ result }: { result: FormItem['result'] }) {
  return (
    <span
      className={cn(
        'flex size-6 items-center justify-center rounded-md font-display text-xs font-bold',
        result === 'V' && 'bg-success text-success-foreground',
        result === 'E' && 'bg-muted-foreground/40 text-foreground',
        result === 'D' && 'bg-live text-live-foreground',
      )}
      aria-label={result === 'V' ? 'Vitória' : result === 'E' ? 'Empate' : 'Derrota'}
    >
      {result}
    </span>
  )
}

function ProbabilityBar({ match }: { match: MatchDetail }) {
  const p = match.prediction!
  const items = [
    { label: match.home.short, value: p.percent.home, cls: 'bg-primary text-primary-foreground' },
    { label: 'Empate', value: p.percent.draw, cls: 'bg-muted-foreground/50 text-foreground' },
    { label: match.away.short, value: p.percent.away, cls: 'bg-live text-live-foreground' },
  ]
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-9 overflow-hidden rounded-lg">
        {items.map((it) => (
          <div
            key={it.label}
            className={cn('flex items-center justify-center font-display text-sm font-bold tabular-nums transition-all', it.cls)}
            style={{ width: `${Math.max(it.value, 8)}%` }}
          >
            {it.value}%
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        {items.map((it) => (
          <span key={it.label}>{it.label}</span>
        ))}
      </div>
    </div>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col rounded-lg bg-surface p-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-display text-xl font-bold tabular-nums">{value}</span>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  )
}

function FormBlock({ team, form, avg }: { team: TeamRef; form: FormItem[]; avg: TeamAverages | null }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
      <Link href={`/time/${team.id}`} className="flex items-center gap-2">
        <TeamLogo src={team.logo} name={team.name} size={22} />
        <h3 className="flex-1 truncate font-semibold">{team.name}</h3>
        <span className="flex gap-1">
          {form.map((f) => (
            <FormBadge key={f.matchId} result={f.result} />
          ))}
        </span>
      </Link>
      <ul className="flex flex-col">
        {form.map((f) => (
          <li key={f.matchId} className="flex items-center gap-2 border-b border-border py-1.5 text-sm last:border-0">
            <span className="w-11 text-xs tabular-nums text-muted-foreground">{formatDate(f.date)}</span>
            <span className="w-5 text-[10px] font-semibold text-muted-foreground">{f.home ? 'C' : 'F'}</span>
            <TeamLogo src={f.opponent.logo} name={f.opponent.name} size={16} />
            <span className="flex-1 truncate">{f.opponent.name}</span>
            <span className="font-display font-bold tabular-nums">
              {f.goalsFor}-{f.goalsAgainst}
            </span>
          </li>
        ))}
      </ul>
      {avg && (
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Gols pró" value={avg.goalsFor.toFixed(1)} />
          <Metric label="Gols contra" value={avg.goalsAgainst.toFixed(1)} />
          <Metric label="Over 2.5" value={`${Math.round(avg.over25Rate * 100)}%`} />
          <Metric label="Ambas marcam" value={`${Math.round(avg.bttsRate * 100)}%`} />
          {avg.corners != null && <Metric label="Escanteios" value={avg.corners.toFixed(1)} />}
          {avg.cards != null && <Metric label="Cartões" value={avg.cards.toFixed(1)} />}
          {avg.corners == null && <Metric label="Sem sofrer" value={`${Math.round(avg.cleanSheetRate * 100)}%`} />}
        </div>
      )}
    </section>
  )
}

export function AnalysisTab({ match }: { match: MatchDetail }) {
  const p = match.prediction
  const signals = isLive(match.status) ? liveSignals(match) : null
  return (
    <div className="flex flex-col gap-3">
      {signals && (
        <section className="rounded-xl border border-live/30 bg-live/5 p-3">
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
            <Activity className="size-5 text-live" /> Leitura ao vivo
          </h2>
          <div className="mb-2 flex h-3 overflow-hidden rounded-full">
            <div className="bg-primary transition-all" style={{ width: `${signals.pressureHome}%` }} />
            <div className="bg-live transition-all" style={{ width: `${signals.pressureAway}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            Domínio recente: {match.home.short} {signals.pressureHome}% x {signals.pressureAway}% {match.away.short}
          </p>
          {signals.alerts.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {signals.alerts.map((a) => (
                <li
                  key={a.label}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-semibold',
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
        </section>
      )}

      {p && (
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <Brain className="size-5 text-primary" /> Probabilidades
            </h2>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
              {p.source === 'api' ? 'API + modelo' : 'Modelo Poisson'}
            </span>
          </div>
          <ProbabilityBar match={match} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="xG esperado" value={`${p.expectedGoals.home} - ${p.expectedGoals.away}`} />
            <Metric label="Placar provável" value={p.likelyScore.replace('-', ' - ')} />
            <Metric label="Over 2.5" value={`${p.over25}%`} hint={`Over 1.5: ${p.over15}%`} />
            <Metric label="Ambas marcam" value={`${p.btts}%`} />
          </div>
          <p className="rounded-lg bg-accent/60 px-3 py-2 text-sm text-accent-foreground">
            <strong>Sugestão:</strong> {p.advice}
          </p>
        </section>
      )}

      {match.insights.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 font-display text-lg font-bold">Oportunidades estatísticas</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {match.insights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </div>
          <Link href="/vip" className="flex items-center gap-2 rounded-xl border border-dashed border-warning/50 p-3 text-sm text-muted-foreground hover:bg-warning/5">
            <Crown className="size-4 text-warning" />
            VIP: alertas automáticos quando a pressão do jogo bater seus filtros.
          </Link>
        </section>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <FormBlock team={match.home} form={match.form.home} avg={match.averages.home} />
        <FormBlock team={match.away} form={match.form.away} avg={match.averages.away} />
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
        Análises geradas por modelo estatístico a partir de desempenho recente. Não são garantia de resultado. Jogue com
        responsabilidade. +18.
      </p>
    </div>
  )
}
