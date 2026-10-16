import { NextResponse, type NextRequest } from 'next/server'
import { getTips } from '@/lib/data'
import { todayKey } from '@/lib/demo'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  const valid = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayKey()
  return NextResponse.json(await getTips(valid))
}
