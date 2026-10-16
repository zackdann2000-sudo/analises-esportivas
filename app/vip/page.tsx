import type { Metadata } from 'next'
import Image from 'next/image'
import { Clock, Crown } from 'lucide-react'
import { PlanCards } from '@/components/vip/plan-cards'
import { getCurrentUser } from '@/lib/auth'
import { TRIAL_RULE } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Planos VIP',
  description: 'Teste grátis por 1 dia com Gmail. Radar completo, alertas ilimitados e todas as oportunidades.',
}

export default async function VipPage({ searchParams }: { searchParams: Promise<{ expirado?: string; novo?: string }> }) {
  const [{ expirado, novo }, user] = await Promise.all([searchParams, getCurrentUser()])
  const notice =
    user && !user.hasAccess
      ? novo
        ? 'Conta criada! O teste grátis é exclusivo para Gmail — assine um plano para liberar o acesso.'
        : expirado || !user.accessUntil
          ? 'Seu acesso expirou. Escolha um plano VIP para continuar acompanhando os jogos.'
          : null
      : null

  return (
    <div className="flex flex-col gap-4 px-2 pt-3 lg:px-0 lg:pt-0">
      {notice && (
        <p role="alert" className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm leading-relaxed">
          <Clock className="mt-0.5 size-5 shrink-0 text-warning" />
          {notice}
        </p>
      )}
      <section className="relative overflow-hidden rounded-xl">
        <Image src="/banners/vip.png" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="relative flex flex-col gap-2 bg-gradient-to-t from-background via-background/80 to-background/20 px-4 pb-5 pt-24">
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-warning px-2.5 py-0.5 text-xs font-bold text-background">
            <Crown className="size-3.5" /> RadarGol VIP
          </span>
          <h1 className="font-display text-3xl font-bold leading-tight text-balance">
            Veja o jogo antes de ele acontecer
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{TRIAL_RULE.description}</p>
        </div>
      </section>
      <PlanCards loggedIn={Boolean(user)} />
    </div>
  )
}
