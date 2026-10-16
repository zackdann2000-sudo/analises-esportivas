'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn, type FormState } from '@/app/actions/auth'
import { Field, FormMessage, SubmitButton } from './field'

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {})
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ''} />
      <Field label="E-mail" name="email" type="email" autoComplete="email" inputMode="email" placeholder="voce@gmail.com" required />
      <Field label="Senha" name="password" type="password" autoComplete="current-password" required />
      <FormMessage error={state.error} />
      <SubmitButton pending={pending}>Entrar</SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="font-semibold text-primary hover:underline">
          Criar conta grátis
        </Link>
      </p>
    </form>
  )
}
