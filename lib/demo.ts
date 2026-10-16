import {
  averagesFromForm,
  buildInsights,
  lineupFromList,
  predictFromAverages,
} from './analysis'
import { LEAGUES, TEAMS, TEAMS_BY_ID, toTeamRef, type CatalogTeam } from './catalog'
import type {
  FormItem,
  H2HItem,
  LeagueDetail,
  Match,
  MatchDetail,
  MatchEvent,
  MatchStatus,
  StandingRow,
  TeamDetail,
  TeamStats,
} from './types'

function hash(str: string) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

function rng(seed: string) {
  let a = hash(seed)
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Rand = () => number

function samplePoisson(lambda: number, r: Rand) {
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= r()
  } while (p > L)
  return k - 1
}

function times(n: number, r: Rand, min = 1, max = 90) {
  return Array.from({ length: n }, () => Math.floor(min + r() * (max - min + 1))).sort((a, b) => a - b)
}

function shuffle<T>(arr: T[], r: Rand) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const pick = <T,>(arr: T[], r: Rand) => arr[Math.floor(r() * arr.length)]

export function todayKey(now = Date.now()) {
  const d = new Date(now - 3 * 3600_000)
  return d.toISOString().slice(0, 10)
}

export function shiftKey(key: string, days: number) {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

function dayStartMs(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d, 3, 0)
}

const REFEREES = [
  'Wilton Pereira Sampaio', 'Raphael Claus', 'Anderson Daronco', 'Michael Oliver', 'Anthony Taylor',
  'Jesús Gil Manzano', 'Daniele Orsato', 'Felix Zwayer', 'Szymon Marciniak', 'Bruno Arleu de Araújo',
]

interface SideTimeline {
  goals: { minute: number; type: MatchEvent['type']; player: string; assist: string | null }[]
  yellow: { minute: number; player: string }[]
  red: { minute: number; player: string }[]
  missedPen: { minute: number; player: string }[]
  shots: number[]
  sot: number[]
  corners: number[]
  fouls: number[]
  offsides: number[]
  da: number[]
  att: number[]
}

interface Fixture {
  id: string
  key: string
  leagueId: number
  home: CatalogTeam
  away: CatalogTeam
  kickoff: number
  referee: string
  possession: number
  passAccHome: number
  passAccAway: number
  timeline: { home: SideTimeline; away: SideTimeline }
}

function buildSide(team: CatalogTeam, opp: CatalogTeam, lambda: number, share: number, r: Rand): SideTimeline {
  const scorers = team.xi.slice(1)
  const forwards = scorers.slice(-3)
  const mids = scorers.slice(4, -3)
  const defs = scorers.slice(0, 4)
  const nGoals = samplePoisson(lambda, r)
  const goals = times(nGoals, r).map((minute) => {
    const roll = r()
    const pool = roll < 0.6 ? forwards : roll < 0.9 ? mids : defs
    const player = pick(pool.length ? pool : scorers, r)[0]
    const typeRoll = r()
    const type: MatchEvent['type'] = typeRoll < 0.1 ? 'penalty_goal' : typeRoll < 0.14 ? 'own_goal' : 'goal'
    const assistCandidate = pick(scorers, r)[0]
    return {
      minute,
      type,
      player: type === 'own_goal' ? pick(opp.xi.slice(1, 5), r)[0] : player,
      assist: type === 'goal' && r() < 0.7 && assistCandidate !== player ? assistCandidate : null,
    }
  })
  const yellow = times(samplePoisson(1.9, r), r).map((minute) => ({ minute, player: pick(scorers, r)[0] }))
  const red = r() < 0.06 ? times(1, r, 30, 90).map((minute) => ({ minute, player: pick(scorers, r)[0] })) : []
  const missedPen = r() < 0.05 ? times(1, r).map((minute) => ({ minute, player: pick(forwards, r)[0] })) : []

  const extraSot = samplePoisson(6 * share, r)
  const sot = [...goals.filter((g) => g.type !== 'own_goal').map((g) => g.minute), ...times(extraSot, r)].sort((a, b) => a - b)
  const shots = [...sot, ...times(samplePoisson(14 * share, r), r)].sort((a, b) => a - b)
  return {
    goals,
    yellow,
    red,
    missedPen,
    shots,
    sot,
    corners: times(samplePoisson(10 * share, r), r),
    fouls: times(samplePoisson(12 + (0.5 - share) * 6, r), r),
    offsides: times(samplePoisson(2.2, r), r),
    da: times(samplePoisson(100 * share, r), r),
    att: times(samplePoisson(200 * share, r), r),
  }
}

