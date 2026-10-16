'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, BellOff, CircleDot, Flag, Goal, Hand, RectangleVertical, Settings2, Shirt, Timer, Trophy } from 'lucide-react'
import { useInbox, type AppNotification } from '@/lib/stores'
import { cn } from '@/lib/utils'

const ICONS: Record<AppNotification['kind'], typeof Bell> = {
  goal: Goal,
  corner: Flag,
  foul: Hand,
  offside: Flag,
  card: RectangleVertical,
  penalty: CircleDot,
  start: Timer,
  halftime: Timer,
  end: Trophy,
  lineup: Shirt,
}

function timeAgo(at: number) {
  const s = Math.floor((Date.now() - at) / 1000)
  if (s < 60) return 'agora'
  if (s < 3600) return `${Math.floor(s / 60)} min`
  return `${Math.floor(s / 3600)} h`
}

export function NotificationBell() {
  const { items, unread, markAllRead, clear } = useInbox()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notificações${unread ? `, ${unread} não lidas` : ''}`}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o)
          if (!open) setTimeout(markAllRead, 1500)
        }}
        className="relative inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-live px-1 text-[10px] font-bold leading-4 text-live-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-x-2 top-16 z-50 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-display text-lg font-bold">Notificações</p>
            <div className="flex items-center gap-1">
              {items.length > 0 && (
                <button type="button" onClick={clear} className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary">
                  Limpar
                </button>
              )}
              <Link
                href="/alertas"
                onClick={() => setOpen(false)}
                aria-label="Configurar alertas"
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
              >
                <Settings2 className="size-4" />
              </Link>
            </div>
          </div>
          <ul className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 && (
              <li className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted-foreground">
                <BellOff className="size-6" />
                <p className="text-pretty">
                  Favorite times ou jogos com a estrela para receber gols, escanteios, cartões e mais em tempo real.
                </p>
              </li>
            )}
            {items.map((n) => {
              const Icon = ICONS[n.kind] ?? Bell
              return (
                <li key={n.id}>
                  <Link
                    href={`/jogo/${n.matchId}`}
                    onClick={() => setOpen(false)}
                    className={cn('flex gap-3 px-4 py-3 hover:bg-secondary', !n.read && 'bg-accent/40')}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
                        n.kind === 'goal' ? 'bg-success text-success-foreground' : 'bg-secondary text-secondary-foreground',
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{n.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(n.at)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
