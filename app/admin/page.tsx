import type { Metadata } from 'next'
import { AdminPanel, type AdminTab } from '@/components/admin/admin-panel'
import { requireAdmin } from '@/lib/auth'
import { listApiConnections, listUsers, maskKey, toPublicConnection } from '@/lib/db'

export const metadata: Metadata = { title: 'Painel do administrador', robots: { index: false } }

const TABS: AdminTab[] = ['geral', 'usuarios', 'planos', 'apis']

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const admin = await requireAdmin()
  const { tab } = await searchParams
  const initial = TABS.includes(tab as AdminTab) ? (tab as AdminTab) : 'geral'
  const envKey = process.env.API_FOOTBALL_KEY

  return (
    <AdminPanel
      initialTab={initial}
      users={listUsers()}
      connections={listApiConnections().map(toPublicConnection)}
      envKeyMasked={envKey ? maskKey(envKey) : null}
      currentAdminId={admin.id}
    />
  )
}
