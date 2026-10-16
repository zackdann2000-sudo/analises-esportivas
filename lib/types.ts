export type MatchStatus =
  | 'NS'
  | '1H'
  | 'HT'
  | '2H'
  | 'ET'
  | 'BT'
  | 'P'
  | 'FT'
  | 'AET'
  | 'PEN'
  | 'PST'
  | 'CANC'

export type DataSource = 'api' | 'demo'

export interface LeagueRef {
  id: number
  name: string
  country: string
  logo: string
  flag?: string | null
}

export interface TeamRef {
  id: number
  name: string
  short: string
  logo: string
}

export type EventType =
  | 'goal'
  | 'own_goal'
  | 'penalty_goal'
  | 'penalty_missed'
  | 'yellow'
  | 'red'
  | 'sub'
  | 'var'

export interface MatchEvent {
  id: string
  minute: number
  extra?: number | null
  teamId: number
  type: EventType
  player: string
  assist?: string | null
}

export interface TeamStats {
  possession: number
  shots: number
  shotsOnTarget: number
  corners: number
  fouls: number
  offsides: number
  yellow: number
  red: number
  saves: number
  passes: number
  passAccuracy: number
  xg: number | null
  dangerousAttacks: number | null
  attacks: number | null
}

export interface PressurePoint {
  minute: number
  home: number
  away: number
}

export interface Match {
  id: string
  league: LeagueRef
  round?: string | null
  kickoff: string
  status: MatchStatus
  minute: number | null
  home: TeamRef
  away: TeamRef
  score: { home: number | null; away: number | null }
  halftime?: { home: number | null; away: number | null } | null
  venue?: string | null
  referee?: string | null
  events: MatchEvent[]
  stats: { home: TeamStats; away: TeamStats } | null
  pressure: PressurePoint[] | null
}

export type Position = 'G' | 'D' | 'M' | 'F'

export interface LineupPlayer {
  name: string
  number?: number | null
  pos: Position
  row: number
  col: number
}

export interface Lineup {
  formation: string
  coach?: string | null
  players: LineupPlayer[]
}

export type FormResult = 'V' | 'E' | 'D'

export interface FormItem {
  matchId: string
  date: string
  opponent: TeamRef
  home: boolean
  goalsFor: number
  goalsAgainst: number
  result: FormResult
}

export interface H2HItem {
  date: string
  home: TeamRef
  away: TeamRef
  score: { home: number; away: number }
  league: string
}

export interface Prediction {
  percent: { home: number; draw: number; away: number }
  expectedGoals: { home: number; away: number }
  over15: number
  over25: number
  btts: number
  likelyScore: string
  advice: string
  source: 'api' | 'modelo'
}

export interface TeamAverages {
  goalsFor: number
  goalsAgainst: number
  corners: number | null
  cards: number | null
  over25Rate: number
  bttsRate: number
  cleanSheetRate: number
}

export interface Insight {
  id: string
  market: string
  pick: string
  confidence: number
  reason: string
  tone: 'green' | 'blue' | 'neutral'
}

export interface MatchDetail extends Match {
  lineups: { home: Lineup; away: Lineup } | null
  lineupStatus: 'confirmada' | 'prevista' | 'indisponivel'
  prediction: Prediction | null
  h2h: H2HItem[]
  form: { home: FormItem[]; away: FormItem[] }
  averages: { home: TeamAverages | null; away: TeamAverages | null }
  insights: Insight[]
  source: DataSource
}

export interface StandingRow {
  rank: number
  team: TeamRef
  played: number
  win: number
  draw: number
  lose: number
  goalsFor: number
  goalsAgainst: number
  points: number
  form: FormResult[]
}

export interface TeamDetail {
  team: TeamRef
  country: string
  league: LeagueRef | null
  venue?: string | null
  founded?: number | null
  coach?: string | null
  form: FormItem[]
  upcoming: Match[]
  averages: TeamAverages | null
  lineup: Lineup | null
  source: DataSource
}

export interface LeagueDetail {
  league: LeagueRef
  standings: StandingRow[]
  matches: Match[]
  source: DataSource
}

export interface MatchesResponse {
  date: string
  source: DataSource
  matches: Match[]
}
