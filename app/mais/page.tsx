import type { Metadata } from 'next'
import Link from 'next/link'
import { BellRing, ChevronRight, Crown, LayoutDashboard, LogOut, Search, Trophy, UserRound } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { DataSourceBadge } from '@/components/data-source-badge'
import { ThemeToggle } from '@/components/shell/theme-toggle'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Mais' }

const LINKS = [
  { href: '/conta', label: 'Minha conta', icon: UserRound },
  { href: '/ligas', label: 'Ligas e times', icon: Trophy },
  { href: '/buscar', label: 'Buscar', icon: Search },
  { href: '/alertas', label: 'Alertas e notificações', icon: BellRing },
  { href: '/vip', label: 'Planos VIP', icon: Crown },
]

export default async function MorePage() {
  const user = await getCurrentUser()
  const links =
    user?.role === 'admin' ? [...LINKS, { href: '/admin', label: 'Painel do administrador', icon: LayoutDashboard }] : LINKS
  return (
    <div className="flex flex-col gap-4 px-2 pt-3">
      <ul className="overflow-hidden rounded-xl border border-border bg-card">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href} className="border-b border-border last:border-0">
            <Link href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/60">
              <Icon className="size-5 text-muted-foreground" />
              <span className="flex-1 font-medium">{label}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
        <li className="flex items-center gap-3 px-4 py-2">
          <span className="flex-1 font-medium">Tema claro / escuro</span>
          <ThemeToggle />
        </li>
      </ul>
      <DataSourceBadge />
      <form action={signOut}>
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card font-semibold text-destructive"
        >
          <LogOut className="size-4" /> Sair da conta
        </button>
      </form>
    </div>
  )
}