function buildFixture(key: string, leagueId: number, home: CatalogTeam, away: CatalogTeam, kickoff: number): Fixture {
  const id = `d-${key}-${home.id}-${away.id}`
  const r = rng(id)
  const diff = home.rating + 3 - away.rating
  const share = Math.min(0.7, Math.max(0.3, 0.5 + diff / 60))
  const lh = 1.3 * Math.exp(diff * 0.045)
  const la = 1.1 * Math.exp(-diff * 0.045)
  return {
    id,
    key,
    leagueId,
    home,
    away,
    kickoff,
    referee: pick(REFEREES, r),
    possession: Math.round(Math.min(72, Math.max(28, 50 + (share - 0.5) * 60 + (r() - 0.5) * 8))),
    passAccHome: Math.round(78 + r() * 12),
    passAccAway: Math.round(76 + r() * 12),
    timeline: {
      home: buildSide(home, away, lh, share, r),
      away: buildSide(away, home, la, 1 - share, r),
    },
  }
}

const dayCache = new Map<string, Fixture[]>()

function generateDay(key: string): Fixture[] {
  const cached = dayCache.get(key)
  if (cached) return cached
  const r = rng(`day-${key}`)
  const [y, m, d] = key.split('-').map(Number)
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  const ucl = weekday === 2 || weekday === 3
  const pairs: { league: number; home: CatalogTeam; away: CatalogTeam }[] = []

  const byLeague = (id: number) => TEAMS.filter((t) => t.league === id)
  const pairUp = (list: CatalogTeam[], league: number) => {
    const s = shuffle(list, r)
    for (let i = 0; i + 1 < s.length; i += 2) pairs.push({ league, home: s[i], away: s[i + 1] })
  }

  pairUp(byLeague(71), 71)
  if (ucl) {
    pairUp(TEAMS.filter((t) => t.league !== 71), 2)
  } else {
    for (const id of [39, 140, 135, 78]) pairUp(byLeague(id), id)
  }

  const ordered = shuffle(pairs, r)
  const start = dayStartMs(key)
  const fixtures = ordered.map((p, i) => buildFixture(key, p.league, p.home, p.away, start + 10 * 3600_000 + i * 50 * 60_000))
  if (dayCache.size > 120) dayCache.clear()
  dayCache.set(key, fixtures)
  return fixtures
}

function clock(kickoff: number, now: number): { status: MatchStatus; gm: number; minute: number | null } {
  const e = (now - kickoff) / 60_000
  if (e < 0) return { status: 'NS', gm: 0, minute: null }
  if (e < 47) {
    const gm = Math.min(45, Math.floor(e) + 1)
    return { status: '1H', gm, minute: gm }
  }
  if (e < 62) return { status: 'HT', gm: 45, minute: 45 }
  if (e < 111) {
    const gm = Math.min(90, 46 + Math.floor(e - 62))
    return { status: '2H', gm, minute: gm }
  }
  return { status: 'FT', gm: 90, minute: 90 }
}

const upTo = (arr: number[], gm: number) => arr.filter((m) => m <= gm).length

