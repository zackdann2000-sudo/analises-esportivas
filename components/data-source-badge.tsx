'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { Database } from 'lucide-react'
import { fetcher } from '@/lib/format'
import { cn } from '@/lib/utils'

interface StatusRes {
  provider: string
  configured: boolean
  source: 'api' | 'demo'
}

export function DataSourceBadge({ compact = false }: { compact?: boolean }) {
  const { data } = useSWR<StatusRes>('/api/status', fetcher, { revalidateOnFocus: false })
  if (!data) return null
  const real = data.source === 'api'
  if (compact) {
    return (
      <Link
        href="/admin?tab=apis"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
          real ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning',
        )}
      >
        <span className={cn('size-1.5 rounded-full', real ? 'bg-success' : 'bg-warning')} />
        {real ? 'Dados reais' : 'Modo demonstração'}
      </Link>
    )
  }
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Database className="size-4 text-muted-foreground" />
        <p className="text-sm font-semibold">Fonte de dados</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {real
          ? `Conectado à ${data.provider}. Placar e estatísticas em tempo real.`
          : 'Exibindo simulação em tempo real. Conecte sua chave da API-Football para dados oficiais.'}
      </p>
      {!real && (
        <Link href="/admin?tab=apis" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
          Configurar API
        </Link>
      )}
    </div>
  )
}
