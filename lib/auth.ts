import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserBySession, hasAccess, SESSION_COOKIE, type UserRecord } from './db'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRecord['role']
  plan: string
  accessUntil: string | null
  hasAccess: boolean
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const user = getUserBySession(token)
  if (!user) return null
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan,
    accessUntil: user.accessUntil,
    hasAccess: hasAccess(user),
  }
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) redirect('/entrar?next=/admin')
  if (user.role !== 'admin') redirect('/')
  return user
}

export const sessionCookieOptions = (expires: Date) => ({
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  path: '/',
  expires,
})
