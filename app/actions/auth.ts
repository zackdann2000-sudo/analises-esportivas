'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser, sessionCookieOptions } from '@/lib/auth'
import {
  authenticate,
  createSession,
  createUser,
  deleteAllSessions,
  deleteSession,
  findUserByEmail,
  hasAccess,
  isTrialEligible,
  SESSION_COOKIE,
  setPassword,
  verifyPassword,
} from '@/lib/db'

export interface FormState {
  error?: string
  ok?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_ATTEMPTS = 5
const WINDOW_MS = 10 * 60_000

const attempts = new Map<string, { count: number; until: number }>()

// Limpeza periódica para evitar vazamento de memória.
// Em serverless isso não persiste entre invocações; use Redis/DB se for o caso.
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [k, v] of attempts) if (v.until < now) attempts.delete(k)
  }, 60_000)

  // unref só existe no Node; em runtime Edge o timer é ignorado.
  // O cast evita o erro "Unused '@ts-expect-error' directive" que o tsc reporta
  // quando a linha seguinte não gera erro de tipo.
  ;(timer as { unref?: () => void }).unref?.()
}

function rateLimited(key: string) {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.until < now) return false
  return entry.count >= MAX_ATTEMPTS
}

function registerFailure(key: string) {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.until < now) {
    attempts.set(key, { count: 1, until: now + WINDOW_MS })
  } else {
    entry.count++
  }
}

function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === 'string' ? next : ''
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return '/'
  }
  return value
}

async function startSession(userId: string) {
  const { token, expiresAt } = createSession(userId)
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt))
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!EMAIL_RE.test(email) || email.length > 120 || !password) {
    return { error: 'Informe e-mail e senha.' }
  }

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  const key = `${email}|${ip}`
  if (rateLimited(key)) {
    return { error: 'Muitas tentativas. Aguarde 10 minutos e tente novamente.' }
  }

  const user = authenticate(email, password)
  if (!user) {
    registerFailure(key)
    return { error: 'E-mail ou senha incorretos.' }
  }
  if (user.blocked) {
    return { error: 'Esta conta está bloqueada. Fale com o administrador.' }
  }

  attempts.delete(key)
  await startSession(user.id)

  // Usuário sem acesso ganha sessão para conseguir ver a página /vip.
  if (!hasAccess(user)) redirect('/vip?expirado=1')

  const isAdminDefault = user.role === 'admin' && !formData.get('next')
  redirect(isAdminDefault ? '/admin' : safeNext(formData.get('next')))
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (name.length < 2 || name.length > 60) {
    return { error: 'Informe seu nome (2 a 60 caracteres).' }
  }
  if (!EMAIL_RE.test(email) || email.length > 120) {
    return { error: 'E-mail inválido.' }
  }
  if (password.length < 6 || password.length > 100) {
    return { error: 'A senha precisa ter entre 6 e 100 caracteres.' }
  }

  // Checagem antecipada só por UX; a garantia real é o UNIQUE no banco.
  if (findUserByEmail(email)) {
    return { error: 'Este e-mail já tem cadastro. Faça login.' }
  }

  let user
  try {
    user = createUser({ name, email, password })
  } catch (e) {
    // Corrida: outra requisição criou o usuário entre o findUserByEmail e o createUser.
    if (findUserByEmail(email)) {
      return { error: 'Este e-mail já tem cadastro. Faça login.' }
    }
    throw e
  }

  await startSession(user.id)
  redirect(isTrialEligible(email) ? '/?bemvindo=1' : '/vip?novo=1')
}

export async function signOut() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) deleteSession(token)
  jar.delete(SESSION_COOKIE)
  redirect('/entrar')
}

export async function changeOwnPassword(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) redirect('/entrar')

  const current = String(formData.get('current') ?? '')
  const next = String(formData.get('password') ?? '')

  // Usa verifyPassword dedicado para não acionar o rate limit do login.
  if (!verifyPassword(user.id, current)) {
    return { error: 'Senha atual incorreta.' }
  }
  if (next.length < 6 || next.length > 100) {
    return { error: 'A nova senha precisa ter entre 6 e 100 caracteres.' }
  }

  setPassword(user.id, next)
  deleteAllSessions(user.id) // cumpre a promessa da mensagem abaixo
  await startSession(user.id)
  return { ok: 'Senha alterada. Outras sessões foram encerradas.' }
  }
