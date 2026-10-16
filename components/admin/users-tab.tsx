'use client'

import { useActionState, useMemo, useState, useTransition } from 'react'
import {
  Ban,
  CalendarPlus,
  ChevronDown,
  KeyRound,
  LogOut,
  Search,
  Shield,
  ShieldOff,
  TimerOff,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  addDays,
  addUser,
  endAccess,
  grantPlan,
  logoutUser,
  removeUser,
  resetPassword,
  setRole,
  toggleBlock,
  type ActionResult,
} from '@/app/actions/admin'
import { Field, FormMessage, SubmitButton } from '@/components/auth/field'
import type { PublicUser } from '@/lib/db'
import { PLANS } from '@/lib/plans'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<PublicUser['status'], { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'bg-primary/15 text-primary' },
  ativo: { label: 'VIP ativo', className: 'bg-success/15 text-success' },
  teste: { label: 'Teste grátis', className: 'bg-warning/15 text-warning' },
  expirado: { label: 'Expirado', className: 'bg-destructive/15 text-destructive' },
  bloqueado: { label: 'Bloqueado', className: 'bg-muted text-muted-foreground' },
}

const FILTERS: { id: 'todos' | PublicUser['status'] | 'online'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'online', label: 'Online' },
  { id: 'ativo', label: 'VIP' },
  { id: 'teste', label: 'Teste' },
  { id: 'expirado', label: 'Expirados' },
  { id: 'bloqueado', label: 'Bloqueados' },
]

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }) : '—'

function AddUserForm() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(addUser, {})
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <Field label="Nome" name="name" required />
      <Field label="E-mail" name="email" type="email" required />
      <Field label="Senha" name="password" type="password" minLength={4} required />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Plano inicial</span>
        <select name="plan" defaultValue="vip-mensal" className="h-12 rounded-lg border border-input bg-surface px-3 text-base">
          <option value="sem-plano">Sem acesso</option>
          {PLANS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.durationDays} dia(s))
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="role" value="admin" className="size-4 accent-primary" />
        Tornar administrador
      </label>
      <div className="flex flex-col gap-3 sm:col-span-2">
        <FormMessage error={state.error} ok={state.ok} />
        <SubmitButton pending={pending}>Adicionar usuário</SubmitButton>
      </div>
    </form>
  )
}

function UserCard({ user, isSelf }: { user: PublicUser; isSelf: boolean }) {
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState('vip-mensal')
  const [pending, start] = useTransition()
  const status = STATUS_STYLE[user.status]

  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const res = await fn()
      if (res.error) toast.error(res.error)
      else if (res.ok) toast.success(res.ok)
    })

  const actionBtn = 'flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium disabled:opacity-50'

  return (
    <li className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50"
      >
        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary font-display font-bold">
          {user.name.charAt(0).toUpperCase()}
          {user.online && (
            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-success">
              <span className="sr-only">Online</span>
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-semibold">{user.name}</span>
            {isSelf && <span className="text-xs text-muted-foreground">(você)</span>}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
        </span>
        <span className="flex flex-col items-end gap-1">
          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', status.className)}>{status.label}</span>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {user.role === 'admin' ? 'Permanente' : `Até ${fmt(user.accessUntil)}`}
          </span>
        </span>
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="flex flex-col gap-3 bg-surface px-4 py-4">
          <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Cadastro</dt>
              <dd className="font-medium">{fmt(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Último acesso</dt>
              <dd className="font-medium">{fmt(user.lastSeenAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Login ativo</dt>
              <dd className="font-medium">{user.activeSessions > 0 ? `Sim (${user.activeSessions} aparelho(s))` : 'Não'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Plano</dt>
              <dd className="font-medium">
                {PLANS.find((p) => p.id === user.plan)?.name ??
                  ({ admin: 'Administrador', manual: 'Acesso liberado' } as Record<string, string>)[user.plan] ??
                  'Sem plano'}
              </dd>
            </div>
          </dl>

          {user.role !== 'admin' && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                aria-label="Plano a liberar"
                className="h-10 flex-1 rounded-lg border border-input bg-card px-3 text-sm"
              >
                {PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (+{p.durationDays} dia(s))
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => grantPlan(user.id, plan))}
                className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Liberar plano
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {user.role !== 'admin' && (
              <>
                <button type="button" disabled={pending} className={actionBtn} onClick={() => run(() => addDays(user.id, 1))}>
                  <CalendarPlus className="size-4" /> +1 dia
                </button>
                <button type="button" disabled={pending} className={actionBtn} onClick={() => run(() => addDays(user.id, 7))}>
                  <CalendarPlus className="size-4" /> +7 dias
                </button>
                <button type="button" disabled={pending} className={actionBtn} onClick={() => run(() => endAccess(user.id))}>
                  <TimerOff className="size-4" /> Expirar
                </button>
              </>
            )}
            <button type="button" disabled={pending} className={actionBtn} onClick={() => run(() => logoutUser(user.id))}>
              <LogOut className="size-4" /> Desconectar
            </button>
            <button
              type="button"
              disabled={pending}
              className={actionBtn}
              onClick={() => {
                const pwd = window.prompt(`Nova senha para ${user.email} (mínimo 4 caracteres):`)
                if (pwd) run(() => resetPassword(user.id, pwd))
              }}
            >
              <KeyRound className="size-4" /> Nova senha
            </button>
            {!isSelf && (
              <>
                <button
                  type="button"
                  disabled={pending}
                  className={actionBtn}
                  onClick={() => run(() => setRole(user.id, user.role === 'admin' ? 'user' : 'admin'))}
                >
                  {user.role === 'admin' ? <ShieldOff className="size-4" /> : <Shield className="size-4" />}
                  {user.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className={actionBtn}
                  onClick={() => run(() => toggleBlock(user.id, !user.blocked))}
                >
                  <Ban className="size-4" /> {user.blocked ? 'Desbloquear' : 'Bloquear'}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className={cn(actionBtn, 'border-destructive/40 text-destructive')}
                  onClick={() => {
                    if (window.confirm(`Excluir ${user.email}? Essa ação não pode ser desfeita.`)) run(() => removeUser(user.id))
                  }}
                >
                  <Trash2 className="size-4" /> Excluir
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

export function UsersTab({ users, currentAdminId }: { users: PublicUser[]; currentAdminId: string }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('todos')
  const [adding, setAdding] = useState(false)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (filter === 'online' ? !u.online : filter !== 'todos' && u.status !== filter) return false
      return !q || u.name.toLowerCase().includes(q) || u.email.includes(q)
    })
  }, [users, query, filter])

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-xl border border-border bg-card">
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          aria-expanded={adding}
          className="flex w-full items-center gap-2 px-4 py-3 font-semibold"
        >
          <UserPlus className="size-5 text-primary" />
          <span className="flex-1 text-left">Adicionar usuário</span>
          <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', adding && 'rotate-180')} />
        </button>
        {adding && (
          <div className="border-t border-border p-4">
            <AddUserForm />
          </div>
        )}
      </section>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou e-mail"
          aria-label="Buscar usuários"
          className="h-11 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => {
          const count = f.id === 'todos' ? users.length : f.id === 'online' ? users.filter((u) => u.online).length : users.filter((u) => u.status === f.id).length
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium',
                filter === f.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground',
              )}
            >
              {f.label} <span className="tabular-nums opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      <ul className="overflow-hidden rounded-xl border border-border bg-card">
        {visible.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</li>
        ) : (
          visible.map((u) => <UserCard key={u.id} user={u} isSelf={u.id === currentAdminId} />)
        )}
      </ul>
    </div>
  )
}
