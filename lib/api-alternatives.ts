import 'server-only'
import { listApiConnections } from './db'
import type { Match, MatchStatus } from './types'

const TZ = 'America/Sao_Paulo'
type Provider = 'sportmonks' | 'football-data'
type Connection = { provider: Provider; key: string; name: string }

function connections(): Connection[] {
  return listApiConnections()
    .filter((c) => (c.provider === 'sportmonks' || c.provider === 'football-data') && c.enabled && c.key.trim())
    .map((c) => ({ provider: c.provider as Provider, key: c.key.trim(), name: c.name }))
}

export function configuredAlternativeProviders() {
  return connections().map((c) => c.provider)
}

const statusMap: Record<string, MatchStatus> = {
  NS: 'NS', NOT_STARTED: 'NS', SCHEDULED: 'NS', TIMED: 'NS', TBD: 'NS',
  LIVE: '2H', IN_PLAY: '2H', '1H': '1H', FIRST_HALF: '1H', HT: 'HT', HALF_TIME: 'HT',
  '2H': '2H', SECOND_HALF: '2H', ET: 'ET', EXTRA_TIME: 'ET', PEN: 'PEN', PENALTIES: 'PEN',
  FT: 'FT', FINISHED: 'FT', AET: 'AET', AFTER_EXTRA_TIME: 'AET',
  PST: 'PST', POSTPONED: 'PST', SUSP: 'PST', SUSPENDED: 'PST', INT: 'PST',
  CANC: 'CANC', CANCELLED: 'CANC', CANCELED: 'CANC', ABANDONED: 'CANC',
}
const status = (value: unknown): MatchStatus => statusMap[String(value ?? '').toUpperCase()] ?? 'NS'
const shortName = (name: string) => name.replace(/[^A-Za-zÀ-ú]/g, '').slice(0, 3).toUpperCase()
const emptyStats = null

function shiftDate(date: string, offset: number) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10)
}

