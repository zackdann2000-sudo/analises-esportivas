import type { Metadata } from 'next'
import { TipsBoard } from '@/components/tips/tips-board'

export const metadata: Metadata = {
  title: 'Oportunidades do dia',
  description: 'Melhores oportunidades estatísticas do dia: resultado, gols, ambas marcam, escanteios e cartões.',
}

export default function TipsPage() {
  return <TipsBoard />
}
