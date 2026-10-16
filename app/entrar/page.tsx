import type { Metadata } from 'next'
import { AuthLayout } from '@/components/auth/auth-layout'
import { SignInForm } from '@/components/auth/sign-in-form'

export const metadata: Metadata = { title: 'Entrar' }

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <AuthLayout title="Entrar no RadarGol" subtitle="Acesse placares ao vivo, radar de pressão, alertas e oportunidades do dia.">
      <SignInForm next={next} />
    </AuthLayout>
  )
}