function sideStats(s: SideTimeline, gm: number, possession: number, passAcc: number, oppSot: number, oppGoals: number): TeamStats {
  const sot = upTo(s.sot, gm)
  const shots = upTo(s.shots, gm)
  const progress = gm / 90
  return {
    possession,
    shots,
    shotsOnTarget: sot,
    corners: upTo(s.corners, gm),
    fouls: upTo(s.fouls, gm),
    offsides: upTo(s.offsides, gm),
    yellow: s.yellow.filter((c) => c.minute <= gm).length,
    red: s.red.filter((c) => c.minute <= gm).length,
    saves: Math.max(0, oppSot - oppGoals),
    passes: Math.round(possession * 9.5 * progress),
    passAccuracy: passAcc,
    xg: Number((sot * 0.28 + (shots - sot) * 0.06).toFixed(2)),
    dangerousAttacks: upTo(s.da, gm),
    attacks: upTo(s.att, gm),
  }
}

function materialize(f: Fixture, now: number): Match {
  const { status, gm, minute } = clock(f.kickoff, now)
  const homeRef = toTeamRef(f.home)
  const awayRef = toTeamRef(f.away)
  const events: MatchEvent[] = []
  const push = (side: 'home' | 'away') => {
    const s = f.timeline[side]
    const teamId = side === 'home' ? f.home.id : f.away.id
    s.goals.forEach((g, i) =>
      events.push({ id: `${side}-g${i}`, minute: g.minute, teamId, type: g.type, player: g.player, assist: g.assist }),
    )
    s.yellow.forEach((c, i) => events.push({ id: `${side}-y${i}`, minute: c.minute, teamId, type: 'yellow', player: c.player }))
    s.red.forEach((c, i) => events.push({ id: `${side}-r${i}`, minute: c.minute, teamId, type: 'red', player: c.player }))
    s.missedPen.forEach((c, i) =>
      events.push({ id: `${side}-mp${i}`, minute: c.minute, teamId, type: 'penalty_missed', player: c.player }),
    )
  }
  push('home')
  push('away')
  const visible = events.filter((e) => e.minute <= gm).sort((a, b) => a.minute - b.minute)
  const goalsFor = (teamId: number, limit: number) =>
    visible.filter((e) => e.teamId === teamId && e.minute <= limit && ['goal', 'own_goal', 'penalty_goal'].includes(e.type)).length

  const started = status !== 'NS'
  const hg = goalsFor(f.home.id, gm)
  const ag = goalsFor(f.away.id, gm)

  let stats: Match['stats'] = null
  let pressure: Match['pressure'] = null
  if (started) {
    const hs = sideStats(f.timeline.home, gm, f.possession, f.passAccHome, upTo(f.timeline.away.sot, gm), ag)
    const as = sideStats(f.timeline.away, gm, 100 - f.possession, f.passAccAway, upTo(f.timeline.home.sot, gm), hg)
    stats = { home: hs, away: as }
    pressure = []
    for (let m = 5; m <= Math.max(5, gm); m += 5) {
      const inBucket = (arr: number[]) => arr.filter((x) => x > m - 5 && x <= m).length
      pressure.push({
        minute: m,
        home: inBucket(f.timeline.home.da) + inBucket(f.timeline.home.shots) * 2,
        away: inBucket(f.timeline.away.da) + inBucket(f.timeline.away.shots) * 2,
      })
    }
  }

  return {
    id: f.id,
    league: LEAGUES[f.leagueId],
    round: f.leagueId === 2 ? 'Fase de liga' : `Rodada ${(hash(f.key) % 30) + 5}`,
    kickoff: new Date(f.kickoff).toISOString(),
    status,
    minute,
    home: homeRef,
    away: awayRef,
    score: started ? { home: hg, away: ag } : { home: null, away: null },
    halftime: gm >= 45 ? { home: goalsFor(f.home.id, 45), away: goalsFor(f.away.id, 45) } : null,
    venue: f.home.venue,
    referee: f.referee,
    events: visible,
    stats,
    pressure,
  }
}

export function getDemoMatches(key: string, now = Date.now()): Match[] {
  return generateDay(key).map((f) => materialize(f, now))
}

