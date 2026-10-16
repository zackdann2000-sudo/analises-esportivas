'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { brl, PLANS } from '@/lib/plans'
import { cn } from '@/lib/utils'

export function PlanCards({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter()
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {PLANS.map((p) => (
        <article
          key={p.id}
          className={cn(
            'relative flex flex-col gap-4 rounded-xl border bg-card p-4',
            p.highlight ? 'border-primary ring-1 ring-primary' : 'border-border',
          )}
        >
          {p.highlight && (
            <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Mais escolhido
            </span>
          )}
          <div>
            <h2 className="font-display text-xl font-bold">{p.name}</h2>
            <p className="mt-1">
              <span className="font-display text-3xl font-bold">{p.price === 0 ? 'Grátis' : brl(p.price)}</span>
              <span className="text-sm text-muted-foreground"> / {p.period}</span>
            </p>
          </div>
          <ul className="flex flex-1 flex-col gap-2">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                {f}
              </li>
            ))}
          </ul>
          {p.price === 0 ? (
            loggedIn ? (
              <span className="rounded-lg border border-border py-2.5 text-center text-sm text-muted-foreground">
                Válido no primeiro cadastro com Gmail
              </span>
            ) : (
              <Link href="/cadastro" className="rounded-lg bg-secondary py-2.5 text-center text-sm font-semibold text-secondary-foreground">
                Começar teste grátis
              </Link>
            )
          ) : (
            <button
              type="button"
              onClick={() =>
                loggedIn
                  ? toast('Pagamento online em ativação', {
                      description: 'Enquanto isso, fale com o administrador para liberar seu plano VIP manualmente.',
                    })
                  : router.push('/cadastro')
              }
              className={cn(
                'rounded-lg py-2.5 text-sm font-semibold',
                p.highlight ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
              )}
            >
              Assinar
            </button>
          )}
        </article>
      ))}
    </div>
  )
}
