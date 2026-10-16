import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { ApiProviderId, AuthMode, PublicApiConnection } from './api-providers'
import { TRIAL_RULE } from './plans'

export type Role = 'admin' | 'user'

export interface UserRecord {
  id: string
  name: string
  email: string
  passwordHash: string
  role: Role
  plan: string
  accessUntil: string | null
  blocked: boolean
  createdAt: string
  lastSeenAt: string | null
}

interface SessionRecord {
  tokenHash: string
  userId: string
  createdAt: string
  expiresAt: string
}

export interface ApiConnection {
  id: string
  provider: ApiProviderId
  name: string
  key: string
  baseUrl?: string
  authMode?: AuthMode
  authName?: string
  enabled: boolean
  createdAt: string
  lastTest?: { ok: boolean; message: string; at: string }
}

export interface Settings {
  apiFootballKey?: string
  apiFootballKeyUpdatedAt?: string
  apis?: ApiConnection[]
}

interface Store {
  users: UserRecord[]
  sessions: SessionRecord[]
  settings: Settings
}

export const SESSION_COOKIE = 'rg_session'
export const SESSION_DAYS = 30
const DAY = 86_400_000

// Kept outside the project folder so password hashes and API keys are never synced or committed.
const DATA_DIR = process.env.RADARGOL_DATA_DIR ?? path.join(os.tmpdir(), 'radargol-data')
const DATA_FILE = path.join(DATA_DIR, 'db.json')

const SEED_ADMIN = {
  email: 'testedosteste200@gmail.com',
  name: 'Administrador',
  passwordHash:
    'scrypt$cae18bb57a5e3f24cf9a89a0691aa40e$1944a96a4fd3e798de996c719d4b9d0115904b39ecc4c23c1b121b346c13dc1231bc064d1582ba1a34346a645f5150f89367d93b0869257104de7b6ded10b694',
}

function emptyStore(): Store {
  return { users: [], sessions: [], settings: {} }
}

function ensureSeed(store: Store) {
  if (store.users.some((u) => u.email === SEED_ADMIN.email)) return false
  store.users.push({
    id: crypto.randomUUID(),
    name: SEED_ADMIN.name,
    email: SEED_ADMIN.email,
    passwordHash: SEED_ADMIN.passwordHash,
    role: 'admin',
    plan: 'admin',
    accessUntil: null,
    blocked: false,
    createdAt: new Date().toISOString(),
    lastSeenAt: null,
  })
  return true
}

function read(): Store {
  let store: Store
  try {
    store = { ...emptyStore(), ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) }
  } catch {
    store = emptyStore()
  }
  const seeded = ensureSeed(store)
  const migrated = migrateLegacyKey(store)
  if (seeded || migrated) write(store)
  return store
}

function migrateLegacyKey(store: Store) {
  const legacy = store.settings.apiFootballKey
  if (!legacy) return false
  store.settings.apis = [
    {
      id: crypto.randomUUID(),
      provider: 'api-football',
      name: 'API-Football principal',
      key: legacy,
      enabled: true,
      createdAt: store.settings.apiFootballKeyUpdatedAt ?? new Date().toISOString(),
    },
    ...(store.settings.apis ?? []),
  ]
  delete store.settings.apiFootballKey
  delete store.settings.apiFootballKeyUpdatedAt
  return true
}

function write(store: Store) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const tmp = `${DATA_FILE}.${process.pid}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(store), { mode: 0o600 })
  fs.renameSync(tmp, DATA_FILE)
}

function mutate<T>(fn: (store: Store) => T): T {
  const store = read()
  const result = fn(store)
  write(store)
  return result
}

/* ---------- senhas ---------- */

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString('hex')}`
}

function verifyPassword(password: string, stored: string) {
  const [, salt, hex] = stored.split('$')
  if (!salt || !hex) return false
  const expected = Buffer.from(hex, 'hex')
  const actual = crypto.scryptSync(password, salt, expected.length)
  return crypto.timingSafeEqual(expected, actual)
}

