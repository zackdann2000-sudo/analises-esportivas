'use client'

import { liveSignals } from '@/lib/analysis'
import type { Match, TeamStats } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TeamLogo } from '../team-logo'

type Row = { key: keyof TeamStats; label: string; suffix?: string; decimals?: number }

const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: 'Visão geral',
    rows: [
      { key: 'possession', label: 'Posse de bola', suffix: '%' },
      { key: 'xg', label: 'Gols esperados (xG)', decimals: 2 },
      { key: 'shots', label: 'Finalizações' },
      { key: 'shotsOnTarget', label: 'Chutes no gol' },
      { key: 'corners', label: 'Escanteios' },
    ],
  },
  {
    title: 'Ataque',
    rows: [
      { key: 'dangerousAttacks', label: 'Ataques perigosos' },
      { key: 'attacks', label: 'Ataques' },
      { key: 'offsides', label: 'Impedimentos' },
    ],
  },
  {
    title: 'Disciplina e defesa',
    rows: [
      { key: 'fouls', label: 'Faltas' },
      { key: 'yellow', label: 'Cartões amarelos' },
      { key: 'red', label: 'Cartões vermelhos' },
      { key: 'saves', label: 'Defesas do goleiro' },
    ],
  },
  {
    title: 'Passes',
    rows: [
      { key: 'passes', label: 'Passes' },
      { key: 'passAccuracy', label: 'Precisão de passe', suffix: '%' },
    ],
  },
]

function StatBar({ label, home, away, suffix = '', decimals = 0 }: { label: string; home: number; away: number; suffix?: string; decimals?: number }) {
  const total = home + away
  const hp = total ? (home / total) * 100 : 50
  const ap = total ? (away / total) * 100 : 50
  const fmt = (n: number) => `${n.toFixed(decimals)}${suffix}`
  return (
    <div className="flex flex-col gap-1.5 py-2">
      <div className="flex items-center justify-between text-sm">
        <span className={cn('min-w-10 rounded px-1.5 py-0.5 text-center font-display font-bold tabular-nums', home > away && 'bg-primary text-primary-foreground')}>
          {fmt(home)}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn('min-w-10 rounded px-1.5 py-0.5 text-center font-display font-bold tabular-nums', away > home && 'bg-live text-live-foreground')}>
          {fmt(away)}
        </span>
      </div>
      <div className="flex gap-1">
        <div className="flex h-1.5 flex-1 justify-end overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${hp}%` }} />
        </div>
        <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-live transition-all duration-700" style={{ width: `${ap}%` }} />
        </div>
      </div>
    </div>
  )
}

export function PressureChart({ match, height = 96 }: { match: Match; height?: number }) {
  const data = match.pressure ?? []
  if (!data.length) return null
  const slots = 18
  const max = Math.max(4, ...data.map((d) => Math.max(d.home, d.away)))
  return (
    <figure className="flex flex-col gap-1">
      <div className="relative flex items-center gap-[3px]" style={{ height }} role="img" aria-label="Gráfico de pressão por intervalos de 5 minutos">
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
        {Array.from({ length: slots }).map((_, i) => {
          const d = data[i]
          const h = d ? (d.home / max) * 50 : 0
          const a = d ? (d.away / max) * 50 : 0
          return (
            <div key={i} className="relative flex h-full flex-1 flex-col">
              <div className="flex flex-1 items-end">
                <div className="w-full rounded-t-sm bg-primary" style={{ height: `${h * 2}%` }} />
              </div>
              <div className="flex flex-1 items-start">
                <div className="w-full rounded-b-sm bg-live" style={{ height: `${a * 2}%` }} />
              </div>
              {i === 8 && <span className="absolute inset-y-0 -right-[2px] w-px bg-muted-foreground/40" />}
            </div>
          )
        })}
      </div>
      <figcaption className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>0&apos;</span>
        <span>45&apos;</span>
        <span>90&apos;</span>
      </figcaption>
    </figure>
  )
}

export function QuickStats({ match }: { match: Match }) {
  if (!match.stats) return null
  const { home, away } = match.stats
  const items = [
    { label: 'Posse', h: `${home.possession}%`, a: `${away.possession}%` },
    { label: 'Chutes', h: home.shots, a: away.shots },
    { label: 'No gol', h: home.shotsOnTarget, a: away.shotsOnTarget },
    { label: 'Escanteios', h: home.corners, a: away.corners },
    { label: 'Faltas', h: home.fouls, a: away.fouls },
    { label: 'Impedim.', h: home.offsides, a: away.offsides },
    { label: 'Amarelos', h: home.yellow, a: away.yellow },
    { label: 'Vermelhos', h: home.red, a: away.red },
  ]
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col items-center rounded-lg bg-surface py-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{it.label}</span>
          <span className="font-display text-base font-bold tabular-nums">
            <span className="text-primary">{it.h}</span>
            <span className="px-1 text-muted-foreground">-</span>
            <span className="text-live">{it.a}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

export function StatsTab({ match }: { match: Match }) {
  if (!match.stats) {
    return <p className="py-10 text-center text-sm text-muted-foreground">As estatísticas aparecem quando a bola rolar.</p>
  }
  const signals = liveSignals(match)
  const { home, away } = match.stats
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 lg:border-0 lg:px-0">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <TeamLogo src={match.home.logo} name={match.home.name} size={20} />
          {match.home.short}
        </span>
        <span className="flex items-center gap-2 text-sm font-semibold">
          {match.away.short}
          <TeamLogo src={match.away.logo} name={match.away.name} size={20} />
        </span>
      </div>

      {match.pressure && (
        <section className="rounded-xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Gráfico de pressão</h2>
            {signals && (
              <span className="text-xs tabular-nums text-muted-foreground">
                <span className="font-bold text-primary">{signals.pressureHome}%</span> ·{' '}
                <span className="font-bold text-live">{signals.pressureAway}%</span>
              </span>
            )}
          </div>
          <PressureChart match={match} />
          {signals && signals.appmHome != null && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-surface py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">APPM (ataques perigosos/min)</p>
                <p className="font-display font-bold tabular-nums">
                  <span className="text-primary">{signals.appmHome.toFixed(2)}</span> - <span className="text-live">{signals.appmAway?.toFixed(2)}</span>
                </p>
              </div>
              <div className="rounded-lg bg-surface py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">CG (chutes + escanteios)</p>
                <p className="font-display font-bold tabular-nums">
                  <span className="text-primary">{signals.cgHome}</span> - <span className="text-live">{signals.cgAway}</span>
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {GROUPS.map((g) => {
        const rows = g.rows.filter((r) => home[r.key] != null && away[r.key] != null)
        if (!rows.length) return null
        return (
          <section key={g.title} className="rounded-xl border border-border bg-card px-3 py-2">
            <h3 className="pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</h3>
            {rows.map((r) => (
              <StatBar
                key={r.key}
                label={r.label}
                home={Number(home[r.key])}
                away={Number(away[r.key])}
                suffix={r.suffix}
                decimals={r.decimals}
              />
            ))}
          </section>
        )
      })}
    </div>
  )
}
