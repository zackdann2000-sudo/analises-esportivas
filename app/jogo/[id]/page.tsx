import { MatchView } from '@/components/match/match-view'

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <MatchView id={id} />
}
