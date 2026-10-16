import { NextResponse } from 'next/server'
import { getMatch } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const match = await getMatch(id)
  if (!match) return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 })
  return NextResponse.json(match)
}