function localDateKey(value: string) {
  const parsed = new Date(value)
  if (!value || Number.isNaN(parsed.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(parsed)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

function isOnSelectedLocalDate(match: Match, date: string) {
  return localDateKey(match.kickoff) === date
}

function normalizeFootballData(item: any): Match {
  const home = item.homeTeam ?? {}
  const away = item.awayTeam ?? {}
  const comp = item.competition ?? {}
  const state = status(item.status)
  const scoreHome = item.score?.fullTime?.home ?? item.score?.regularTime?.home ?? null
  const scoreAway = item.score?.fullTime?.away ?? item.score?.regularTime?.away ?? null
  return {
    id: `fd-${item.id}`,
    league: { id: Number(comp.id ?? 0), name: comp.name ?? 'Competição', country: comp.area?.name ?? '', logo: comp.emblem ?? '' },
    round: item.matchday ? `Rodada ${item.matchday}` : null,
    kickoff: item.utcDate,
    status: state,
    minute: null,
    home: { id: Number(home.id ?? 0), name: home.name ?? 'Time não informado', short: shortName(home.shortName ?? home.name ?? 'N/D'), logo: home.crest ?? '' },
    away: { id: Number(away.id ?? 0), name: away.name ?? 'Time não informado', short: shortName(away.shortName ?? away.name ?? 'N/D'), logo: away.crest ?? '' },
    score: { home: Number.isFinite(scoreHome) ? scoreHome : null, away: Number.isFinite(scoreAway) ? scoreAway : null },
    halftime: { home: item.score?.halfTime?.home ?? null, away: item.score?.halfTime?.away ?? null },
    venue: null, referee: null, events: [], stats: emptyStats, pressure: null,
  }
}

function normalizeSportmonks(item: any): Match {
  const participants = Array.isArray(item.participants) ? item.participants : []
  const home = participants.find((p: any) => p.meta?.location === 'home') ?? participants[0] ?? {}
  const away = participants.find((p: any) => p.meta?.location === 'away') ?? participants[1] ?? {}
  const stateValue = item.state?.developer_name ?? item.state?.short_name ?? item.state?.name ?? item.status
  const state = status(stateValue)
  const scores = Array.isArray(item.scores) ? item.scores : []
  const current = scores.find((s: any) => ['CURRENT', 'CURRENT_SCORE'].includes(String(s.description ?? '').toUpperCase()))
  const firstHalfHome = scores.find((s: any) => s.participant_id === home.id && /1ST_HALF|HALF_TIME/i.test(String(s.description ?? '')))
  const firstHalfAway = scores.find((s: any) => s.participant_id === away.id && /1ST_HALF|HALF_TIME/i.test(String(s.description ?? '')))
  const scoreFor = (participantId: number) => {
    const entry = current && current.participant_id === participantId ? current : scores.find((s: any) => s.participant_id === participantId && /CURRENT/i.test(String(s.description ?? '')))
    const value = entry?.score?.goals ?? entry?.score?.score ?? null
    return Number.isFinite(Number(value)) && value !== null ? Number(value) : null
  }
  const league = item.league ?? {}
  const homeName = home.name ?? home.short_code ?? 'Time não informado'
  const awayName = away.name ?? away.short_code ?? 'Time não informado'
  const kickoff = item.starting_at ? (() => {
    const raw = String(item.starting_at).trim()
    // Sportmonks may return a wall-clock timestamp in the requested timezone without an offset.
    // Interpret that value as São Paulo time instead of accidentally treating it as UTC.
    const hasTimezone = /(?:Z|[+-]\\d{2}:?\\d{2})$/i.test(raw)
    const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
    const parsed = new Date(hasTimezone ? normalized : normalized + '-03:00')
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
  })() : ''
  return {
    id: `sm-${item.id}`,
    league: { id: Number(league.id ?? 0), name: league.name ?? 'Competição', country: league.country?.name ?? '', logo: league.image_path ?? '' },
    round: item.round?.name ?? null,
    kickoff,
    status: state,
    minute: item.periods?.find((p: any) => p.ticking)?.minutes ?? null,
    home: { id: Number(home.id ?? 0), name: homeName, short: shortName(homeName), logo: home.image_path ?? '' },
    away: { id: Number(away.id ?? 0), name: awayName, short: shortName(awayName), logo: away.image_path ?? '' },
    score: { home: scoreFor(Number(home.id)), away: scoreFor(Number(away.id)) },
    halftime: { home: firstHalfHome?.score?.goals ?? null, away: firstHalfAway?.score?.goals ?? null },
    venue: item.venue?.name ?? null, referee: null, events: [], stats: emptyStats, pressure: null,
  }
}

async function fetchProvider(c: Connection, date: string, live: boolean): Promise<Match[]> {
  if (c.provider === 'football-data') {
    const url = new URL('https://api.football-data.org/v4/matches')
    if (live) url.searchParams.set('status', 'IN_PLAY,PAUSED')
    else {
      // The API's date filters use UTC days; fetch both UTC dates that can overlap
      // the selected São Paulo day, then keep all match statuses for that local date.
      url.searchParams.set('dateFrom', date)
      url.searchParams.set('dateTo', shiftDate(date, 1))
    }
    const res = await fetch(url, { headers: { 'X-Auth-Token': c.key }, cache: 'no-store', signal: AbortSignal.timeout(12_000) })
    if (!res.ok) throw new Error(`Football-Data.org HTTP ${res.status}`)
    const json = await res.json()
    const matches = (Array.isArray(json.matches) ? json.matches : [])
      .map(normalizeFootballData)
      .filter((match: Match) => Boolean(match.kickoff))
    return live ? matches : matches.filter((match: Match) => isOnSelectedLocalDate(match, date))
  }

  const url = new URL(live ? 'https://api.sportmonks.com/v3/football/livescores' : `https://api.sportmonks.com/v3/football/fixtures/date/${date}`)
  url.searchParams.set('api_token', c.key)
  url.searchParams.set('include', 'participants;scores;league;state;venue;periods')
  url.searchParams.set('timezone', TZ)
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(12_000) })
  if (!res.ok) throw new Error(`Sportmonks HTTP ${res.status}`)
  const json = await res.json()
  if (json?.message && !Array.isArray(json?.data)) throw new Error(String(json.message))
  const matches = (Array.isArray(json.data) ? json.data : [])
    .map(normalizeSportmonks)
    .filter((match: Match) => Boolean(match.kickoff))
  return live ? matches : matches.filter((match: Match) => isOnSelectedLocalDate(match, date))
}

/** Só retorna dados vindos de provedores reais configurados no painel. */
export async function alternativeMatches(date: string, live = false): Promise<{ data: Match[]; provider: Provider } | null> {
  const list = connections()
  const order: Provider[] = ['sportmonks', 'football-data']
  const ordered = order.flatMap((provider) => list.filter((c) => c.provider === provider))
  let emptyResult: { data: Match[]; provider: Provider } | null = null
  for (const connection of ordered) {
    try {
      const data = await fetchProvider(connection, date, live)
      if (data.length > 0) {
        data.sort((a, b) => a.kickoff.localeCompare(b.kickoff))
        return { data, provider: connection.provider }
      }
      emptyResult = { data, provider: connection.provider }
    } catch (error) {
      console.error(`[Match Lens] ${connection.provider} falhou:`, (error as Error).message)
    }
  }
  return emptyResult
}
