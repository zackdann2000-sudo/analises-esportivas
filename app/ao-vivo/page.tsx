import type { Metadata } from 'next'
import { LiveRadar } from '@/components/radar/live-radar'

export const metadata: Metadata = {
  title: 'Radar ao vivo',
  description: 'Pressão, APPM, chutes, escanteios e alertas em tempo real de todos os jogos ao vivo.',
}

export default function LivePage() {
  return <LiveRadar />
}