/* ---------- usuários ---------- */

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export function isTrialEligible(email: string) {
  const domain = normalizeEmail(email).split('@')[1] ?? ''
  return TRIAL_RULE.allowedDomains.includes(domain)
}

export function hasAccess(user: Pick<UserRecord, 'role' | 'accessUntil' | 'blocked'>, now = Date.now()) {
  if (user.blocked) return false
  if (user.role === 'admin') return true
  return Boolean(user.accessUntil && new Date(user.accessUntil).getTime() > now)
}

export function findUserByEmail(email: string) {
  return read().users.find((u) => u.email === normalizeEmail(email)) ?? null
}

export function createUser(input: {
  name: string
  email: string
  password: string
  role?: Role
  plan?: string
  accessDays?: number
}) {
  return mutate((store) => {
    const email = normalizeEmail(input.email)
    if (store.users.some((u) => u.email === email)) throw new Error('E-mail já cadastrado')
    const days = input.accessDays ?? (isTrialEligible(email) ? TRIAL_RULE.days : 0)
    const user: UserRecord = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      email,
      passwordHash: hashPassword(input.password),
      role: input.role ?? 'user',
      plan: input.plan ?? (days > 0 ? 'trial' : 'sem-plano'),
      accessUntil: days > 0 ? new Date(Date.now() + days * DAY).toISOString() : null,
      blocked: false,
      createdAt: new Date().toISOString(),
      lastSeenAt: null,
    }
    store.users.push(user)
    return user
  })
}

export function authenticate(email: string, password: string) {
  const user = findUserByEmail(email)
  if (!user) {
    hashPassword(password)
    return null
  }
  return verifyPassword(password, user.passwordHash) ? user : null
}

export function updateUser(id: string, patch: Partial<Omit<UserRecord, 'id' | 'email' | 'createdAt'>>) {
  return mutate((store) => {
    const user = store.users.find((u) => u.id === id)
    if (!user) throw new Error('Usuário não encontrado')
    Object.assign(user, patch)
    if (patch.blocked) store.sessions = store.sessions.filter((s) => s.userId !== id)
    return user
  })
}

export function extendAccess(id: string, days: number, plan: string) {
  return mutate((store) => {
    const user = store.users.find((u) => u.id === id)
    if (!user) throw new Error('Usuário não encontrado')
    const base = Math.max(Date.now(), user.accessUntil ? new Date(user.accessUntil).getTime() : 0)
    user.accessUntil = new Date(base + days * DAY).toISOString()
    user.plan = plan
    return user
  })
}

export function expireAccess(id: string) {
  return updateUser(id, { accessUntil: new Date().toISOString(), plan: 'sem-plano' })
}

export function setPassword(id: string, password: string) {
  return mutate((store) => {
    const user = store.users.find((u) => u.id === id)
    if (!user) throw new Error('Usuário não encontrado')
    user.passwordHash = hashPassword(password)
    store.sessions = store.sessions.filter((s) => s.userId !== id)
  })
}

export function deleteUser(id: string) {
  mutate((store) => {
    store.users = store.users.filter((u) => u.id !== id)
    store.sessions = store.sessions.filter((s) => s.userId !== id)
  })
}

/* ---------- sessões ---------- */

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

export function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY)
  mutate((store) => {
    const now = Date.now()
    store.sessions = store.sessions.filter((s) => new Date(s.expiresAt).getTime() > now)
    store.sessions.push({ tokenHash: hashToken(token), userId, createdAt: new Date().toISOString(), expiresAt: expiresAt.toISOString() })
    const user = store.users.find((u) => u.id === userId)
    if (user) user.lastSeenAt = new Date().toISOString()
  })
  return { token, expiresAt }
}

