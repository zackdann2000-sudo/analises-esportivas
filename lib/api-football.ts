import 'server-only'
import {
  averagesFromForm,
  buildInsights,
  lineupFromList,
  predictFromAverages,
} from './analysis'
import { listApiConnections } from './db'
import type {
  FormItem,
  H2HItem,
  LeagueDetail,
  LeagueRef,
  Lineup,
  LineupPlayer,
  Match,
  MatchDetail,
  MatchEvent,
  MatchStatus,
  Position,
  Prediction,
  StandingRow,
  TeamDetail,
  TeamRef,
  TeamStats,
} from './types'

const BASE = 'https://v3.football.api-sports.io'
const TZ = 'America/Sao_Paulo'

export interface ApiKeyRef {
  key: string
  origin: 'painel' | 'env'
  name: string
}

export function getApiKeys(): ApiKeyRef[] {
  const keys: ApiKeyRef[] = listApiConnections()
    .filter((c) => c.provider === 'api-football' && c.enabled && c.key)
    .map((c) => ({ key: c.key, origin: 'painel', name: c.name }))
  const env = process.env.API_FOOTBALL_KEY
  if (env && !keys.some((k) => k.key === env)) keys.push({ key: env, origin: 'env', name: 'Variável de ambiente' })
  return keys
}

export function getApiKey(): ApiKeyRef | null {
  return getApiKeys()[0] ?? null
}

export function hasApiKey() {
  return getApiKeys().length > 0
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function callWithKey<T>(key: string, path: string, revalidate: number): Promise<T[]> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'x-apisports-key': key },
    next: { revalidate },
  })
  if (!res.ok) throw new Error(`API-Football ${res.status}`)
  const json = await res.json()
  const errors = json.errors && (Array.isArray(json.errors) ? json.errors : Object.values(json.errors))
  if (errors && errors.length) throw new Error(`API-Football: ${errors.join(', ')}`)
  return json.response as T[]
}

