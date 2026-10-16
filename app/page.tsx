import { BannerCarousel } from '@/components/banner-carousel'
import { MatchesBoard } from '@/components/matches/matches-board'

export default function HomePage() {
  return (
    <div className="flex flex-col gap-3 pt-3 lg:pt-0">
      <BannerCarousel />
      <MatchesBoard />
    </div>
  )
}
