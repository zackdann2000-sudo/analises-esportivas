'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Gift, Info } from 'lucide-react'
import { signUp, type FormState } from '@/app/actions/auth'
import { TRIAL_RULE } from '@/lib/plans'
import { Field, FormMessage, SubmitButton } from './field'

export function SignUpForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {})
  const [email, setEmail] = useState('')
  const domain = email.toLowerCase().split('@')[1] ?? ''
  const typedDomain = email.includes('@') && domain.includes('.')
  const eligible = TRIAL_RULE.allowedDomains.includes(domain)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nome" name="name" autoComplete="name" placeholder="Como quer ser chamado" required minLength={2} maxLength={60} />
      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="voce@gmail.com"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {typedDomain &&
        (eligible ? (
          <p className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
            <Gift className="size-4 shrink-0" /> Gmail detectado: você ganha {TRIAL_RULE.days} dia de acesso VIP grátis.
          </p>
        ) : (
          <p className="flex items-start gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" /> O teste grátis é só para Gmail. Com este e-mail, o acesso é liberado ao assinar o VIP.
          </p>
        ))}
      <Field label="Senha" name="password" type="password" autoComplete="new-password" required minLength={6} placeholder="Mínimo 6 caracteres" />
      <FormMessage error={state.error} />
      <SubmitButton pending={pending}>Criar conta</SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link href="/entrar" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  )
}
