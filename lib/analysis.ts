import type {
  FormItem,
  Insight,
  Lineup,
  LineupPlayer,
  Match,
  Position,
  Prediction,
  TeamAverages,
} from './types'

function factorial(n: number) {
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

export function poisson(k: number, lambda: number) {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k)
}

const round = (n: number) => Math.round(n * 100)

export function predictFromLambdas(lh: number, la: number): Prediction {
  let home = 0
  let draw = 0
  let away = 0
  let over15 = 0
  let over25 = 0
  let btts = 0
  let best = { p: 0, score: '1-1' }
  for (let h = 0; h <= 8; h++) {
    for (let a = 0; a <= 8; a++) {
      const p = poisson(h, lh) * poisson(a, la)
      if (h > a) home += p
      else if (h === a) draw += p
      else away += p
      if (h + a >= 2) over15 += p
      if (h + a >= 3) over25 += p
      if (h > 0 && a > 0) btts += p
      if (p > best.p) best = { p, score: `${h}-${a}` }
    }
  }
  const total = home + draw + away
  const percent = {
    home: round(home / total),
    draw: round(draw / total),
    away: round(away / total),
  }
  let advice = 'Jogo equilibrado — considere Dupla Chance'
  if (percent.home >= 55) advice = 'Vitória do mandante'
  else if (percent.away >= 55) advice = 'Vitória do visitante'
  else if (percent.home + percent.draw >= 72) advice = 'Dupla chance: mandante ou empate'
  else if (percent.away + percent.draw >= 72) advice = 'Dupla chance: visitante ou empate'
  return {
    percent,
    expectedGoals: { home: Number(lh.toFixed(2)), away: Number(la.toFixed(2)) },
    over15: round(over15),
    over25: round(over25),
    btts: round(btts),
    likelyScore: best.score,
    advice,
    source: 'modelo',
  }
}

export function averagesFromForm(
  form: FormItem[],
  extra?: { corners?: number[]; cards?: number[] },
): TeamAverages | null {
  if (!form.length) return null
  const n = form.length
  const avg = (arr: number[]) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null)
  return {
    goalsFor: form.reduce((s, f) => s + f.goalsFor, 0) / n,
    goalsAgainst: form.reduce((s, f) => s + f.goalsAgainst, 0) / n,
    over25Rate: form.filter((f) => f.goalsFor + f.goalsAgainst >= 3).length / n,
    bttsRate: form.filter((f) => f.goalsFor > 0 && f.goalsAgainst > 0).length / n,
    cleanSheetRate: form.filter((f) => f.goalsAgainst === 0).length / n,
    corners: extra?.corners ? avg(extra.corners) : null,
    cards: extra?.cards ? avg(extra.cards) : null,
  }
}

export function predictFromAverages(home: TeamAverages | null, away: TeamAverages | null) {
  const hf = home?.goalsFor ?? 1.4
  const ha = home?.goalsAgainst ?? 1.1
  const af = away?.goalsFor ?? 1.2
  const aa = away?.goalsAgainst ?? 1.3
  const lh = Math.max(0.2, ((hf + aa) / 2) * 1.1)
  const la = Math.max(0.2, ((af + ha) / 2) * 0.92)
  return predictFromLambdas(lh, la)
}

export function buildInsights(
  match: Pick<Match, 'home' | 'away'>,
  prediction: Prediction | null,
  averages: { home: TeamAverages | null; away: TeamAverages | null },
): Insight[] {
  const out: Insight[] = []
  if (!prediction) return out
  const { percent } = prediction

  if (percent.home >= 50) {
    out.push({
      id: 'winner-home',
      market: 'Resultado final',
      pick: `${match.home.name} vence`,
      confidence: percent.home,
      reason: `Modelo Poisson aponta ${percent.home}% de vitória do mandante (xG ${prediction.expectedGoals.home} x ${prediction.expectedGoals.away}).`,
      tone: 'green',
    })
  } else if (percent.away >= 50) {
    out.push({
      id: 'winner-away',
      market: 'Resultado final',
      pick: `${match.away.name} vence`,
      confidence: percent.away,
      reason: `Visitante superior: ${percent.away}% de vitória estimada.`,
      tone: 'green',
    })
  } else {
    const homeSide = percent.home >= percent.away
    out.push({
      id: 'double-chance',
      market: 'Dupla chance',
      pick: homeSide ? `${match.home.name} ou empate` : `${match.away.name} ou empate`,
      confidence: homeSide ? percent.home + percent.draw : percent.away + percent.draw,
      reason: 'Partida equilibrada — a dupla chance reduz o risco.',
      tone: 'blue',
    })
  }

  if (prediction.over25 >= 55) {
    out.push({
      id: 'over25',
      market: 'Gols',
      pick: 'Mais de 2.5 gols',
      confidence: prediction.over25,
      reason: `Soma de gols esperada de ${(prediction.expectedGoals.home + prediction.expectedGoals.away).toFixed(2)}.`,
      tone: 'green',
    })
  } else if (prediction.over15 >= 68) {
    out.push({
      id: 'over15',
      market: 'Gols',
      pick: 'Mais de 1.5 gols',
      confidence: prediction.over15,
      reason: 'Linha mais segura para jogos com média moderada de gols.',
      tone: 'blue',
    })
  } else {
    out.push({
      id: 'under25',
      market: 'Gols',
      pick: 'Menos de 2.5 gols',
      confidence: 100 - prediction.over25,
      reason: 'Defesas sólidas e baixa média ofensiva recente.',
      tone: 'blue',
    })
  }

  if (prediction.btts >= 52) {
    out.push({
      id: 'btts',
      market: 'Ambas marcam',
      pick: 'Sim',
      confidence: prediction.btts,
      reason: 'Os dois ataques marcaram com frequência nos últimos jogos.',
      tone: 'green',
    })
  } else if (prediction.btts <= 40) {
    out.push({
      id: 'btts-no',
      market: 'Ambas marcam',
      pick: 'Não',
      confidence: 100 - prediction.btts,
      reason: 'Ao menos um dos lados costuma passar em branco.',
      tone: 'neutral',
    })
  }

  const ch = averages.home?.corners
  const ca = averages.away?.corners
  if (ch != null && ca != null) {
    const sum = ch + ca
    const line = Math.floor(sum - 1) + 0.5
    out.push({
      id: 'corners',
      market: 'Escanteios',
      pick: `Mais de ${line} escanteios`,
      confidence: Math.min(82, Math.round(55 + (sum - line) * 9)),
      reason: `Média combinada de ${sum.toFixed(1)} escanteios por jogo.`,
      tone: 'blue',
    })
  }

  const kh = averages.home?.cards
  const ka = averages.away?.cards
  if (kh != null && ka != null) {
    const sum = kh + ka
    const line = Math.floor(sum - 0.5) + 0.5
    out.push({
      id: 'cards',
      market: 'Cartões',
      pick: `Mais de ${line} cartões`,
      confidence: Math.min(78, Math.round(52 + (sum - line) * 10)),
      reason: `Média combinada de ${sum.toFixed(1)} cartões por partida.`,
      tone: 'neutral',
    })
  }

  return out.sort((a, b) => b.confidence - a.confidence)
}

