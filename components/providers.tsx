'use client'

import { ThemeProvider, useTheme } from 'next-themes'
import { Toaster } from 'sonner'
import { NotificationEngine } from './notification-engine'

function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      position="top-center"
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      richColors={false}
      closeButton
      toastOptions={{ classNames: { toast: 'font-sans' } }}
    />
  )
}

export function Providers({ children, liveData }: { children: React.ReactNode; liveData: boolean }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {children}
      {liveData && <NotificationEngine />}
      <ThemedToaster />
    </ThemeProvider>
  )
}
