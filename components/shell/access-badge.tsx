'use client'

import { useEffect, useState } from 'react'
import type { SessionUser } from '@/lib/auth'
import { cn } from '@/lib/utils'

export function remainingLabel(accessUntil: string | null, now: number) {
  if (!accessUntil) return 'Expirado'
  const ms = new Date(accessUntil).getTime() - now
  if (ms <= 0) return 'Expirado'
  const h = Math.floor(ms / 3_600_000)
  if (h >= 48) return `${Math.floor(h / 24)} dias`
  if (h >= 1) return `${h}h restantes`
  return `${Math.max(1, Math.floor(ms / 60_000))} min restantes`
}

export function AccessBadge({ user, className }: { user: SessionUser; className?: string }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  if (user.role === 'admin') return <span className={cn('text-xs font-semibold', className)}>Admin</span>
  const label = now === null ? '…' : remainingLabel(user.accessUntil, now)
  const tone = !user.hasAccess ? 'text-destructive' : user.plan === 'trial' ? 'text-warning' : 'text-success'
  return (
    <span className={cn('text-xs font-semibold tabular-nums', tone, className)}>
      {user.plan === 'trial' && user.hasAccess ? `Teste · ${label}` : label}
    </span>
  )
}
