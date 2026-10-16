import type { Match } from './types'

const TZ = 'America/Sao_Paulo'

export function todayKeyClient(offsetDays = 0) {
  const d = new Date(Date.now() - 3 * 3600_000 + offsetDays * 86_400_000)
  return d.toISOString().slice(0, 10)
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(new Date(iso))
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' }) {
  return new Intl.DateTimeFormat('pt-BR', { ...opts, timeZone: TZ }).format(new Date(iso))
}

export function formatDayKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d, 12))
  return {
    weekday: new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(date).replace('.', ''),
    day: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(date),
  }
}

export function statusLabel(m: Pick<Match, 'status' | 'minute' | 'kickoff'>) {
  switch (m.status) {
    case 'NS':
      return formatTime(m.kickoff)
    case '1H':
    case '2H':
    case 'ET':
      return `${m.minute ?? ''}'`
    case 'HT':
      return 'Int.'
    case 'BT':
      return 'Int. Prorr.'
    case 'P':
      return 'Pên.'
    case 'FT':
      return 'Fim'
    case 'AET':
      return 'Prorr.'
    case 'PEN':
      return 'Pên.'
    case 'PST':
      return 'Adiado'
    case 'CANC':
      return 'Canc.'
    default:
      return ''
  }
}

export const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Erro ao carregar')
  return res.json()
}