export function getUserBySession(token: string | undefined) {
  if (!token) return null
  const store = read()
  const tokenHash = hashToken(token)
  const session = store.sessions.find((s) => s.tokenHash === tokenHash)
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null
  const user = store.users.find((u) => u.id === session.userId)
  if (!user || user.blocked) return null
  if (!user.lastSeenAt || Date.now() - new Date(user.lastSeenAt).getTime() > 60_000) {
    user.lastSeenAt = new Date().toISOString()
    write(store)
  }
  return user
}

export function deleteSession(token: string | undefined) {
  if (!token) return
  const tokenHash = hashToken(token)
  mutate((store) => {
    store.sessions = store.sessions.filter((s) => s.tokenHash !== tokenHash)
  })
}

export function revokeSessions(userId: string) {
  mutate((store) => {
    store.sessions = store.sessions.filter((s) => s.userId !== userId)
  })
}

/* ---------- configurações ---------- */

export function getSettings(): Settings {
  return read().settings
}

export function saveSettings(patch: Partial<Settings>) {
  mutate((store) => {
    store.settings = { ...store.settings, ...patch }
    for (const key of Object.keys(store.settings) as (keyof Settings)[]) {
      if (store.settings[key] === undefined) delete store.settings[key]
    }
  })
}

/* ---------- conexões de API ---------- */

export function listApiConnections(): ApiConnection[] {
  return read().settings.apis ?? []
}

export function getApiConnection(id: string) {
  return listApiConnections().find((c) => c.id === id) ?? null
}

export function addApiConnectionRecord(input: Omit<ApiConnection, 'id' | 'createdAt'>) {
  return mutate((store) => {
    const conn: ApiConnection = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    store.settings.apis = [...(store.settings.apis ?? []), conn]
    return conn
  })
}

export function updateApiConnection(id: string, patch: Partial<Omit<ApiConnection, 'id' | 'createdAt'>>) {
  return mutate((store) => {
    const conn = store.settings.apis?.find((c) => c.id === id)
    if (!conn) throw new Error('Conexão não encontrada')
    Object.assign(conn, patch)
    return conn
  })
}

export function moveApiConnection(id: string, direction: -1 | 1) {
  mutate((store) => {
    const list = store.settings.apis ?? []
    const i = list.findIndex((c) => c.id === id)
    const j = i + direction
    if (i < 0 || j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
  })
}

export function deleteApiConnection(id: string) {
  mutate((store) => {
    store.settings.apis = (store.settings.apis ?? []).filter((c) => c.id !== id)
  })
}

export const maskKey = (key: string) =>
  !key ? '(sem chave)' : key.length <= 8 ? '••••••••' : `${key.slice(0, 4)}••••••••${key.slice(-4)}`

export function toPublicConnection(c: ApiConnection): PublicApiConnection {
  return {
    id: c.id,
    provider: c.provider,
    name: c.name,
    masked: maskKey(c.key),
    baseUrl: c.baseUrl ?? null,
    authMode: c.authMode ?? null,
    authName: c.authName ?? null,
    enabled: c.enabled,
    createdAt: c.createdAt,
    lastTest: c.lastTest ?? null,
  }
}

/* ---------- painel ---------- */

export type PublicUser = Omit<UserRecord, 'passwordHash'> & {
  status: 'admin' | 'ativo' | 'teste' | 'expirado' | 'bloqueado'
  online: boolean
  activeSessions: number
}

export function listUsers(): PublicUser[] {
  const store = read()
  const now = Date.now()
  return store.users
    .map(({ passwordHash: _p, ...u }) => {
      const activeSessions = store.sessions.filter((s) => s.userId === u.id && new Date(s.expiresAt).getTime() > now).length
      const status: PublicUser['status'] = u.blocked
        ? 'bloqueado'
        : u.role === 'admin'
          ? 'admin'
          : !hasAccess(u, now)
            ? 'expirado'
            : u.plan === 'trial'
              ? 'teste'
              : 'ativo'
      const online = activeSessions > 0 && Boolean(u.lastSeenAt && now - new Date(u.lastSeenAt).getTime() < 15 * 60_000)
      return { ...u, status, online, activeSessions }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
