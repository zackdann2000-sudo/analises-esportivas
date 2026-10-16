import { NextResponse, type NextRequest } from 'next/server'
import { getLive, getMatches, getMatchesByIds } from '@/lib/data'
import { todayKey } from '@/lib/demo'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const ids = params.get('ids')
  if (ids) {
    const list = ids.split(',').filter(Boolean).slice(0, 40)
    const matches = await getMatchesByIds(list)
    return NextResponse.json({ matches })
  }
  if (params.get('live') === '1') {
    const { data, source } = await getLive()
    return NextResponse.json({ date: todayKey(), source, matches: data })
  }
  const date = params.get('date')
  const valid = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayKey()
  const { data, source } = await getMatches(valid)
  return NextResponse.json({ date: valid, source, matches: data })
}
