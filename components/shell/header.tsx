'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, UserRound } from 'lucide-react'
import type { SessionUser } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { AccessBadge } from './access-badge'
import { Logo } from './logo'
import { NotificationBell } from './notification-bell'
import { ThemeToggle } from './theme-toggle'

const NAV = [
  { href: '/', label: 'Jogos' },
  { href: '/ao-vivo', label: 'Radar ao vivo' },
  { href: '/dicas', label: 'Oportunidades' },
  { href: '/ligas', label: 'Ligas' },
  { href: '/favoritos', label: 'Favoritos' },
  { href: '/vip', label: 'VIP' },
]

export function Header({ user, minimal = false }: { user: SessionUser | null; minimal?: boolean }) {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <Link href="/" aria-label="RadarGol — início" className="shrink-0">
          <Logo />
        </Link>
        {!minimal && (
          <nav aria-label="Principal" className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-1">
          {!minimal && (
            <>
              <Link
                href="/buscar"
                aria-label="Buscar times e ligas"
                className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Search className="size-5" />
              </Link>
              <NotificationBell />
            </>
          )}
          <ThemeToggle />
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="ml-1 hidden rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 sm:inline-flex"
                >
                  Painel
                </Link>
              )}
              <Link
                href="/conta"
                aria-label="Minha conta"
                className="ml-1 inline-flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-1 sm:pr-3"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-accent-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <AccessBadge user={user} className="hidden sm:inline" />
              </Link>
            </>
          ) : (
            pathname !== '/entrar' && (
              <Link
                href="/entrar"
                className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <UserRound className="size-4" />
                Entrar
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  )
}
