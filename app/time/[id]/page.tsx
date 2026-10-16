import { TeamView } from '@/components/team/team-view'

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TeamView id={id} />
}
