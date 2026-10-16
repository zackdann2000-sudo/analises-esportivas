'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export function TeamLogo({
  src,
  name,
  size = 20,
  className,
}: {
  src?: string | null
  name: string
  size?: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <span
        aria-hidden
        style={{ width: size, height: size, fontSize: Math.max(8, size * 0.38) }}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full bg-secondary font-display font-bold text-secondary-foreground',
          className,
        )}
      >
        {name.slice(0, 2).toUpperCase()}
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className={cn('shrink-0 object-contain', className)}
    />
  )
}
