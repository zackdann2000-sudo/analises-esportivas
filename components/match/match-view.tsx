'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { isLive } from '@/lib/analysis'
import { fetcher } from '@/lib/format'
import type { MatchDetail } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AnalysisTab } from './analysis-tab'
import { H2HTab } from './h2h-tab'
import { LineupTab } from './lineup-tab'
import { MatchHeader } from './match-header'
import { StatsTab } from './stats-tab'
import { SummaryTab } from './summary-tab'

const TABS = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'stats', label: 'Estatísticas' },
  { id: 'escalacao', label: 'Escalação' },
  { id: 'analise', label: 'Análise' },
  { id: 'h2h', label: 'Confronto' },
] as const

type TabId = (typeof TABS)[number]['id']

export function MatchView({ id }: { id: string }) {
  const [tab, setTab] = useState<TabId>('resumo')
  const { data, error, isLoading } = useSWR<MatchDetail>(`/api/matches/${id}`, fetcher, {
    refreshInterval: (latest) => (latest && isLive(latest.status) ? 15_000 : 120_000),
  })

  if (error) {
    return (
      <div className="m-4 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Partida não encontrada ou indisponível no momento.
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-3 p-2 lg:p-0" aria-busy>
        <div className="h-52 animate-pulse rounded-xl bg-card" />
        <div className="h-10 animate-pulse rounded-xl bg-card" />
        <div className="h-80 animate-pulse rounded-xl bg-card" />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <MatchHeader match={data} />
      <div className="sticky top-14 z-30 border-b border-border bg-card lg:mt-3 lg:rounded-t-xl lg:border lg:border-b-0">
        <div role="tablist" aria-label="Seções da partida" className="no-scrollbar flex overflow-x-auto px-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'relative shrink-0 px-3.5 py-3 text-sm font-semibold transition-colors',
                tab === t.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              {tab === t.id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      </div>
      <div className="p-2 lg:rounded-b-xl lg:border lg:border-t-0 lg:border-border lg:bg-card lg:p-4">
        {tab === 'resumo' && <SummaryTab match={data} onOpenTab={setTab} />}
        {tab === 'stats' && <StatsTab match={data} />}
        {tab === 'escalacao' && <LineupTab match={data} />}
        {tab === 'analise' && <AnalysisTab match={data} />}
        {tab === 'h2h' && <H2HTab match={data} />}
      </div>
    </div>
  )
}
