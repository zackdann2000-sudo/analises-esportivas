import type { SessionUser } from '@/lib/auth'
import { BottomNav } from './bottom-nav'
import { Header } from './header'
import { RightRail } from './right-rail'
import { Sidebar } from './sidebar'

export function AppShell({ user, children }: { user: SessionUser | null; children: React.ReactNode }) {
  if (!user?.hasAccess) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header user={user} minimal />
        <main className="mx-auto w-full max-w-5xl flex-1 pb-10 lg:px-4 lg:py-4">{children}</main>
      </div>
    )
  }
  return (
    <div className="flex min-h-dvh flex-col">
      <Header user={user} />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-4 lg:px-4 lg:py-4">
        <Sidebar />
        <main className="min-w-0 flex-1 pb-24 lg:pb-8">{children}</main>
        <RightRail />
      </div>
      <BottomNav />
    </div>
  )
}