export function getDemoLive(now = Date.now()): Match[] {
  const today = todayKey(now)
  return [...getDemoMatches(shiftKey(today, -1), now), ...getDemoMatches(today, now)].filter((m) =>
    ['1H', 'HT', '2H'].includes(m.status),
  )
}

function findFixture(id: string) {
  const m = id.match(/^d-(\d{4}-\d{2}-\d{2})-(\d+)-(\d+)$/)
  if (!m) return null
  return generateDay(m[1]).find((f) => f.id === id) ?? null
}

function teamHistory(teamId: number, fromKey: string, days: number, now: number) {
  const out: { match: Match; fixture: Fixture }[] = []
  for (let i = 1; i <= days; i++) {
    const key = shiftKey(fromKey, -i)
    const f = generateDay(key).find((x) => x.home.id === teamId || x.away.id === teamId)
    if (f) out.push({ fixture: f, match: materialize(f, now) })
  }
  return out.filter((x) => x.match.status === 'FT')
}

function toForm(teamId: number, items: { match: Match }[]): FormItem[] {
  return items.map(({ match }) => {
    const home = match.home.id === teamId
    const gf = (home ? match.score.home : match.score.away) ?? 0
    const ga = (home ? match.score.away : match.score.home) ?? 0
    return {
      matchId: match.id,
      date: match.kickoff,
      opponent: home ? match.away : match.home,
      home,
      goalsFor: gf,
      goalsAgainst: ga,
      result: gf > ga ? 'V' : gf === ga ? 'E' : 'D',
    }
  })
}

function teamAverages(teamId: number, items: { match: Match }[]) {
  const corners: number[] = []
  const cards: number[] = []
  items.forEach(({ match }) => {
    if (!match.stats) return
    const s = match.home.id === teamId ? match.stats.home : match.stats.away
    corners.push(s.corners)
    cards.push(s.yellow + s.red)
  })
  return averagesFromForm(toForm(teamId, items), { corners, cards })
}

function syntheticH2H(a: CatalogTeam, b: CatalogTeam): H2HItem[] {
  const r = rng(`h2h-${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}`)
  const base = new Date('2026-01-01').getTime()
  return Array.from({ length: 5 }, (_, i) => {
    const homeTeam = r() > 0.5 ? a : b
    const awayTeam = homeTeam === a ? b : a
    const diff = homeTeam.rating + 3 - awayTeam.rating
    return {
      date: new Date(base - (i * 160 + Math.floor(r() * 60)) * 86_400_000).toISOString(),
      home: toTeamRef(homeTeam),
      away: toTeamRef(awayTeam),
      score: {
        home: samplePoisson(1.3 * Math.exp(diff * 0.045), r),
        away: samplePoisson(1.1 * Math.exp(-diff * 0.045), r),
      },
      league: homeTeam.league === awayTeam.league ? LEAGUES[homeTeam.league].name : 'Amistoso',
    }
  })
}

export function getDemoMatchLite(id: string, now = Date.now()): Match | null {
  const f = findFixture(id)
  return f ? materialize(f, now) : null
}

export function getDemoMatch(id: string, now = Date.now()): MatchDetail | null {
  const f = findFixture(id)
  if (!f) return null
  const match = materialize(f, now)
  const homeHist = teamHistory(f.home.id, f.key, 10, now)
  const awayHist = teamHistory(f.away.id, f.key, 10, now)
  const averages = { home: teamAverages(f.home.id, homeHist), away: teamAverages(f.away.id, awayHist) }
  const prediction = predictFromAverages(averages.home, averages.away)
  const toList = (t: CatalogTeam) => t.xi.map(([name, number]) => ({ name, number }))
  const kickoffSoon = f.kickoff - now < 60 * 60_000
  return {
    ...match,
    lineups: {
      home: lineupFromList(f.home.formation, toList(f.home), f.home.coach),
      away: lineupFromList(f.away.formation, toList(f.away), f.away.coach),
    },
    lineupStatus: kickoffSoon ? 'confirmada' : 'prevista',
    prediction,
    h2h: syntheticH2H(f.home, f.away),
    form: { home: toForm(f.home.id, homeHist.slice(0, 5)), away: toForm(f.away.id, awayHist.slice(0, 5)) },
    averages,
    insights: buildInsights(match, prediction, averages),
    source: 'demo',
  }
}

