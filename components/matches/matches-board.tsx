'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { isFinished, isLive } from '@/lib/analysis'
import { fetcher, todayKeyClient } from '@/lib/format'
import { useFavorites } from '@/lib/stores'
import type { MatchesResponse } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DataSourceBadge } from '../data-source-badge'
import { DateStrip } from './date-strip'
import { MatchList, MatchListSkeleton } from './match-list'

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'live', label: 'Ao vivo' },
  { id: 'upcoming', label: 'Próximos' },
  { id: 'finished', label: 'Encerrados' },
  { id: 'fav', label: 'Favoritos' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

export function MatchesBoard() {
  const [date, setDate] = useState(() => todayKeyClient())
  const [filter, setFilter] = useState<FilterId>('all')
  const { isMatchFavorite, isTeamFavorite } = useFavorites()
  const isToday = date === todayKeyClient()
  const { data, error, isLoading } = useSWR<MatchesResponse>(`/api/matches?date=${date}`, fetcher, {
    refreshInterval: isToday ? 20_000 : 0,
    keepPreviousData: true,
  })

  const counts = useMemo(() => {
    const list = data?.matches ?? []
    return { live: list.filter((m) => isLive(m.status)).length, total: list.length }
  }, [data])

  const filtered = useMemo(() => {
    const list = data?.matches ?? []
    switch (filter) {
      case 'live':
        return list.filter((m) => isLive(m.status))
      case 'upcoming':
        return list.filter((m) => m.status === 'NS')
      case 'finished':
        return list.filter((m) => isFinished(m.status))
      case 'fav':
        return list.filter((m) => isMatchFavorite(m.id) || isTeamFavorite(m.home.id) || isTeamFavorite(m.away.id))
      default:
        return list
    }
  }, [data, filter, isMatchFavorite, isTeamFavorite])

  return (
    <div className="flex flex-col gap-2">
      <DateStrip value={date} onChange={setDate} />
      <div className="flex items-center gap-2 px-4 lg:px-0">
        <div role="tablist" aria-label="Filtrar jogos" className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                filter === f.id
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {f.id === 'live' && <span className="size-1.5 animate-live rounded-full bg-live" />}
              {f.label}
              {f.id === 'live' && counts.live > 0 && <span className="tabular-nums">({counts.live})</span>}
            </button>
          ))}
        </div>
        <div className="hidden shrink-0 sm:block">
          <DataSourceBadge compact />
        </div>
      </div>
      <div className="px-2 lg:px-0">
        {error ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Não foi possível carregar os jogos. Tente novamente em instantes.
          </div>
        ) : isLoading && !data ? (
          <MatchListSkeleton />
        ) : (
          <MatchList
            matches={filtered}
            empty={
              filter === 'fav'
                ? 'Nenhum jogo dos seus favoritos nesta data. Toque na estrela para favoritar.'
                : filter === 'live'
                  ? 'Nenhum jogo ao vivo agora.'
                  : 'Nenhum jogo nesta data.'
            }
          />
        )}
      </div>
    </div>
  )
}
