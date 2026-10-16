'use client'

import { useEffect, useRef } from 'react'
import { formatDayKey, todayKeyClient } from '@/lib/format'
import { cn } from '@/lib/utils'

export function DateStrip({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const days = Array.from({ length: 15 }, (_, i) => todayKeyClient(i - 7))
  const today = todayKeyClient()
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [])

  return (
    <div role="tablist" aria-label="Escolher data" className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-2 lg:px-0">
      {days.map((key) => {
        const { weekday, day } = formatDayKey(key)
        const active = key === value
        const label = key === today ? 'Hoje' : key === todayKeyClient(-1) ? 'Ontem' : key === todayKeyClient(1) ? 'Amanhã' : weekday
        return (
          <button
            key={key}
            ref={active ? activeRef : undefined}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn(
              'flex min-w-14 shrink-0 flex-col items-center rounded-lg px-2.5 py-1.5 transition-colors',
              active ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            <span className="text-[11px] font-semibold uppercase">{label}</span>
            <span className="font-display text-sm font-bold">{day}</span>
          </button>
        )
      })}
    </div>
  )
}
