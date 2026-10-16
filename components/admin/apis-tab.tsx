'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Pause,
  Play,
  Plug,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  addApiConnection,
  removeApiConnection,
  reorderApiConnection,
  retestApiConnection,
  toggleApiConnection,
  type ActionResult,
} from '@/app/actions/admin'
import { FormMessage, SubmitButton } from '@/components/auth/field'
import { API_PROVIDERS, providerById, type ApiProviderId, type PublicApiConnection } from '@/lib/api-providers'
import { fetcher } from '@/lib/format'
import { cn } from '@/lib/utils'

interface StatusRes {
  provider: string
  configured: boolean
  source: 'api' | 'demo'
  status?: { ok: boolean; plan?: string; end?: string; requestsToday?: number; limitDay?: number; account?: string; error?: string }
}

const inputCls =
  'h-12 w-full rounded-lg border border-input bg-surface px-3.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/25'

export function ApiStatusCard() {
  const { data, isLoading, mutate } = useSWR<StatusRes>('/api/status', fetcher)
  const real = data?.source === 'api'
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', real ? 'bg-success/15' : 'bg-warning/15')}>
          <Plug className={cn('size-5', real ? 'text-success' : 'text-warning')} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Fonte dos dados do site</p>
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? 'Verificando…'
              : real
                ? 'API-Football conectada — dados reais'
                : data?.configured
                  ? `Chave principal com erro: ${data.status?.error ?? 'erro'}`
                  : 'Nenhuma chave da API-Football — exibindo simulação'}
          </p>
        </div>
        <button type="button" onClick={() => mutate()} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">
          Testar
        </button>
      </div>
      {real && data?.status && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['Plano', data.status.plan],
            ['Requisições hoje', `${data.status.requestsToday} / ${data.status.limitDay}`],
            ['Conta', data.status.account || '—'],
            ['Expira', data.status.end ? new Date(data.status.end).toLocaleDateString('pt-BR') : '—'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-surface p-2.5">
              <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
              <p className="truncate font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function AddApiForm({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(addApiConnection, {})
  const [provider, setProvider] = useState<ApiProviderId>('api-football')
  const [authMode, setAuthMode] = useState('header')
  const [fields, setFields] = useState({ name: '', key: '', baseUrl: '', authName: '' })
  const bind = (field: keyof typeof fields) => ({
    value: fields[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFields((f) => ({ ...f, [field]: e.target.value })),
  })
  const formRef = useRef<HTMLFormElement>(null)
  const { mutate } = useSWRConfig()
  const info = providerById(provider)!
  const isCustom = provider === 'custom'

  useEffect(() => {
    if (state.ok) {
      toast.success(state.ok)
      formRef.current?.reset()
      mutate('/api/status')
      onClose()
    }
  }, [state, mutate, onClose])

  return (
    <section className="rounded-xl border border-primary/40 bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <Plus className="size-4 text-primary" /> Nova API
        </h3>
        <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-lg p-1.5 text-muted-foreground">
          <X className="size-4" />
        </button>
      </div>

      <form ref={formRef} action={action} className="mt-3 flex flex-col gap-3">
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Provedor</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {API_PROVIDERS.map((p) => (
              <label
                key={p.id}
                className={cn(
                  'flex cursor-pointer flex-col rounded-lg border px-3 py-2 text-sm transition-colors',
                  provider === p.id ? 'border-primary bg-primary/10' : 'border-border bg-surface',
                )}
              >
                <input
                  type="radio"
                  name="provider"
                  value={p.id}
                  checked={provider === p.id}
                  onChange={() => setProvider(p.id)}
                  className="sr-only"
                />
                <span className="font-semibold">{p.label}</span>
                {p.feedsSite && <span className="text-[11px] text-primary">Alimenta o site</span>}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {info.description}
            {info.docsUrl && (
              <>
                {' '}
                <a href={info.docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-primary">
                  Obter chave <ExternalLink className="size-3" />
                </a>
              </>
            )}
          </p>
        </fieldset>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Nome (opcional)</span>
          <input name="name" {...bind('name')} maxLength={60} placeholder={`Ex.: ${info.label} conta 2`} className={inputCls} />
        </label>

        {isCustom && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">URL de teste da API</span>
              <input
                name="baseUrl"
                {...bind('baseUrl')}
                type="url"
                required
                inputMode="url"
                placeholder="https://api.exemplo.com/v1/status"
                className={cn(inputCls, 'font-mono text-sm')}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Enviar chave</span>
                <select name="authMode" value={authMode} onChange={(e) => setAuthMode(e.target.value)} className={inputCls}>
                  <option value="header">No header</option>
                  <option value="query">Na URL</option>
                  <option value="bearer">Bearer token</option>
                  <option value="none">Sem chave</option>
                </select>
              </label>
              {(authMode === 'header' || authMode === 'query') && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">{authMode === 'header' ? 'Nome do header' : 'Parâmetro'}</span>
                  <input
                    name="authName"
                    {...bind('authName')}
                    placeholder={authMode === 'header' ? 'x-api-key' : 'apikey'}
                    className={cn(inputCls, 'font-mono text-sm')}
                  />
                </label>
              )}
            </div>
          </>
        )}

        {!(isCustom && authMode === 'none') && (
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <KeyRound className="size-3.5" /> Chave
            </span>
            <input
              name="key"
              {...bind('key')}
              required
              autoComplete="off"
              spellCheck={false}
              placeholder={info.keyHint}
              className={cn(inputCls, 'font-mono')}
            />
          </label>
        )}

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="skipTest" className="size-4 accent-primary" />
          Salvar sem testar
        </label>

        <FormMessage error={state.error} />
        <SubmitButton pending={pending}>Testar e salvar</SubmitButton>
      </form>
    </section>
  )
}

function ConnectionCard({
  conn,
  index,
  total,
  primary,
}: {
  conn: PublicApiConnection
  index: number
  total: number
  primary: boolean
}) {
  const [pending, start] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const { mutate } = useSWRConfig()
  const info = providerById(conn.provider)

  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const res = await fn()
      if (res.error) toast.error(res.error)
      else if (res.ok) toast.success(res.ok)
      if (conn.provider === 'api-football') mutate('/api/status')
    })

  const test = conn.lastTest
  return (
    <li className={cn('rounded-xl border border-border bg-card p-3.5', !conn.enabled && 'opacity-60', pending && 'animate-pulse')}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg',
            !test ? 'bg-secondary' : test.ok ? 'bg-success/15' : 'bg-destructive/15',
          )}
        >
          {!test ? (
            <Plug className="size-4 text-muted-foreground" />
          ) : test.ok ? (
            <CheckCircle2 className="size-4 text-success" />
          ) : (
            <XCircle className="size-4 text-destructive" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-semibold">{conn.name}</p>
            {primary && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">Principal</span>}
            {!conn.enabled && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">Pausada</span>}
          </div>
          <p className="text-xs text-muted-foreground">
            {info?.label ?? conn.provider}
            {conn.baseUrl && <> · {new URL(conn.baseUrl).hostname}</>}
          </p>
          <code className="mt-1 block font-mono text-xs">{conn.masked}</code>
          <p className={cn('mt-1 text-xs', !test ? 'text-muted-foreground' : test.ok ? 'text-success' : 'text-destructive')}>
            {test ? test.message : 'Ainda não testada'}
            {test && (
              <span className="text-muted-foreground">
                {' '}
                · {new Date(test.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            )}
          </p>
        </div>
      </div>

      {confirming ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-sm">
          <span className="flex-1">Remover esta API?</span>
          <button type="button" onClick={() => setConfirming(false)} className="rounded-md px-3 py-1.5 text-xs font-semibold">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => run(() => removeApiConnection(conn.id))}
            className="rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-white"
          >
            Remover
          </button>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-1.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => retestApiConnection(conn.id))}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold"
          >
            <RefreshCw className="size-3.5" /> Testar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => toggleApiConnection(conn.id, !conn.enabled))}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold"
          >
            {conn.enabled ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {conn.enabled ? 'Pausar' : 'Ativar'}
          </button>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              disabled={pending || index === 0}
              onClick={() => run(() => reorderApiConnection(conn.id, -1))}
              aria-label="Subir prioridade"
              className="flex size-9 items-center justify-center rounded-lg border border-border disabled:opacity-30"
            >
              <ArrowUp className="size-4" />
            </button>
            <button
              type="button"
              disabled={pending || index === total - 1}
              onClick={() => run(() => reorderApiConnection(conn.id, 1))}
              aria-label="Descer prioridade"
              className="flex size-9 items-center justify-center rounded-lg border border-border disabled:opacity-30"
            >
              <ArrowDown className="size-4" />
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirming(true)}
              aria-label="Remover API"
              className="flex size-9 items-center justify-center rounded-lg border border-border text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

export function ApisTab({ connections, envKeyMasked }: { connections: PublicApiConnection[]; envKeyMasked: string | null }) {
  const [adding, setAdding] = useState(connections.length === 0 && !envKeyMasked)
  const [filter, setFilter] = useState<ApiProviderId | 'todas'>('todas')
  const primaryId = connections.find((c) => c.provider === 'api-football' && c.enabled)?.id
  const footballKeys = connections.filter((c) => c.provider === 'api-football' && c.enabled).length + (envKeyMasked ? 1 : 0)
  const providersInUse = API_PROVIDERS.filter((p) => connections.some((c) => c.provider === p.id))
  const visible = filter === 'todas' ? connections : connections.filter((c) => c.provider === filter)

  return (
    <div className="flex flex-col gap-3">
      <section className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex-1">
          <h3 className="font-semibold">Minhas APIs</h3>
          <p className="text-xs text-muted-foreground">
            {connections.length} conectada(s) · {footballKeys} chave(s) da API-Football ativa(s)
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="size-4" /> Adicionar
          </button>
        )}
      </section>

      {adding && <AddApiForm onClose={() => setAdding(false)} />}

      {providersInUse.length > 1 && (
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {[{ id: 'todas' as const, label: 'Todas' }, ...providersInUse].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setFilter(p.id)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold',
                filter === p.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {visible.length > 0 && (
        <ul className="flex flex-col gap-2">
          {visible.map((c) => (
            <ConnectionCard
              key={c.id}
              conn={c}
              index={connections.indexOf(c)}
              total={connections.length}
              primary={c.id === primaryId}
            />
          ))}
        </ul>
      )}

      {envKeyMasked && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card p-3.5 text-sm">
          <KeyRound className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">API-Football (variável de ambiente)</p>
            <code className="font-mono text-xs text-muted-foreground">{envKeyMasked}</code>
          </div>
          <span className="text-[11px] text-muted-foreground">Usada por último</span>
        </div>
      )}

      {connections.length === 0 && !envKeyMasked && !adding && (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhuma API adicionada. O site está mostrando a simulação.
        </p>
      )}

      <ApiStatusCard />

      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold">Como funciona</h3>
        <ul className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            <strong className="text-foreground">Várias chaves da API-Football:</strong> o site usa a de cima primeiro. Se ela
            atingir o limite diário ou falhar, passa automaticamente para a próxima.
          </li>
          <li>
            <strong className="text-foreground">Use as setas</strong> para mudar a prioridade e{' '}
            <strong className="text-foreground">Pausar</strong> para tirar uma chave do rodízio sem apagá-la.
          </li>
          <li>
            <strong className="text-foreground">Outros provedores</strong> ficam salvos e testados aqui, prontos para alimentar
            odds, escudos e ligas extras.
          </li>
        </ul>
        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          As chaves ficam só no servidor, aparecem mascaradas e nunca são enviadas ao navegador dos visitantes.
        </p>
      </section>
    </div>
  )
}
