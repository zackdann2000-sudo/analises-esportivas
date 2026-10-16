export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="relative flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 12 19 6" strokeLinecap="round" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-card bg-live" />
      </span>
      <span className="font-display text-xl font-bold tracking-tight">
        Radar<span className="text-primary">Gol</span>
      </span>
    </span>
  )
}