export interface LiveSignals {
  pressureHome: number
  pressureAway: number
  appmHome: number | null
  appmAway: number | null
  cgHome: number
  cgAway: number
  alerts: { label: string; tone: 'green' | 'blue' | 'live' }[]
}

export function liveSignals(match: Match): LiveSignals | null {
  if (!match.stats) return null
  const minute = Math.max(1, match.minute ?? 1)
  const { home, away } = match.stats
  const cgHome = home.shots + home.corners
  const cgAway = away.shots + away.corners

  let pressureHome = home.shotsOnTarget * 3 + home.shots + home.corners * 1.5
  let pressureAway = away.shotsOnTarget * 3 + away.shots + away.corners * 1.5
  if (match.pressure?.length) {
    const recent = match.pressure.slice(-3)
    pressureHome = recent.reduce((s, p) => s + p.home, 0) + 2
    pressureAway = recent.reduce((s, p) => s + p.away, 0) + 2
  }
  const max = Math.max(pressureHome + pressureAway, 1)
  const ph = Math.round((pressureHome / max) * 100)
  const pa = 100 - ph

  const appmHome = home.dangerousAttacks != null ? home.dangerousAttacks / minute : null
  const appmAway = away.dangerousAttacks != null ? away.dangerousAttacks / minute : null

  const alerts: LiveSignals['alerts'] = []
  const sh = match.score.home ?? 0
  const sa = match.score.away ?? 0
  const live = ['1H', '2H', 'ET'].includes(match.status)
  if (live) {
    if ((appmHome ?? 0) >= 1 && ph >= 62) alerts.push({ label: `Pressão forte: ${match.home.short}`, tone: 'live' })
    if ((appmAway ?? 0) >= 1 && pa >= 62) alerts.push({ label: `Pressão forte: ${match.away.short}`, tone: 'live' })
    if (sh === sa && minute >= 60 && cgHome + cgAway >= 22) alerts.push({ label: 'Gol tardio provável', tone: 'green' })
    if (match.status === '1H' && sh + sa === 0 && minute >= 25 && cgHome + cgAway >= 12)
      alerts.push({ label: 'Over 0.5 HT', tone: 'green' })
    if (home.corners + away.corners >= Math.round(minute / 8)) alerts.push({ label: 'Ritmo alto de escanteios', tone: 'blue' })
    const favLosing =
      (home.shotsOnTarget > away.shotsOnTarget * 2 && sh < sa) ||
      (away.shotsOnTarget > home.shotsOnTarget * 2 && sa < sh)
    if (favLosing) alerts.push({ label: 'Domínio sem placar', tone: 'green' })
  }

  return { pressureHome: ph, pressureAway: pa, appmHome, appmAway, cgHome, cgAway, alerts }
}

function rowsFromFormation(formation: string) {
  const parts = formation
    .split('-')
    .map((x) => parseInt(x, 10))
    .filter((n) => !Number.isNaN(n))
  const sum = parts.reduce((s, n) => s + n, 0)
  if (sum !== 10) return [1, 4, 3, 3]
  return [1, ...parts]
}

export function lineupFromList(
  formation: string,
  list: { name: string; number?: number | null }[],
  coach?: string | null,
): Lineup {
  const rows = rowsFromFormation(formation)
  const players: LineupPlayer[] = []
  let idx = 0
  rows.forEach((count, r) => {
    for (let c = 0; c < count; c++) {
      const p = list[idx++]
      if (!p) continue
      let pos: Position = 'M'
      if (r === 0) pos = 'G'
      else if (r === 1) pos = 'D'
      else if (r === rows.length - 1) pos = 'F'
      players.push({ name: p.name, number: p.number ?? null, pos, row: r, col: c })
    }
  })
  return { formation, coach: coach ?? null, players }
}

export function isLive(status: Match['status']) {
  return ['1H', 'HT', '2H', 'ET', 'BT', 'P'].includes(status)
}

export function isFinished(status: Match['status']) {
  return ['FT', 'AET', 'PEN'].includes(status)
}
