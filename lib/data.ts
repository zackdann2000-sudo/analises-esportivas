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
import {
  getDemoLeague,
  getDemoLive,
  getDemoMatch,
  getDemoMatchLite,
  getDemoMatches,
  getDemoTeam,
} from './demo'
import type { DataSource, LeagueDetail, Match, MatchDetail, TeamDetail } from './types'

async function withFallback<T>(real: () => Promise<T>, demo: () => T): Promise<{ data: T; source: DataSource }> {
  if (!hasApiKey()) return { data: demo(), source: 'demo' }
  try {
    return { data: await real(), source: 'api' }
  } catch (err) {
    console.error('[v0] API-Football falhou, usando demonstração:', (err as Error).message)
    return { data: demo(), source: 'demo' }
  }
}

export function getMatches(date: string) {
  return withFallback(() => apiMatchesByDate(date), () => getDemoMatches(date))
}

export async function getLive() {
  const res = await withFallback(apiLive, () => getDemoLive())
  if (res.source === 'api' && res.data.length) {
    const ids = res.data.slice(0, 20).map((m) => m.id)
    const detailed = await apiMatchesByIds(ids).catch(() => [])
    const byId = new Map(detailed.map((m) => [m.id, m]))
    res.data = res.data.map((m) => byId.get(m.id) ?? m)
  }
  return res
}

export async function getMatchesByIds(ids: string[]) {
  const demoIds = ids.filter((id) => id.startsWith('d-'))
  const apiIds = ids.filter((id) => !id.startsWith('d-'))
  const demo = demoIds.map((id) => getDemoMatchLite(id)).filter(Boolean) as Match[]
  const real = apiIds.length && hasApiKey() ? await apiMatchesByIds(apiIds).catch(() => []) : []
  return [...demo, ...real]
}

export async function getMatch(id: string): Promise<MatchDetail | null> {
  if (id.startsWith('d-')) return getDemoMatch(id)
  if (!hasApiKey()) return null
  try {
    return await apiMatch(id)
  } catch (err) {
    console.error('[v0] Falha ao buscar partida:', (err as Error).message)
    return null
  }
}

export async function getTeam(id: number): Promise<TeamDetail | null> {
  const res = await withFallback(() => apiTeam(id), () => getDemoTeam(id))
  return res.data ?? getDemoTeam(id)
}

export async function getLeague(id: number): Promise<LeagueDetail | null> {
  const res = await withFallback(() => apiLeague(id), () => getDemoLeague(id))
  return res.data ?? getDemoLeague(id)
}

export async function getTips(date: string) {
  const { data: matches, source } = await getMatches(date)
  const priority = [71, 2, 13, 39, 140, 135, 78, 61]
  const candidates = matches
    .filter((m) => m.status === 'NS' || ['1H', 'HT', '2H'].includes(m.status))
    .sort((a, b) => {
      const ra = priority.indexOf(a.league.id)
      const rb = priority.indexOf(b.league.id)
      return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb)
    })
    .slice(0, source === 'api' ? 6 : 16)
  const details = await Promise.all(candidates.map((m) => getMatch(m.id).catch(() => null)))
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
  return hasApiKey() ? 'api' : 'demo'
}
