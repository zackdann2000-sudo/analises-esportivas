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
  version: number
  users: UserRecord[]
  sessions: SessionRecord[]
  settings: Settings
}

export const SESSION_COOKIE = 'rg_session'
export const SESSION_DAYS = 30
const DAY = 86_400_000
const STORE_VERSION = 2
const MAX_SESSIONS_PER_USER = 10

// Mantido fora da pasta do projeto para hashes de senha e chaves de API nunca
// serem sincronizados ou commitados.
//
// ATENÇÃO: por padrão usamos os.tmpdir(). Em ambientes serverless (Vercel, Lambda)
// o /tmp é efêmero e some entre cold starts — defina RADARGOL_DATA_DIR apontando
// para um volume persistente em produção, senão o admin some a cada deploy.
const DATA_DIR = process.env.RADARGOL_DATA_DIR ?? path.join(os.tmpdir(), 'radargol-data')
const DATA_FILE = path.join(DATA_DIR, 'db.json')

// Configure RADARGOL_ADMIN_EMAIL e RADARGOL_ADMIN_PASSWORD no ambiente do servidor.
const LEGACY_SEED_EMAIL = 'testedosteste200@gmail.com'
const LEGACY_SEED_HASH =
  'scrypt$cae18bb57a5e3f24cf9a89a0691aa40e$1944a96a4fd3e798de996c719d4b9d0115904b39ecc4c23c1b121b346c13dc1231bc064d1582ba1a34346a645f5150f89367d93b0869257104de7b6ded10b694'

function emptyStore(): Store {
  return { version: STORE_VERSION, users: [], sessions: [], settings: {} }
}

function ensureSeed(store: Store): boolean {
  let changed = false

  const legacy = store.users.find(
    (u) => u.email === LEGACY_SEED_EMAIL && u.passwordHash === LEGACY_SEED_HASH,
  )
  if (legacy) {
    store.users = store.users.filter((u) => u.id !== legacy.id)
    store.sessions = store.sessions.filter((s) => s.userId !== legacy.id)
    changed = true
  }

  const email = process.env.RADARGOL_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.RADARGOL_ADMIN_PASSWORD
  if (!email || !password || password.length < 12) return changed
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return changed
  if (store.users.some((u) => u.email === email)) return changed

  store.users.push({
    id: crypto.randomUUID(),
    name: 'Administrador',
    email,
    passwordHash: hashPassword(password),
    role: 'admin',
    plan: 'admin',
    accessUntil: null,
    blocked: false,
    createdAt: new Date().toISOString(),
    lastSeenAt: null,
  })
  return true
}

function migrateLegacyKey(store: Store): boolean {
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

function migrateVersion(store: Store): boolean {
  // Ganchos de migração futura entram aqui. Hoje só normaliza o campo version.
  if (store.version === STORE_VERSION) return false
  store.version = STORE_VERSION
  return true
}

function loadRaw(): Store {
  let raw: string
  try {
    raw = fs.readFileSync(DATA_FILE, 'utf8')
  } catch (e) {
    // Arquivo inexistente = primeira execução, tudo bem.
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return emptyStore()
    // Qualquer outro erro (EACCES, EIO, …) deve estourar, não ser engolido.
    throw e
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Não sobrescreve um arquivo corrompido silenciosamente: renomeia antes.
    const backup = `${DATA_FILE}.corrupt-${Date.now()}`
    try {
      fs.renameSync(DATA_FILE, backup)
    } catch {
      /* segue com o erro original */
    }
    throw new Error(`DB corrompido em ${DATA_FILE}; backup salvo em ${backup}`)
  }

  const p = (parsed ?? {}) as Partial<Store>
  return {
    version: typeof p.version === 'number' ? p.version : 0,
    users: Array.isArray(p.users) ? p.users : [],
    sessions: Array.isArray(p.sessions) ? p.sessions : [],
    settings: p.settings && typeof p.settings === 'object' ? p.settings : {},
  }
}

function write(store: Store) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const tmp = `${DATA_FILE}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(store), { mode: 0o600 })
  fs.renameSync(tmp, DATA_FILE)
}

function read(): Store {
  const store = loadRaw()
  const seeded = ensureSeed(store)
  const migratedKey = migrateLegacyKey(store)
  const migratedVersion = migrateVersion(store)
  if (seeded || migratedKey || migratedVersion) write(store)
  return store
}

function mutate<T>(fn: (store: Store) => T): T {
  // Em Node single-process isto é atômico (read/write síncronos, event loop
  // serializa). Em multi-processo/cluster isto NÃO é seguro — troque por DB.
  const store = read()
  const result = fn(store)
  write(store)
  return result
}

/* ---------- senhas ---------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString('hex')}`
}

function checkPasswordHash(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const [, salt, hex] = parts
  if (!salt || !hex || hex.length === 0 || hex.length % 2 !== 0) return false

  let expected: Buffer
  try {
    expected = Buffer.from(hex, 'hex')
  } catch {
    return false
  }
  if (expected.length === 0) return false

  const actual = crypto.scryptSync(password, salt, expected.length)
  // Buffer de mesmo tamanho — timingSafeEqual não vai lançar.
  return crypto.timingSafeEqual(expected, actual)
}

