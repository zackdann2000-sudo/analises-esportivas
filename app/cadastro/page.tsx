import type { Metadata } from 'next'
import { AuthLayout } from '@/components/auth/auth-layout'
import { SignUpForm } from '@/components/auth/sign-up-form'

export const metadata: Metadata = { title: 'Criar conta' }

export default function SignUpPage() {
  return (
    <AuthLayout title="Crie sua conta" subtitle="Cadastre-se com Gmail e ganhe 1 dia de acesso VIP completo, sem cartão.">
      <SignUpForm />
    </AuthLayout>
  )
}
