'use client'

import { useActionState } from 'react'
import { changeOwnPassword, type FormState } from '@/app/actions/auth'
import { Field, FormMessage, SubmitButton } from './field'

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changeOwnPassword, {})
  return (
    <form action={action} className="flex flex-col gap-3">
      <Field label="Senha atual" name="current" type="password" autoComplete="current-password" required />
      <Field label="Nova senha" name="password" type="password" autoComplete="new-password" minLength={6} required />
      <FormMessage error={state.error} ok={state.ok} />
      <SubmitButton pending={pending}>Salvar nova senha</SubmitButton>
    </form>
  )
}