/** Tenta cada chave ativa na ordem de prioridade; se uma falhar (limite diário, chave suspensa), passa para a próxima. */
async function call<T = any>(path: string, revalidate = 60): Promise<T[]> {
  const keys = getApiKeys()
  if (!keys.length) throw new Error('API-Football: nenhuma chave configurada')
  let lastError: unknown
  for (const { key } of keys) {
    try {
      return await callWithKey<T>(key, path, revalidate)
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}

export async function apiStatus(key = getApiKey()?.key ?? '') {
  const res = await fetch(`${BASE}/status`, {
    headers: { 'x-apisports-key': key },
    cache: 'no-store',
  })
  const json = await res.json().catch(() => ({}))
  const r = json.response
  if (!r || Array.isArray(r)) {
    const errors = json.errors && (Array.isArray(json.errors) ? json.errors : Object.values(json.errors))
    return { ok: false as const, error: errors?.length ? errors.join(', ') : `Resposta inesperada (HTTP ${res.status})` }
  }
  return {
    ok: true as const,
    plan: r.subscription?.plan as string,
    end: r.subscription?.end as string,
    requestsToday: r.requests?.current as number,
    limitDay: r.requests?.limit_day as number,
    account: `${r.account?.firstname ?? ''} ${r.account?.lastname ?? ''}`.trim(),
  }
}

const shortName = (name: string) => name.replace(/[^A-Za-zÀ-ú]/g, '').slice(0, 3).toUpperCase()

const team = (t: any): TeamRef => ({ id: t.id, name: t.name, short: shortName(t.name), logo: t.logo })

const league = (l: any): LeagueRef => ({ id: l.id, name: l.name, country: l.country, logo: l.logo, flag: l.flag })

const STATUS_MAP: Record<string, MatchStatus> = {
  TBD: 'NS', NS: 'NS', '1H': '1H', HT: 'HT', '2H': '2H', ET: 'ET', BT: 'BT', P: 'P', SUSP: 'PST', INT: 'PST',
  FT: 'FT', AET: 'AET', PEN: 'PEN', PST: 'PST', CANC: 'CANC', ABD: 'CANC', AWD: 'FT', WO: 'FT', LIVE: '2H',
}

function eventType(e: any): MatchEvent['type'] | null {
  if (e.type === 'Goal') {
    if (e.detail === 'Own Goal') return 'own_goal'
    if (e.detail === 'Penalty') return 'penalty_goal'
    if (e.detail === 'Missed Penalty') return 'penalty_missed'
    return 'goal'
  }
  if (e.type === 'Card') return e.detail?.includes('Red') ? 'red' : 'yellow'
  if (e.type === 'subst') return 'sub'
  if (e.type === 'Var') return 'var'
  return null
}

function stats(list: any[]): TeamStats {
  const get = (type: string) => list.find((s: any) => s.type === type)?.value
  const num = (v: any) => (v == null ? 0 : typeof v === 'string' ? parseFloat(v) || 0 : Number(v))
  return {
    possession: num(get('Ball Possession')),
    shots: num(get('Total Shots')),
    shotsOnTarget: num(get('Shots on Goal')),
    corners: num(get('Corner Kicks')),
    fouls: num(get('Fouls')),
    offsides: num(get('Offsides')),
    yellow: num(get('Yellow Cards')),
    red: num(get('Red Cards')),
    saves: num(get('Goalkeeper Saves')),
    passes: num(get('Total passes')),
    passAccuracy: num(get('Passes %')),
    xg: get('expected_goals') != null ? num(get('expected_goals')) : null,
    dangerousAttacks: null,
    attacks: null,
  }
}

function normalizeFixture(item: any): Match {
  const homeId = item.teams.home.id
  const awayId = item.teams.away.id
  const events: MatchEvent[] = (item.events ?? [])
    .map((e: any, i: number): MatchEvent | null => {
      const type = eventType(e)
      if (!type) return null
      let teamId = e.team?.id
      if (type === 'own_goal') teamId = teamId === homeId ? awayId : homeId
      return {
        id: `${i}-${e.time?.elapsed}-${e.type}`,
        minute: e.time?.elapsed ?? 0,
        extra: e.time?.extra ?? null,
        teamId,
        type,
        player: e.player?.name ?? '—',
        assist: e.assist?.name ?? null,
      }
    })
    .filter(Boolean)

  let matchStats: Match['stats'] = null
  if (Array.isArray(item.statistics) && item.statistics.length === 2) {
    const h = item.statistics.find((s: any) => s.team.id === homeId)
    const a = item.statistics.find((s: any) => s.team.id === awayId)
    if (h && a) matchStats = { home: stats(h.statistics), away: stats(a.statistics) }
  }

  return {
    id: String(item.fixture.id),
    league: league(item.league),
    round: item.league.round ?? null,
    kickoff: item.fixture.date,
    status: STATUS_MAP[item.fixture.status.short] ?? 'NS',
    minute: item.fixture.status.elapsed ?? null,
    home: team(item.teams.home),
    away: team(item.teams.away),
    score: { home: item.goals.home, away: item.goals.away },
    halftime: item.score?.halftime ?? null,
    venue: item.fixture.venue?.name ?? null,
    referee: item.fixture.referee ?? null,
    events,
    stats: matchStats,
    pressure: null,
  }
}

function normalizeLineup(l: any): Lineup {
  const xi = l.startXI ?? []
  const withGrid = xi.every((p: any) => p.player.grid)
  if (!withGrid) {
    return lineupFromList(
      l.formation ?? '4-3-3',
      xi.map((p: any) => ({ name: p.player.name, number: p.player.number })),
      l.coach?.name,
    )
  }
  const posMap: Record<string, Position> = { G: 'G', D: 'D', M: 'M', F: 'F' }
  const players: LineupPlayer[] = xi.map((p: any) => {
    const [row, col] = String(p.player.grid).split(':').map(Number)
    return { name: p.player.name, number: p.player.number, pos: posMap[p.player.pos] ?? 'M', row: row - 1, col: col - 1 }
  })
  return { formation: l.formation, coach: l.coach?.name ?? null, players }
}

export async function apiMatchesByDate(date: string): Promise<Match[]> {
  const list = await call(`/fixtures?date=${date}&timezone=${TZ}`, 60)
  return list.map(normalizeFixture)
}

export async function apiLive(): Promise<Match[]> {
  const list = await call(`/fixtures?live=all&timezone=${TZ}`, 15)
  return list.map(normalizeFixture)
}

export async function apiMatchesByIds(ids: string[]): Promise<Match[]> {
  if (!ids.length) return []
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += 20) chunks.push(ids.slice(i, i + 20))
  const res = await Promise.all(chunks.map((c) => call(`/fixtures?ids=${c.join('-')}&timezone=${TZ}`, 15)))
  return res.flat().map(normalizeFixture)
}

function toForm(teamId: number, fixtures: Match[]): FormItem[] {
  return fixtures
    .filter((m) => m.score.home != null && m.score.away != null)
    .map((m) => {
      const home = m.home.id === teamId
      const gf = (home ? m.score.home : m.score.away) ?? 0
      const ga = (home ? m.score.away : m.score.home) ?? 0
      return {
        matchId: m.id,
        date: m.kickoff,
        opponent: home ? m.away : m.home,
        home,
        goalsFor: gf,
        goalsAgainst: ga,
        result: gf > ga ? 'V' : gf === ga ? 'E' : 'D',
      }
    })
}

async function lastFixtures(teamId: number, n = 10) {
  const list = await call(`/fixtures?team=${teamId}&last=${n}&timezone=${TZ}`, 3600)
  return list.map(normalizeFixture)
}

async function predictedLineup(teamId: number): Promise<Lineup | null> {
  const last = await call(`/fixtures?team=${teamId}&last=1&timezone=${TZ}`, 3600)
  const fixtureId = last[0]?.fixture?.id
  if (!fixtureId) return null
  const lineups = await call(`/fixtures/lineups?fixture=${fixtureId}&team=${teamId}`, 3600)
  return lineups[0] ? normalizeLineup(lineups[0]) : null
}

function pct(v: any) {
  return v ? parseInt(String(v), 10) || 0 : 0
}

export async function apiMatch(id: string): Promise<MatchDetail | null> {
  const [item] = await call(`/fixtures?id=${id}&timezone=${TZ}`, 15)
  if (!item) return null
  const match = normalizeFixture(item)

  const [homeLast, awayLast, predictionRes] = await Promise.all([
    lastFixtures(match.home.id).catch(() => []),
    lastFixtures(match.away.id).catch(() => []),
    call(`/predictions?fixture=${id}`, 3600).catch(() => []),
  ])

  const formHome = toForm(match.home.id, homeLast)
  const formAway = toForm(match.away.id, awayLast)
  const averages = { home: averagesFromForm(formHome), away: averagesFromForm(formAway) }

  const model = predictFromAverages(averages.home, averages.away)
  let prediction: Prediction = model
  const p = predictionRes[0]
  if (p?.predictions?.percent) {
    prediction = {
      ...model,
      percent: {
        home: pct(p.predictions.percent.home),
        draw: pct(p.predictions.percent.draw),
        away: pct(p.predictions.percent.away),
      },
      advice: p.predictions.advice ?? model.advice,
      source: 'api',
    }
  }

  const h2h: H2HItem[] = (p?.h2h ?? []).slice(0, 6).map((h: any) => ({
    date: h.fixture.date,
    home: team(h.teams.home),
    away: team(h.teams.away),
    score: { home: h.goals.home ?? 0, away: h.goals.away ?? 0 },
    league: h.league?.name ?? '',
  }))

  let lineups: MatchDetail['lineups'] = null
  let lineupStatus: MatchDetail['lineupStatus'] = 'indisponivel'
  if (Array.isArray(item.lineups) && item.lineups.length === 2) {
    const h = item.lineups.find((l: any) => l.team.id === match.home.id)
    const a = item.lineups.find((l: any) => l.team.id === match.away.id)
    if (h && a) {
      lineups = { home: normalizeLineup(h), away: normalizeLineup(a) }
      lineupStatus = 'confirmada'
    }
  }
  if (!lineups) {
    const [h, a] = await Promise.all([
      predictedLineup(match.home.id).catch(() => null),
      predictedLineup(match.away.id).catch(() => null),
    ])
    if (h && a) {
      lineups = { home: h, away: a }
      lineupStatus = 'prevista'
    }
  }

  return {
    ...match,
    lineups,
    lineupStatus,
    prediction,
    h2h,
    form: { home: formHome.slice(0, 5), away: formAway.slice(0, 5) },
    averages,
    insights: buildInsights(match, prediction, averages),
    source: 'api',
  }
}

export async function apiTeam(teamId: number): Promise<TeamDetail | null> {
  const [info] = await call(`/teams?id=${teamId}`, 86400)
  if (!info) return null
  const [last, next, coachRes, lineup] = await Promise.all([
    lastFixtures(teamId, 10).catch(() => []),
    call(`/fixtures?team=${teamId}&next=5&timezone=${TZ}`, 3600)
      .then((l) => l.map(normalizeFixture))
      .catch(() => []),
    call(`/coachs?team=${teamId}`, 86400).catch(() => []),
    predictedLineup(teamId).catch(() => null),
  ])
  const form = toForm(teamId, last)
  return {
    team: team(info.team),
    country: info.team.country,
    league: last[0]?.league ?? null,
    venue: info.venue?.name ?? null,
    founded: info.team.founded ?? null,
    coach: coachRes[0]?.name ?? null,
    form,
    upcoming: next,
    averages: averagesFromForm(form),
    lineup,
    source: 'api',
  }
}

function currentSeason(leagueCountry: string) {
  const now = new Date()
  const year = now.getUTCFullYear()
  const calendarYear = ['Brazil', 'Argentina', 'USA', 'Japan', 'China', 'Sweden', 'Norway', 'World']
  if (calendarYear.includes(leagueCountry)) return year
  return now.getUTCMonth() >= 6 ? year : year - 1
}

export async function apiLeague(leagueId: number): Promise<LeagueDetail | null> {
  const [info] = await call(`/leagues?id=${leagueId}`, 86400)
  if (!info) return null
  const season = info.seasons?.find((s: any) => s.current)?.year ?? currentSeason(info.country?.name)
  const [standingsRes, fixtures] = await Promise.all([
    call(`/standings?league=${leagueId}&season=${season}`, 1800).catch(() => []),
    call(`/fixtures?league=${leagueId}&season=${season}&next=10&timezone=${TZ}`, 600).catch(() => []),
  ])
  const rows: any[] = standingsRes[0]?.league?.standings?.[0] ?? []
  const standings: StandingRow[] = rows.map((r) => ({
    rank: r.rank,
    team: team(r.team),
    played: r.all.played,
    win: r.all.win,
    draw: r.all.draw,
    lose: r.all.lose,
    goalsFor: r.all.goals.for,
    goalsAgainst: r.all.goals.against,
    points: r.points,
    form: String(r.form ?? '')
      .split('')
      .map((c) => (c === 'W' ? 'V' : c === 'D' ? 'E' : 'D'))
      .slice(-5) as StandingRow['form'],
  }))
  return {
    league: { id: info.league.id, name: info.league.name, country: info.country.name, logo: info.league.logo, flag: info.country.flag },
    standings,
    matches: fixtures.map(normalizeFixture),
    source: 'api',
  }
}
