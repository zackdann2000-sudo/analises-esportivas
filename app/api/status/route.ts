import { NextResponse } from 'next/server'
import { apiStatus, getApiKey } from '@/lib/api-football'

export const dynamic = 'force-dynamic'

export async function GET() {
  const current = getApiKey()
  if (!current) {
    return NextResponse.json({ provider: 'API-Football', configured: false, source: 'demo' })
  }
  try {
    const status = await apiStatus(current.key)
    return NextResponse.json({
      provider: 'API-Football',
      configured: true,
      origin: current.origin,
      source: status.ok ? 'api' : 'demo',
      status,
    })
  } catch (err) {
    return NextResponse.json({
      provider: 'API-Football',
      configured: true,
      origin: current.origin,
      source: 'demo',
      status: { ok: false, error: (err as Error).message },
    })
  }
}
