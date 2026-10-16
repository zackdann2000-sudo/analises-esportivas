import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Safe deployment diagnostic only. This endpoint deliberately does not expose
 * DATABASE_URL or claim PostgreSQL is connected: the current lib/db.ts adapter
 * still uses temporary JSON storage until the migration is implemented.
 */
export async function GET() {
  const databaseUrl = process.env.DATABASE_URL?.trim()
  const postgresConfigured = Boolean(databaseUrl)
  const postgresUrlLooksValid = Boolean(databaseUrl && /^postgres(?:ql)?:\/\//i.test(databaseUrl))

  return NextResponse.json(
    {
      ok: true,
      storage: 'temporary-json',
      postgresConfigured,
      postgresUrlLooksValid,
      postgresConnected: false,
      message: postgresConfigured
        ? 'DATABASE_URL está definida, mas o aplicativo ainda não usa PostgreSQL.'
        : 'DATABASE_URL não está definida no ambiente deste deploy.',
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  )
}
