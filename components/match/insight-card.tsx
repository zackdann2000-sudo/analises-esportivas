import type { Insight } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ConfidenceRing({ value, tone }: { value: number; tone: Insight['tone'] }) {
  const r = 18
  const c = 2 * Math.PI * r
  return (
    <span className="relative flex size-12 shrink-0 items-center justify-center">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" className="stroke-secondary" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(100, value)) / 100}
          className={cn(tone === 'green' ? 'stroke-success' : tone === 'blue' ? 'stroke-primary' : 'stroke-muted-foreground')}
        />
      </svg>
      <span className="font-display text-sm font-bold tabular-nums">{value}%</span>
    </span>
  )
}

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <ConfidenceRing value={insight.confidence} tone={insight.tone} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{insight.market}</p>
        <p className="truncate font-semibold">{insight.pick}</p>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{insight.reason}</p>
      </div>
    </article>
  )
}
