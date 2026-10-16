import { NextResponse, type NextRequest } from 'next/server'
import { getLive, getMatches, getMatchesByIds } from '@/lib/data'
import { todayKey } from '@/lib/demo'

export const dynamic = 'force-dynamic'

const MAX_MATCH_IDS = 40

function isRealDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
}

function validMatchId(value: string) {
  // API-Football IDs are numeric; demo fixtures use the d- prefix.
  return /^\d{1,15}$/.test(value) || /^d-[a-zA-Z0-9-]{1,35}$/.test(value)
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const ids = params.get('ids')

  if (ids !== null) {
    const list = [...new Set(ids.split(',').map((id) => id.trim()).filter(validMatchId))]
      .slice(0, MAX_MATCH_IDS)
    if (!list.length) {
      return NextResponse.json({ matches: [], error: 'Informe IDs de partidas válidos.' }, { status: 400 })
    }
    const matches = await getMatchesByIds(list)
    return NextResponse.json({ matches })
  }

  if (params.get('live') === '1') {
    const { data, source } = await getLive()
    return NextResponse.json({ date: todayKey(), source, matches: data })
  }

  const requestedDate = params.get('date')
  if (requestedDate !== null && !isRealDate(requestedDate)) {
    return NextResponse.json(
      { error: 'Data inválida. Use o formato AAAA-MM-DD e uma data existente.' },
      { status: 400 },
    )
  }
  const date = isRealDate(requestedDate) ? requestedDate : todayKey()
  const { data, source } = await getMatches(date)
  return NextResponse.json({ date, source, matches: data })
}
