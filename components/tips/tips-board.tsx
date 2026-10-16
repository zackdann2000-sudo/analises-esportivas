'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import useSWR from 'swr'
import { Lightbulb } from 'lucide-react'
import { fetcher, statusLabel, todayKeyClient } from '@/lib/format'
import type { Insight, Match, Prediction } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DateStrip } from '../matches/date-strip'
import { ConfidenceRing } from '../match/insight-card'
import { TeamLogo } from '../team-logo'

interface Tip extends Match {
  prediction: Prediction | null
  insights: Insight[]
  top: Insight | null
}

const MARKETS = ['Todos', 'Resultado final', 'Dupla chance', 'Gols', 'Ambas marcam', 'Escanteios', 'Cartões']

function TipCard({ tip, market }: { tip: Tip; market: string }) {
  const insights = market === 'Todos' ? tip.insights.slice(0, 3) : tip.insights.filter((i) => i.market === market)
  if (!insights.length) return null
  const p = tip.prediction
  return (
    <Link href={`/jogo/${tip.id}`} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/50">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <TeamLogo src={tip.league.logo} name={tip.league.name} size={14} />
        <span className="flex-1 truncate">{tip.league.name}</span>
        <span className={cn('font-semibold', tip.status !== 'NS' && 'text-live')}>{statusLabel(tip)}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {(['home', 'away'] as const).map((s) => (
            <span key={s} className="flex items-center gap-2">
              <TeamLogo src={tip[s].logo} name={tip[s].name} size={20} />
              <span className="truncate text-sm font-semibold">{tip[s].name}</span>
              {p && <span className="ml-auto text-xs tabular-nums text-muted-foreground">{s === 'home' ? p.percent.home : p.percent.away}%</span>}
            </span>
          ))}
        </div>
      </div>
      <ul className="flex flex-col gap-2 border-t border-border pt-3">
        {insights.map((i) => (
          <li key={i.id} className="flex items-center gap-3">
            <ConfidenceRing value={i.confidence} tone={i.tone} />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{i.market}</span>
              <span className="block truncate text-sm font-semibold">{i.pick}</span>
            </span>
          </li>
        ))}
      </ul>
    </Link>
  )
}

export function TipsBoard() {
  const [date, setDate] = useState(() => todayKeyClient())
  const [market, setMarket] = useState('Todos')
  const { data, isLoading } = useSWR<{ tips: Tip[] }>(`/api/tips?date=${date}`, fetcher, { refreshInterval: 120_000 })

  const best = useMemo(() => {
    const all = (data?.tips ?? []).flatMap((t) => t.insights.map((i) => ({ i, t })))
    return all.sort((a, b) => b.i.confidence - a.i.confidence).slice(0, 3)
  }, [data])

  return (
    <div className="flex flex-col gap-3 pt-3 lg:pt-0">
      <section className="relative mx-2 overflow-hidden rounded-xl lg:mx-0">
        <Image src="/banners/analise.png" alt="" fill sizes="100vw" className="object-cover" />
        <div className="relative flex flex-col gap-1 bg-gradient-to-r from-background via-background/85 to-background/30 p-4">
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Lightbulb className="size-6 text-warning" /> Oportunidades do dia
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Probabilidades calculadas por modelo de Poisson sobre o desempenho recente de cada time.
          </p>
          {best.length > 0 && (
            <ol className="mt-2 flex flex-col gap-1.5">
              {best.map(({ i, t }, idx) => (
                <li key={`${t.id}-${i.id}`} className="flex items-center gap-2 text-sm">
                  <span className="flex size-5 items-center justify-center rounded-full bg-success font-display text-xs font-bold text-success-foreground">
                    {idx + 1}
                  </span>
                  <span className="truncate">
                    <strong>{i.pick}</strong>
                    <span className="text-muted-foreground"> · {t.home.short} x {t.away.short}</span>
                  </span>
                  <span className="ml-auto font-display font-bold text-success">{i.confidence}%</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
      <DateStrip value={date} onChange={setDate} />
      <div role="tablist" aria-label="Mercados" className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 lg:px-0">
        {MARKETS.map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={market === m}
            onClick={() => setMarket(m)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold',
              market === m ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-muted-foreground',
            )}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="grid gap-3 px-2 md:grid-cols-2 lg:px-0">
        {isLoading
          ? [0, 1, 2, 3].map((i) => <div key={i} className="h-56 animate-pulse rounded-xl bg-card" />)
          : (data?.tips ?? []).map((t) => <TipCard key={t.id} tip={t} market={market} />)}
      </div>
      {!isLoading && !data?.tips.length && (
        <p className="mx-2 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Sem jogos pendentes para analisar nesta data.
        </p>
      )}
      <p className="px-4 text-[11px] leading-relaxed text-muted-foreground lg:px-0">
        Conteúdo estatístico e informativo. Não constitui garantia de resultado. Aposte com responsabilidade. +18.
      </p>
    </div>
  )
}
