'use server'

import { revalidatePath } from 'next/cache'
import { testConnection, validateCustomUrl } from '@/lib/api-connections'
import { providerById, type AuthMode } from '@/lib/api-providers'
import { requireAdmin } from '@/lib/auth'
import {
  addApiConnectionRecord,
  createUser,
  deleteApiConnection,
  deleteUser,
  expireAccess,
  extendAccess,
  findUserByEmail,
  getApiConnection,
  moveApiConnection,
  revokeSessions,
  setPassword,
  updateApiConnection,
  updateUser,
} from '@/lib/db'
import { PLANS } from '@/lib/plans'

export interface ActionResult {
  error?: string
  ok?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function done(ok: string): ActionResult {
  revalidatePath('/', 'layout')
  return { ok }
}

const AUTH_MODES: AuthMode[] = ['header', 'query', 'bearer', 'none']

export async function addApiConnection(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const provider = providerById(String(formData.get('provider') ?? ''))
  if (!provider) return { error: 'Escolha um provedor.' }

  const name = String(formData.get('name') ?? '').trim().slice(0, 60) || provider.label
  const key = String(formData.get('key') ?? '').trim()
  const isCustom = provider.id === 'custom'
  const authMode = isCustom ? (String(formData.get('authMode') ?? 'header') as AuthMode) : undefined
  const authName = isCustom ? String(formData.get('authName') ?? '').trim().slice(0, 60) : undefined
  const baseUrl = isCustom ? String(formData.get('baseUrl') ?? '').trim() : undefined
  const skipTest = formData.get('skipTest') === 'on'

  if (isCustom) {
    const urlError = validateCustomUrl(baseUrl ?? '')
    if (urlError) return { error: urlError }
    if (!AUTH_MODES.includes(authMode!)) return { error: 'Forma de autenticação inválida.' }
    if (authName && !/^[A-Za-z0-9_-]+$/.test(authName)) return { error: 'Nome do header/parâmetro inválido.' }
  }
  const needsKey = !(isCustom && authMode === 'none')
  if (needsKey && (!key || key.length > 300 || /\s/.test(key))) {
    return { error: 'Cole a chave sem espaços.' }
  }

  const draft = { provider: provider.id, name, key: needsKey ? key : '', baseUrl, authMode, authName, enabled: true }
  const test = skipTest ? null : await testConnection({ ...draft, id: 'draft', createdAt: '' })
  if (test && !test.ok) return { error: `Teste falhou: ${test.message} Corrija ou marque "Salvar sem testar".` }

  addApiConnectionRecord({ ...draft, lastTest: test ? { ...test, at: new Date().toISOString() } : undefined })
  return done(test ? `${name} adicionada. ${test.message}` : `${name} adicionada sem teste.`)
}

export async function retestApiConnection(id: string): Promise<ActionResult> {
  await requireAdmin()
  const conn = getApiConnection(id)
  if (!conn) return { error: 'Conexão não encontrada.' }
  const test = await testConnection(conn)
  updateApiConnection(id, { lastTest: { ...test, at: new Date().toISOString() } })
  revalidatePath('/', 'layout')
  return test.ok ? { ok: `${conn.name}: ${test.message}` } : { error: `${conn.name}: ${test.message}` }
}

export async function toggleApiConnection(id: string, enabled: boolean): Promise<ActionResult> {
  await requireAdmin()
  const conn = updateApiConnection(id, { enabled })
  return done(enabled ? `${conn.name} ativada.` : `${conn.name} pausada.`)
}

export async function reorderApiConnection(id: string, direction: -1 | 1): Promise<ActionResult> {
  await requireAdmin()
  moveApiConnection(id, direction === -1 ? -1 : 1)
  return done('Prioridade atualizada.')
}

export async function renameApiConnection(id: string, name: string): Promise<ActionResult> {
  await requireAdmin()
  const clean = name.trim().slice(0, 60)
  if (!clean) return { error: 'Informe um nome.' }
  updateApiConnection(id, { name: clean })
  return done('Nome atualizado.')
}

export async function removeApiConnection(id: string): Promise<ActionResult> {
  await requireAdmin()
  deleteApiConnection(id)
  return done('Conexão removida.')
}

export async function addUser(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const role = formData.get('role') === 'admin' ? 'admin' : 'user'
  const planId = String(formData.get('plan') ?? 'trial')
  const plan = PLANS.find((p) => p.id === planId)

  if (name.length < 2) return { error: 'Informe o nome.' }
  if (!EMAIL_RE.test(email)) return { error: 'E-mail inválido.' }
  if (password.length < 4) return { error: 'A senha precisa ter pelo menos 4 caracteres.' }
  if (findUserByEmail(email)) return { error: 'Este e-mail já está cadastrado.' }

  createUser({
    name,
    email,
    password,
    role,
    plan: role === 'admin' ? 'admin' : (plan?.id ?? 'sem-plano'),
    accessDays: role === 'admin' ? 0 : (plan?.durationDays ?? 0),
  })
  return done(`${name} foi adicionado.`)
}

export async function grantPlan(userId: string, planId: string): Promise<ActionResult> {
  await requireAdmin()
  const plan = PLANS.find((p) => p.id === planId)
  if (!plan) return { error: 'Plano inválido.' }
  extendAccess(userId, plan.durationDays, plan.id)
  return done(`${plan.name} liberado (+${plan.durationDays} dia(s)).`)
}

export async function addDays(userId: string, days: number): Promise<ActionResult> {
  await requireAdmin()
  if (!Number.isInteger(days) || days < 1 || days > 3650) return { error: 'Quantidade de dias inválida.' }
  extendAccess(userId, days, 'manual')
  return done(`+${days} dia(s) de acesso.`)
}

export async function endAccess(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.id === userId) return { error: 'Você não pode expirar o próprio acesso.' }
  expireAccess(userId)
  return done('Acesso expirado.')
}

export async function toggleBlock(userId: string, blocked: boolean): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.id === userId) return { error: 'Você não pode bloquear a própria conta.' }
  updateUser(userId, { blocked })
  return done(blocked ? 'Usuário bloqueado e desconectado.' : 'Usuário desbloqueado.')
}

export async function setRole(userId: string, role: 'admin' | 'user'): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.id === userId) return { error: 'Você não pode alterar o próprio cargo.' }
  updateUser(userId, { role, plan: role === 'admin' ? 'admin' : 'sem-plano' })
  return done(role === 'admin' ? 'Agora é administrador.' : 'Agora é usuário comum.')
}

export async function logoutUser(userId: string): Promise<ActionResult> {
  await requireAdmin()
  revokeSessions(userId)
  return done('Sessões encerradas.')
}

export async function resetPassword(userId: string, password: string): Promise<ActionResult> {
  await requireAdmin()
  if (password.length < 4 || password.length > 100) return { error: 'A senha precisa ter pelo menos 4 caracteres.' }
  setPassword(userId, password)
  return done('Senha redefinida.')
}

export async function removeUser(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (admin.id === userId) return { error: 'Você não pode excluir a própria conta.' }
  deleteUser(userId)
  return done('Usuário excluído.')
}
