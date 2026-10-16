'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { BellRing, Star, X } from 'lucide-react'
import { fetcher, todayKeyClient } from '@/lib/format'
import { useFavorites } from '@/lib/stores'
import type { Match, MatchesResponse } from '@/lib/types'
import { MatchList } from './matches/match-list'
import { TeamLogo } from './team-logo'

export function FavoritesView() {
  const { favorites, toggleTeam, isTeamFavorite } = useFavorites()
  const { data: today } = useSWR<MatchesResponse>(`/api/matches?date=${todayKeyClient()}`, fetcher, { refreshInterval: 20_000 })
  const ids = favorites.matches.join(',')
  const { data: favMatches } = useSWR<{ matches: Match[] }>(ids ? `/api/matches?ids=${ids}` : null, fetcher, {
    refreshInterval: 20_000,
  })

  const teamMatches = (today?.matches ?? []).filter((m) => isTeamFavorite(m.home.id) || isTeamFavorite(m.away.id))
  const merged = new Map<string, Match>()
  ;[...teamMatches, ...(favMatches?.matches ?? [])].forEach((m) => merged.set(m.id, m))

  return (
    <div className="flex flex-col gap-4 px-2 pt-3 lg:px-0 lg:pt-0">
      <header className="flex items-center justify-between px-2 lg:px-0">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Star className="size-6 fill-warning text-warning" /> Favoritos
        </h1>
        <Link href="/alertas" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold">
          <BellRing className="size-3.5" /> Alertas
        </Link>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:px-0">Times que você segue</h2>
        {favorites.teams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Você ainda não segue nenhum time.{' '}
            <Link href="/ligas" className="font-semibold text-primary">
              Explorar times
            </Link>
          </div>
        ) : (
          <ul className="no-scrollbar flex gap-2 overflow-x-auto px-2 lg:flex-wrap lg:px-0">
            {favorites.teams.map((t) => (
              <li key={t.id} className="relative shrink-0">
                <Link href={`/time/${t.id}`} className="flex w-24 flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center">
                  <TeamLogo src={t.logo} name={t.name} size={36} />
                  <span className="line-clamp-1 text-xs font-semibold">{t.name}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => toggleTeam(t)}
                  aria-label={`Deixar de seguir ${t.name}`}
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-secondary text-muted-foreground"
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:px-0">Jogos acompanhados</h2>
        <MatchList
          matches={[...merged.values()]}
          empty="Toque na estrela ao lado de qualquer jogo para acompanhar e receber notificações."
        />
      </section>
    </div>
  )
}
