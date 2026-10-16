import 'server-only'
import {
  apiLeague,
  apiLive,
  apiMatch,
  apiMatchesByDate,
  apiMatchesByIds,
  apiTeam,
  hasApiKey,
} from './api-football'
import { alternativeMatches, configuredAlternativeProviders } from './api-alternatives'
import type { DataSource, LeagueDetail, Match, MatchDetail, TeamDetail } from './types'

const todayKey = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

async function matchesForDate(date: string): Promise<{ data: Match[]; source: DataSource }> {
  if (hasApiKey()) {
    try {
      return { data: await apiMatchesByDate(date), source: 'api' }
    } catch (err) {
      console.error('[Match Lens] API-Football falhou; tentando outras fontes:', (err as Error).message)
    }
  }
  const alternative = await alternativeMatches(date)
  if (alternative) return { data: alternative.data, source: 'api' }
  return { data: [], source: 'unavailable' }
}

export async function getMatches(date: string) {
  return matchesForDate(date)
}

export async function getLive() {
  if (hasApiKey()) {
    try {
      const data = await apiLive()
      if (data.length) {
        const ids = data.slice(0, 20).map((m) => m.id)
        const detailed = await apiMatchesByIds(ids).catch(() => [])
        const byId = new Map(detailed.map((m) => [m.id, m]))
        return { data: data.map((m) => byId.get(m.id) ?? m), source: 'api' as DataSource }
      }
      if (data.length) return { data, source: 'api' as DataSource }
      // If this provider has no live feed, try the next real provider for the same date.
    } catch (err) {
      console.error('[Match Lens] API-Football ao vivo falhou:', (err as Error).message)
    }
  }
  const alternative = await alternativeMatches(todayKey(), true)
  if (alternative) return { data: alternative.data, source: 'api' as DataSource }
  return { data: [], source: 'unavailable' as DataSource }
}

export async function getMatchesByIds(ids: string[]) {
  const apiIds = ids.filter((id) => !id.startsWith('d-') && !id.startsWith('fd-') && !id.startsWith('sm-'))
  if (!apiIds.length || !hasApiKey()) return []
  return apiMatchesByIds(apiIds).catch(() => [])
}

export async function getMatch(id: string): Promise<MatchDetail | null> {
  if (id.startsWith('d-') || id.startsWith('fd-') || id.startsWith('sm-') || !hasApiKey()) return null
  try {
    return await apiMatch(id)
  } catch (err) {
    console.error('[Match Lens] Falha ao buscar detalhes da partida:', (err as Error).message)
    return null
  }
}

export async function getTeam(id: number): Promise<TeamDetail | null> {
  if (!hasApiKey()) return null
  try {
    return await apiTeam(id)
  } catch (err) {
    console.error('[Match Lens] Falha ao buscar time:', (err as Error).message)
    return null
  }
}

export async function getLeague(id: number): Promise<LeagueDetail | null> {
  if (!hasApiKey()) return null
  try {
    return await apiLeague(id)
  } catch (err) {
    console.error('[Match Lens] Falha ao buscar liga:', (err as Error).message)
    return null
  }
}

export async function getTips(date: string) {
  const { data: matches, source } = await getMatches(date)
  if (source !== 'api') return { date, source, tips: [] }
  const priority = [71, 2, 13, 39, 140, 135, 78, 61]
  const candidates = matches
    .filter((m) => m.status === 'NS' || ['1H', 'HT', '2H'].includes(m.status))
    .sort((a, b) => {
      const ra = priority.indexOf(a.league.id)
      const rb = priority.indexOf(b.league.id)
      return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb)
    })
    .slice(0, 6)
  // Only API-Football supports the existing detailed prediction pipeline.
  const candidatesWithDetails = candidates.filter((m) => !m.id.startsWith('fd-') && !m.id.startsWith('sm-'))
  const details = await Promise.all(candidatesWithDetails.map((m) => getMatch(m.id).catch(() => null)))
  const tips = details
    .filter((d): d is MatchDetail => Boolean(d))
    .map((d) => {
      const { lineups: _l, h2h: _h, form: _f, events: _e, pressure: _p, ...rest } = d
      return { ...rest, events: [], pressure: null, top: d.insights[0] ?? null }
    })
    .filter((t) => t.top)
    .sort((a, b) => (b.top?.confidence ?? 0) - (a.top?.confidence ?? 0))
  return { date, source, tips }
}

export function currentSource(): DataSource {
  return hasApiKey() || configuredAlternativeProviders().length ? 'api' : 'unavailable'
}
