'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
}

export function Field({ label, name, type = 'text', ...props }: FieldProps) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="relative flex">
        <input
          name={name}
          type={isPassword && visible ? 'text' : type}
          className="h-12 w-full rounded-lg border border-input bg-surface px-3.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/25"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        )}
      </span>
    </label>
  )
}

export function FormMessage({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null
  return (
    <p
      role={error ? 'alert' : 'status'}
      className={
        error
          ? 'rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive'
          : 'rounded-lg border border-success/40 bg-success/10 px-3 py-2.5 text-sm text-success'
      }
    >
      {error ?? ok}
    </p>
  )
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 rounded-lg bg-primary font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? 'Aguarde…' : children}
    </button>
  )
}
