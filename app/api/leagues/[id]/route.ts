import { NextResponse } from 'next/server'
import { getLeague } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const league = await getLeague(Number(id))
  if (!league) return NextResponse.json({ error: 'Liga não encontrada' }, { status: 404 })
  return NextResponse.json(league)
}
