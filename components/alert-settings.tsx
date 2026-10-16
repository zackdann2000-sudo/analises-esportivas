'use client'

import { BellRing, CircleDot, Flag, Goal, Hand, RectangleVertical, Shirt, Smartphone, Timer, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { useAlertPrefs, type AlertPrefs } from '@/lib/stores'
import { cn } from '@/lib/utils'

type ToggleKey = Exclude<keyof AlertPrefs, 'scope' | 'push'>

const ITEMS: { key: ToggleKey; label: string; desc: string; icon: typeof Goal }[] = [
  { key: 'goal', label: 'Gols', desc: 'Autor, minuto e placar atualizado', icon: Goal },
  { key: 'penalty', label: 'Pênaltis', desc: 'Convertidos e perdidos', icon: CircleDot },
  { key: 'corner', label: 'Escanteios', desc: 'Cada escanteio cobrado', icon: Flag },
  { key: 'card', label: 'Cartões', desc: 'Amarelos e vermelhos', icon: RectangleVertical },
  { key: 'offside', label: 'Impedimentos', desc: 'Cada impedimento marcado', icon: Flag },
  { key: 'foul', label: 'Faltas', desc: 'Pode gerar muitos alertas', icon: Hand },
  { key: 'start', label: 'Início de jogo', desc: 'Quando a bola rolar', icon: Timer },
  { key: 'halftime', label: 'Intervalo', desc: 'Placar do primeiro tempo', icon: Timer },
  { key: 'end', label: 'Fim de jogo', desc: 'Resultado final', icon: Trophy },
  { key: 'lineup', label: 'Escalação prevista', desc: 'Do seu time favorito, antes do jogo', icon: Shirt },
]

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-muted-foreground/30')}
    >
      <span
        className={cn(
          'absolute top-0.5 size-5 rounded-full bg-card shadow transition-transform',
          checked ? 'translate-x-5.5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export function AlertSettings() {
  const { prefs, update } = useAlertPrefs()

  const enablePush = async () => {
    if (typeof Notification === 'undefined') {
      toast('Seu navegador não suporta notificações push')
      return
    }
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      update({ push: true })
      new Notification('RadarGol', { body: 'Notificações ativadas! Você será avisado dos lances.', icon: '/icon.svg' })
    } else {
      update({ push: false })
      toast('Permissão negada', { description: 'Ative nas configurações do navegador.' })
    }
  }

  return (
    <div className="flex flex-col gap-4 px-2 pt-3 lg:px-0 lg:pt-0">
      <header className="px-2 lg:px-0">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <BellRing className="size-6 text-primary" /> Alertas
        </h1>
        <p className="text-sm text-muted-foreground">Escolha quais lances você quer receber em tempo real.</p>
      </header>

      <section className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <Smartphone className="size-6 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="font-semibold">Notificações no celular</p>
          <p className="text-xs leading-relaxed text-muted-foreground">Receba alertas mesmo com o app em segundo plano.</p>
        </div>
        {prefs.push ? (
          <Switch checked label="Notificações push" onChange={(v) => update({ push: v })} />
        ) : (
          <button type="button" onClick={enablePush} className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            Ativar
          </button>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-1">
        <div role="radiogroup" aria-label="Escopo dos alertas" className="grid grid-cols-2 gap-1">
          {(
            [
              { id: 'favorites', label: 'Só favoritos' },
              { id: 'all', label: 'Todos os jogos' },
            ] as const
          ).map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={prefs.scope === o.id}
              onClick={() => update({ scope: o.id })}
              className={cn(
                'rounded-lg py-2 text-sm font-semibold',
                prefs.scope === o.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      <ul className="overflow-hidden rounded-xl border border-border bg-card">
        {ITEMS.map(({ key, label, desc, icon: Icon }) => (
          <li key={key} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block text-xs text-muted-foreground">{desc}</span>
            </span>
            <Switch checked={prefs[key]} label={label} onChange={(v) => update({ [key]: v })} />
          </li>
        ))}
      </ul>
    </div>
  )
}
