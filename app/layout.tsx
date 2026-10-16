import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Barlow_Semi_Condensed, Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { AppShell } from '@/components/shell/app-shell'
import { getCurrentUser } from '@/lib/auth'
import './globals.css'

const _inter = Inter({ subsets: ['latin'] })
const _barlow = Barlow_Semi_Condensed({ subsets: ['latin'], weight: ['500', '600', '700', '800'] })

export const metadata: Metadata = {
  title: {
    default: 'RadarGol — Placar ao vivo, estatísticas e análises de futebol',
    template: '%s · RadarGol',
  },
  description:
    'Placar ao vivo, gols, escanteios, cartões, impedimentos e faltas em tempo real. Radar de pressão, escalações previstas, análises e oportunidades para cada jogo.',
  generator: 'v0.app',
  applicationName: 'RadarGol',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f5f9' },
    { media: '(prefers-color-scheme: dark)', color: '#111726' },
  ],
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser()
  return (
    <html lang="pt-BR" className="bg-background" suppressHydrationWarning>
      <body className="antialiased">
        <Providers liveData={Boolean(user?.hasAccess)}>
          <AppShell user={user}>{children}</AppShell>
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
