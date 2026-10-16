'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser, sessionCookieOptions } from '@/lib/auth'
import {
  authenticate,
  createSession,
  createUser,
  deleteSession,
  findUserByEmail,
  hasAccess,
  isTrialEligible,
  SESSION_COOKIE,
  setPassword,
} from '@/lib/db'

export interface FormState {
  error?: string
  ok?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const attempts = new Map<string, { count: number; until: number }>()

function rateLimited(key: string) {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.until < now) return false
  return entry.count >= 5
}

function registerFailure(key: string) {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.until < now) attempts.set(key, { count: 1, until: now + 10 * 60_000 })
  else entry.count++
}

function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === 'string' ? next : ''
  return value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

async function startSession(userId: string) {
  const { token, expiresAt } = createSession(userId)
  ;(await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt))
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!EMAIL_RE.test(email) || !password) return { error: 'Informe e-mail e senha.' }

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0] ?? 'local'
  const key = `${email}|${ip}`
  if (rateLimited(key)) return { error: 'Muitas tentativas. Aguarde 10 minutos e tente novamente.' }

  const user = authenticate(email, password)
  if (!user) {
    registerFailure(key)
    return { error: 'E-mail ou senha incorretos.' }
  }
  if (user.blocked) return { error: 'Esta conta está bloqueada. Fale com o administrador.' }

  attempts.delete(key)
  await startSession(user.id)
  if (!hasAccess(user)) redirect('/vip?expirado=1')
  redirect(user.role === 'admin' && !formData.get('next') ? '/admin' : safeNext(formData.get('next')))
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (name.length < 2 || name.length > 60) return { error: 'Informe seu nome (2 a 60 caracteres).' }
  if (!EMAIL_RE.test(email) || email.length > 120) return { error: 'E-mail inválido.' }
  if (password.length < 6 || password.length > 100) return { error: 'A senha precisa ter pelo menos 6 caracteres.' }
  if (findUserByEmail(email)) return { error: 'Este e-mail já tem cadastro. Faça login.' }

  const user = createUser({ name, email, password })
  await startSession(user.id)
  redirect(isTrialEligible(email) ? '/?bemvindo=1' : '/vip?novo=1')
}

export async function signOut() {
  const jar = await cookies()
  deleteSession(jar.get(SESSION_COOKIE)?.value)
  jar.delete(SESSION_COOKIE)
  redirect('/entrar')
}

export async function changeOwnPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) redirect('/entrar')
  const current = String(formData.get('current') ?? '')
  const next = String(formData.get('password') ?? '')
  if (!authenticate(user.email, current)) return { error: 'Senha atual incorreta.' }
  if (next.length < 6 || next.length > 100) return { error: 'A nova senha precisa ter pelo menos 6 caracteres.' }
  setPassword(user.id, next)
  await startSession(user.id)
  return { ok: 'Senha alterada. Outras sessões foram encerradas.' }
}
