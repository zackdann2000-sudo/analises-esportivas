import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Crown, LayoutDashboard, LogOut } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { ChangePasswordForm } from '@/components/auth/change-password-form'
import { AccessBadge } from '@/components/shell/access-badge'
import { getCurrentUser } from '@/lib/auth'
import { PLANS } from '@/lib/plans'

export const metadata: Metadata = { title: 'Minha conta' }

const planName = (id: string) =>
  id === 'admin' ? 'Administrador' : id === 'manual' ? 'Acesso liberado' : (PLANS.find((p) => p.id === id)?.name ?? 'Sem plano')

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/entrar?next=/conta')

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3 px-2 pt-3 lg:px-0 lg:pt-0">
      <section className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-accent font-display text-2xl font-bold text-accent-foreground">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-bold">{user.name}</h1>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seu acesso</h2>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{planName(user.plan)}</p>
            <p className="text-sm text-muted-foreground">
              {user.role === 'admin'
                ? 'Acesso permanente'
                : user.accessUntil
                  ? `${user.hasAccess ? 'Expira' : 'Expirou'} em ${new Date(user.accessUntil).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })}`
                  : 'Nenhum acesso ativo'}
            </p>
          </div>
          <AccessBadge user={user} className="rounded-full bg-secondary px-2.5 py-1" />
        </div>
        {user.role !== 'admin' && (
          <Link
            href="/vip"
            className="mt-4 flex h-11 items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground"
          >
            <Crown className="size-4" />
            {user.hasAccess ? 'Renovar ou mudar de plano' : 'Assinar VIP'}
          </Link>
        )}
        {user.role === 'admin' && (
          <Link
            href="/admin"
            className="mt-4 flex h-11 items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground"
          >
            <LayoutDashboard className="size-4" /> Abrir painel do administrador
          </Link>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alterar senha</h2>
        <ChangePasswordForm />
      </section>

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