/**
 * Verifica a senha de um usuário pelo id.
 * Use isto (não `authenticate`) no fluxo de troca de senha, para não
 * consumir tentativas de login nem bloquear a conta.
 */
export function verifyPassword(userId: string, plain: string): boolean {
  const user = read().users.find((u) => u.id === userId)
  if (!user) return false
  return checkPasswordHash(plain, user.passwordHash)
}

/* ---------- usuários ---------- */

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export function isTrialEligible(email: string) {
  const domain = normalizeEmail(email).split('@')[1] ?? ''
  return TRIAL_RULE.allowedDomains.includes(domain)
}

export function hasAccess(
  user: Pick<UserRecord, 'role' | 'accessUntil' | 'blocked'>,
  now = Date.now(),
) {
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
    if (store.users.some((u) => u.email === email)) {
      throw new Error('E-mail já cadastrado')
    }
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
    // Mitigação de timing attack: gasta o mesmo trabalho do caminho com hash real.
    hashPassword(password)
    return null
  }
  return checkPasswordHash(password, user.passwordHash) ? user : null
}

export function updateUser(
  id: string,
  // passwordHash de fora: troca de senha só via setPassword().
  patch: Partial<Omit<UserRecord, 'id' | 'email' | 'createdAt' | 'passwordHash'>>,
) {
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
    const base = Math.max(
      Date.now(),
      user.accessUntil ? new Date(user.accessUntil).getTime() : 0,
    )
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

const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex')

export function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY)

  mutate((store) => {
    const now = Date.now()

    // 1) remove expiradas globalmente
    store.sessions = store.sessions.filter(
      (s) => new Date(s.expiresAt).getTime() > now,
    )

    // 2) limita sessões do usuário (evita acúmulo infinito)
    const mine = store.sessions.filter((s) => s.userId === userId)
    if (mine.length >= MAX_SESSIONS_PER_USER) {
      mine.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      const excess = mine.length - MAX_SESSIONS_PER_USER + 1
      const toDrop = new Set(mine.slice(0, excess).map((s) => s.tokenHash))
      store.sessions = store.sessions.filter((s) => !toDrop.has(s.tokenHash))
    }

    store.sessions.push({
      tokenHash: hashToken(token),
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    })

    const user = store.users.find((u) => u.id === userId)
    if (user) user.lastSeenAt = new Date().toISOString()
  })

  return { token, expiresAt }
}

export function getUserBySession(token: string | undefined) {
  if (!token) return null
  const tokenHash = hashToken(token)
  const store = read()

  const session = store.sessions.find((s) => s.tokenHash === tokenHash)
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null

  const user = store.users.find((u) => u.id === session.userId)
  if (!user || user.blocked) return null

  // Atualiza lastSeenAt via mutate para não sobrescrever escritas concorrentes.
  const needsTouch =
    !user.lastSeenAt || Date.now() - new Date(user.lastSeenAt).getTime() > 60_000
  if (needsTouch) {
    mutate((s) => {
      const u = s.users.find((x) => x.id === user.id)
      if (u) u.lastSeenAt = new Date().toISOString()
    })
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

// Alias para compatibilidade com chamadas existentes.
export const deleteAllSessions = revokeSessions

/* ---------- configurações ---------- */

export function getSettings(): Settings {
  return read().settings
}

export function saveSettings(patch: Partial<Settings>) {
  mutate((store) => {
    const next: Settings = { ...store.settings, ...patch }
    for (const key of Object.keys(next) as (keyof Settings)[]) {
      if (next[key] === undefined) delete next[key]
    }
    store.settings = next
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
    const conn: ApiConnection = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    store.settings.apis = [...(store.settings.apis ?? []), conn]
    return conn
  })
}

export function updateApiConnection(
  id: string,
  patch: Partial<Omit<ApiConnection, 'id' | 'createdAt'>>,
) {
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
    if (i < 0) return
    const j = i + direction
    if (j < 0 || j >= list.length) return
    const tmp = list[i]
    list[i] = list[j]
    list[j] = tmp
  })
}

export function deleteApiConnection(id: string) {
  mutate((store) => {
    store.settings.apis = (store.settings.apis ?? []).filter((c) => c.id !== id)
  })
}

export const maskKey = (key: string) =>
  !key
    ? '(sem chave)'
    : key.length <= 8
      ? '••••••••'
      : `${key.slice(0, 4)}••••••••${key.slice(-4)}`

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
      const activeSessions = store.sessions.filter(
        (s) => s.userId === u.id && new Date(s.expiresAt).getTime() > now,
      ).length
      const status: PublicUser['status'] = u.blocked
        ? 'bloqueado'
        : u.role === 'admin'
          ? 'admin'
          : !hasAccess(u, now)
            ? 'expirado'
            : u.plan === 'trial'
              ? 'teste'
              : 'ativo'
      const online =
        activeSessions > 0 &&
        Boolean(u.lastSeenAt && now - new Date(u.lastSeenAt).getTime() < 15 * 60_000)
      return { ...u, status, online, activeSessions }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