export function getDemoTeam(teamId: number, now = Date.now()): TeamDetail | null {
  const t = TEAMS_BY_ID.get(teamId)
  if (!t) return null
  const today = todayKey(now)
  const hist = teamHistory(teamId, shiftKey(today, 1), 11, now).slice(0, 10)
  const upcoming: Match[] = []
  for (let i = 0; i <= 6 && upcoming.length < 5; i++) {
    const f = generateDay(shiftKey(today, i)).find((x) => x.home.id === teamId || x.away.id === teamId)
    if (f) {
      const m = materialize(f, now)
      if (m.status !== 'FT') upcoming.push(m)
    }
  }
  return {
    team: toTeamRef(t),
    country: LEAGUES[t.league].country,
    league: LEAGUES[t.league],
    venue: t.venue,
    founded: t.founded,
    coach: t.coach,
    form: toForm(teamId, hist),
    upcoming,
    averages: teamAverages(teamId, hist),
    lineup: lineupFromList(t.formation, t.xi.map(([name, number]) => ({ name, number })), t.coach),
    source: 'demo',
  }
}

export function getDemoLeague(leagueId: number, now = Date.now()): LeagueDetail | null {
  const league = LEAGUES[leagueId]
  if (!league) return null
  const today = todayKey(now)
  const table = new Map<number, StandingRow>()
  const teamsInLeague = leagueId === 2 ? TEAMS.filter((t) => t.league !== 71) : TEAMS.filter((t) => t.league === leagueId)
  teamsInLeague.forEach((t) =>
    table.set(t.id, { rank: 0, team: toTeamRef(t), played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0, points: 0, form: [] }),
  )
  for (let i = 0; i <= 40; i++) {
    for (const f of generateDay(shiftKey(today, -i))) {
      if (f.leagueId !== leagueId) continue
      const m = materialize(f, now)
      if (m.status !== 'FT') continue
      const h = table.get(m.home.id)
      const a = table.get(m.away.id)
      if (!h || !a) continue
      const hs = m.score.home ?? 0
      const as = m.score.away ?? 0
      h.played++
      a.played++
      h.goalsFor += hs
      h.goalsAgainst += as
      a.goalsFor += as
      a.goalsAgainst += hs
      if (hs > as) {
        h.win++; a.lose++; h.points += 3
        if (h.form.length < 5) h.form.push('V')
        if (a.form.length < 5) a.form.push('D')
      } else if (hs < as) {
        a.win++; h.lose++; a.points += 3
        if (h.form.length < 5) h.form.push('D')
        if (a.form.length < 5) a.form.push('V')
      } else {
        h.draw++; a.draw++; h.points++; a.points++
        if (h.form.length < 5) h.form.push('E')
        if (a.form.length < 5) a.form.push('E')
      }
    }
  }
  const standings = [...table.values()]
    .sort((x, y) => y.points - x.points || y.goalsFor - y.goalsAgainst - (x.goalsFor - x.goalsAgainst) || y.goalsFor - x.goalsFor)
    .map((row, i) => ({ ...row, rank: i + 1 }))

  const matches: Match[] = []
  for (let i = -1; i <= 3; i++) {
    getDemoMatches(shiftKey(today, i), now)
      .filter((m) => m.league.id === leagueId)
      .forEach((m) => matches.push(m))
  }
  return { league, standings, matches, source: 'demo' }
}

export function getDemoTeamsList() {
  return TEAMS.map((t) => ({ ...toTeamRef(t), league: LEAGUES[t.league] }))
}
