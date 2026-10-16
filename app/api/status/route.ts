import { NextResponse } from 'next/server'
import { apiStatus, getApiKey } from '@/lib/api-football'
import { configuredAlternativeProviders } from '@/lib/api-alternatives'
import { listApiConnections } from '@/lib/db'
import { testConnection } from '@/lib/api-connections'

export const dynamic = 'force-dynamic'

export async function GET() {
  const current = getApiKey()
  if (current) {
    try {
      const status = await apiStatus(current.key)
      if (status.ok) {
        return NextResponse.json({ provider: 'API-Football', configured: true, source: 'api', status })
      }
    } catch {
      // Try another configured provider below.
    }
  }

  const enabled = listApiConnections().filter((c) =>
    c.enabled && c.key && ['sportmonks', 'football-data'].includes(c.provider),
  )
  for (const connection of enabled) {
    try {
      const result = await testConnection(connection)
      if (result.ok) {
        const label = connection.provider === 'sportmonks' ? 'Sportmonks' : 'Football-Data.org'
        return NextResponse.json({
          provider: label,
          configured: true,
          source: 'api',
          status: { ok: true, message: result.message },
        })
      }
    } catch {
      // Continue to the next enabled provider.
    }
  }

  const configured = Boolean(current) || configuredAlternativeProviders().length > 0
  return NextResponse.json({
    provider: configured ? 'APIs configuradas' : 'Nenhuma API',
    configured,
    source: 'unavailable',
    status: { ok: false, error: configured ? 'Nenhuma API configurada respondeu. Verifique a chave, o plano e a conexão.' : 'Adicione uma chave válida em Gerenciar APIs.' },
  })
}
