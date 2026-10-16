import { NextResponse } from 'next/server'
import { getTeam } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const team = await getTeam(Number(id))
  if (!team) return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 })
  return NextResponse.json(team)
}
