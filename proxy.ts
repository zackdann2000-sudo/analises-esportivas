import { NextResponse, type NextRequest } from 'next/server'
import { getUserBySession, hasAccess, SESSION_COOKIE } from '@/lib/db'

const AUTH_PAGES = ['/entrar', '/cadastro']
const PUBLIC_PAGES = [...AUTH_PAGES, '/vip']

const matches = (pathname: string, list: string[]) => list.some((p) => pathname === p || pathname.startsWith(`${p}/`))

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  const isApi = pathname.startsWith('/api/')
  const user = getUserBySession(req.cookies.get(SESSION_COOKIE)?.value)

  if (matches(pathname, PUBLIC_PAGES)) {
    if (user && matches(pathname, AUTH_PAGES)) return NextResponse.redirect(new URL('/', req.url))
    return NextResponse.next()
  }

  if (!user) {
    if (isApi) return NextResponse.json({ error: 'Faça login para continuar' }, { status: 401 })
    const url = new URL('/entrar', req.url)
    if (pathname !== '/') url.searchParams.set('next', pathname + search)
    return NextResponse.redirect(url)
  }

  if (matches(pathname, ['/admin', '/api/admin'])) {
    if (user.role !== 'admin') {
      return isApi ? NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) : NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  if (pathname === '/conta') return NextResponse.next()

  if (!hasAccess(user)) {
    if (isApi) return NextResponse.json({ error: 'Seu acesso expirou' }, { status: 402 })
    return NextResponse.redirect(new URL('/vip?expirado=1', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|banners/|.*\\.(?:png|jpg|jpeg|svg|ico|webp|webmanifest)$).*)'],
}
