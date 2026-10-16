import type { Metadata } from 'next'
import { AlertSettings } from '@/components/alert-settings'

export const metadata: Metadata = { title: 'Alertas e notificações' }

export default function AlertsPage() {
  return <AlertSettings />
}
