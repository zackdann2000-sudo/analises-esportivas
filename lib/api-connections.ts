import 'server-only'
import type { ApiConnection } from './db'

const TIMEOUT = 10_000

export interface TestResult {
  ok: boolean
  message: string
}

const IP_LITERAL = /^(\d{1,3}\.){3}\d{1,3}$|^\[.*\]$|:/

export function validateCustomUrl(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return 'URL inválida.'
  }
  if (url.protocol !== 'https:') return 'Use uma URL com https://.'
  const host = url.hostname.toLowerCase()
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost') ||
    IP_LITERAL.test(host)
  ) {
    return 'Use o domínio público da API (endereços internos ou IPs não são permitidos).'
  }
  return null
}

function buildRequest(c: ApiConnection): { url: string; headers: Record<string, string> } {
  const k = encodeURIComponent(c.key)
  switch (c.provider) {
    case 'api-football':
      return { url: 'https://v3.football.api-sports.io/status', headers: { 'x-apisports-key': c.key } }
    case 'football-data':
      return { url: 'https://api.football-data.org/v4/competitions/BSA', headers: { 'X-Auth-Token': c.key } }
    case 'the-odds-api':
      return { url: `https://api.the-odds-api.com/v4/sports?apiKey=${k}`, headers: {} }
    case 'sportmonks':
      return { url: `https://api.sportmonks.com/v3/football/leagues?per_page=1&api_token=${k}`, headers: {} }
    case 'thesportsdb':
      return { url: `https://www.thesportsdb.com/api/v1/json/${k}/all_leagues.php`, headers: {} }
    case 'custom': {
      const url = new URL(c.baseUrl ?? '')
      const headers: Record<string, string> = { Accept: 'application/json' }
      const name = c.authName?.trim() || (c.authMode === 'query' ? 'apikey' : 'x-api-key')
      if (c.authMode === 'header') headers[name] = c.key
      if (c.authMode === 'bearer') headers.Authorization = `Bearer ${c.key}`
      if (c.authMode === 'query') url.searchParams.set(name, c.key)
      return { url: url.toString(), headers }
    }
  }
}

function describeFailure(status: number, body: string) {
  if (status === 401 || status === 403) return `Chave recusada (HTTP ${status}).`
  if (status === 429) return 'Limite de requisições atingido (HTTP 429).'
  const snippet = body.replace(/\s+/g, ' ').slice(0, 120)
  return `HTTP ${status}${snippet ? `: ${snippet}` : ''}`
}

export async function testConnection(c: ApiConnection): Promise<TestResult> {
  let req: ReturnType<typeof buildRequest>
  try {
    req = buildRequest(c)
  } catch {
    return { ok: false, message: 'URL inválida.' }
  }
  try {
    const res = await fetch(req.url, {
      headers: req.headers,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT),
    })
    const text = await res.text()
    if (res.status >= 300 && res.status < 400) return { ok: false, message: `A API redirecionou (HTTP ${res.status}).` }
    if (!res.ok) return { ok: false, message: describeFailure(res.status, text) }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    let json: any = null
    try {
      json = JSON.parse(text)
    } catch {
      /* not JSON */
    }

    if (c.provider === 'api-football') {
      const r = json?.response
      if (!r || Array.isArray(r)) {
        const errs = json?.errors && (Array.isArray(json.errors) ? json.errors : Object.values(json.errors))
        return { ok: false, message: errs?.length ? String(errs.join(', ')) : 'Resposta inesperada.' }
      }
      return {
        ok: true,
        message: `Plano ${r.subscription?.plan ?? '—'} · ${r.requests?.current ?? 0}/${r.requests?.limit_day ?? '?'} requisições hoje`,
      }
    }
    if (c.provider === 'the-odds-api') {
      const left = res.headers.get('x-requests-remaining')
      return { ok: true, message: `Conectada${left ? ` · ${left} requisições restantes` : ''}` }
    }
    if (c.provider === 'football-data') {
      const left = res.headers.get('x-requests-available-minute')
      return { ok: true, message: `Conectada${left ? ` · ${left} requisições/min disponíveis` : ''}` }
    }
    if (c.provider === 'thesportsdb') {
      const n = Array.isArray(json?.leagues) ? json.leagues.length : 0
      return n ? { ok: true, message: `Conectada · ${n} ligas disponíveis` } : { ok: false, message: 'Chave inválida.' }
    }
    if (c.provider === 'sportmonks' && json?.message && !json?.data) return { ok: false, message: String(json.message) }
    return { ok: true, message: json ? 'Conectada · resposta JSON válida' : `Conectada · HTTP ${res.status}` }
  } catch (err) {
    const e = err as Error
    return { ok: false, message: e.name === 'TimeoutError' ? 'A API não respondeu em 10s.' : `Falha de conexão: ${e.message}` }
  }
}
