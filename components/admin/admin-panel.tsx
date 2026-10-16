'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, Crown, Database, LayoutDashboard, Plug, Users, XCircle } from 'lucide-react'
import type { PublicApiConnection } from '@/lib/api-providers'
import type { PublicUser } from '@/lib/db'
import { brl, PLANS, TRIAL_RULE } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { ApisTab, ApiStatusCard } from './apis-tab'
import { UsersTab } from './users-tab'

export type AdminTab = 'geral' | 'usuarios' | 'planos' | 'apis'

const TABS: { id: AdminTab; label: string; icon: typeof Users }[] = [
  { id: 'geral', label: 'Geral', icon: LayoutDashboard },
  { id: 'usuarios', label: 'Usuários', icon: Users },
  { id: 'planos', label: 'Planos', icon: Crown },
  { id: 'apis', label: 'APIs', icon: Plug },
]

function StorageNotice() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <Database className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <p className="text-xs leading-relaxed text-muted-foreground">
        As contas ficam salvas no servidor do site, com senhas criptografadas. Antes de publicar para o público, conecte um
        banco de dados (Neon) para que nenhum cadastro se perca quando o servidor reiniciar.
      </p>
    </div>
  )
}

function Overview({ users, onGo }: { users: PublicUser[]; onGo: (t: AdminTab) => void }) {
  const kpis = [
    { label: 'Usuários', icon: Users, value: users.length },
    { label: 'Online agora', icon: CheckCircle2, value: users.filter((u) => u.online).length },
    { label: 'Em teste grátis', icon: Clock, value: users.filter((u) => u.status === 'teste').length },
    { label: 'Assinantes VIP', icon: Crown, value: users.filter((u) => u.status === 'ativo').length },
    { label: 'Expirados', icon: XCircle, value: users.filter((u) => u.status === 'expirado').length },
  ]
  const recent = users.slice(0, 5)
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {kpis.map(({ label, icon: Icon, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-3">
            <Icon className="size-4 text-muted-foreground" />
            <p className="mt-2 font-display text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-4 pt-3">
          <h3 className="font-semibold">Últimos cadastros</h3>
          <button type="button" onClick={() => onGo('usuarios')} className="text-sm font-semibold text-primary">
            Ver todos
          </button>
        </div>
        <ul className="mt-2">
          {recent.map((u) => (
            <li key={u.id} className="flex items-center gap-3 border-t border-border px-4 py-2.5 text-sm">
              <span className={cn('size-2 shrink-0 rounded-full', u.online ? 'bg-success' : 'bg-muted-foreground/40')} />
              <span className="min-w-0 flex-1 truncate">{u.email}</span>
              <span className="text-xs capitalize text-muted-foreground">{u.status}</span>
            </li>
          ))}
        </ul>
      </section>
      <ApiStatusCard />
      <StorageNotice />
    </div>
  )
}

function PlansTab() {
  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold">Regra de teste grátis</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{TRIAL_RULE.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-secondary px-2.5 py-1">Duração: {TRIAL_RULE.days} dia</span>
          {TRIAL_RULE.allowedDomains.map((d) => (
            <span key={d} className="rounded-full bg-secondary px-2.5 py-1">
              @{d}
            </span>
          ))}
        </div>
      </section>
      <ul className="overflow-hidden rounded-xl border border-border bg-card">
        {PLANS.map((p) => (
          <li key={p.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
            <Crown className={cn('size-5', p.price ? 'text-warning' : 'text-muted-foreground')} />
            <div className="flex-1">
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-muted-foreground">Acesso por {p.durationDays} dia(s)</p>
            </div>
            <span className="font-display text-lg font-bold">{p.price ? brl(p.price) : 'Grátis'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AdminPanel({
  initialTab,
  users,
  connections,
  envKeyMasked,
  currentAdminId,
}: {
  initialTab: AdminTab
  users: PublicUser[]
  connections: PublicApiConnection[]
  envKeyMasked: string | null
  currentAdminId: string
}) {
  const [tab, setTab] = useState<AdminTab>(initialTab)
  return (
    <div className="flex flex-col gap-3 px-2 pt-3 lg:px-0 lg:pt-0">
      <header className="px-2 lg:px-0">
        <h1 className="font-display text-2xl font-bold">Painel do administrador</h1>
        <p className="text-sm text-muted-foreground">Usuários, planos, acessos e fontes de dados.</p>
      </header>
      <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              'flex flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold',
              tab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
            )}
          >
            <Icon className="hidden size-4 min-[400px]:block" />
            {label}
          </button>
        ))}
      </div>
      {tab === 'geral' && <Overview users={users} onGo={setTab} />}
      {tab === 'usuarios' && <UsersTab users={users} currentAdminId={currentAdminId} />}
      {tab === 'planos' && <PlansTab />}
      {tab === 'apis' && <ApisTab connections={connections} envKeyMasked={envKeyMasked} />}
    </div>
  )
}
