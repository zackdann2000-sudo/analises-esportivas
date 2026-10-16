'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { toast } from 'sonner'
import { fetcher, formatTime, todayKeyClient } from '@/lib/format'
import {
  pushInbox,
  readAlertPrefs,
  readFavorites,
  type AlertPrefs,
  type AppNotification,
} from '@/lib/stores'
import type { Match, MatchesResponse } from '@/lib/types'

interface Snap {
  home: string
  away: string
  status: Match['status']
  score: [number, number]
  corners: [number, number]
  fouls: [number, number]
  offsides: [number, number]
  cards: [number, number]
  penalties: number
  events: number
}

function snap(m: Match): Snap {
  const s = m.stats
  const pair = (k: 'corners' | 'fouls' | 'offsides') => [s?.home[k] ?? 0, s?.away[k] ?? 0] as [number, number]
  const cards = (teamId: number) => m.events.filter((e) => e.teamId === teamId && (e.type === 'yellow' || e.type === 'red')).length
  return {
    home: m.home.name,
    away: m.away.name,
    status: m.status,
    score: [m.score.home ?? 0, m.score.away ?? 0],
    corners: pair('corners'),
    fouls: pair('fouls'),
    offsides: pair('offsides'),
    cards: [cards(m.home.id), cards(m.away.id)],
    penalties: m.events.filter((e) => e.type === 'penalty_goal' || e.type === 'penalty_missed').length,
    events: m.events.length,
  }
}

function isWatched(m: Match, prefs: AlertPrefs) {
  if (prefs.scope === 'all') return true
  const fav = readFavorites()
  return fav.matches.includes(m.id) || fav.teams.some((t) => t.id === m.home.id || t.id === m.away.id)
}

export function NotificationEngine() {
  const router = useRouter()
  const { data: live } = useSWR<MatchesResponse>('/api/matches?live=1', fetcher, {
    refreshInterval: 20_000,
    revalidateOnFocus: true,
  })
  const { data: today } = useSWR<MatchesResponse>(`/api/matches?date=${todayKeyClient()}`, fetcher, {
    refreshInterval: 120_000,
  })
  const snapshots = useRef<Map<string, Snap> | null>(null)

  const emit = (items: AppNotification[]) => {
    const fresh = pushInbox(items)
    const prefs = readAlertPrefs()
    fresh.slice(0, 4).forEach((n) => {
      toast(n.title, {
        description: n.body,
        action: { label: 'Ver', onClick: () => router.push(`/jogo/${n.matchId}`) },
      })
      if (prefs.push && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(n.title, { body: n.body, icon: '/icon.svg', tag: n.id })
        } catch {}
      }
    })
  }

  useEffect(() => {
    if (!live) return
    const prefs = readAlertPrefs()
    const next = new Map<string, Snap>()
    live.matches.forEach((m) => next.set(m.id, snap(m)))

    if (!snapshots.current) {
      snapshots.current = next
      return
    }
    const prev = snapshots.current
    const out: AppNotification[] = []
    const now = Date.now()
    const add = (m: { id: string }, kind: AppNotification['kind'], title: string, body: string, key: string) =>
      out.push({ id: `${m.id}-${key}`, matchId: m.id, kind, title, body, at: now, read: false })

    for (const m of live.matches) {
      if (!isWatched(m, prefs)) continue
      const p = prev.get(m.id)
      const c = next.get(m.id)!
      const label = `${m.home.name} ${c.score[0]} x ${c.score[1]} ${m.away.name}`
      if (!p) {
        if (prefs.start && (m.minute ?? 0) <= 5) add(m, 'start', 'Começou!', `${m.home.name} x ${m.away.name}`, 'start')
        continue
      }
      ;([0, 1] as const).forEach((i) => {
        const team = i === 0 ? m.home.name : m.away.name
        if (prefs.goal && c.score[i] > p.score[i]) {
          const goal = [...m.events].reverse().find((e) => ['goal', 'penalty_goal', 'own_goal'].includes(e.type))
          const how = goal?.type === 'penalty_goal' ? ' de pênalti' : goal?.type === 'own_goal' ? ' (gol contra)' : ''
          add(m, 'goal', `GOOOL do ${team}${how}!`, `${goal ? `${goal.player} ${goal.minute}' · ` : ''}${label}`, `goal-${i}-${c.score[i]}`)
        }
        if (prefs.corner && c.corners[i] > p.corners[i])
          add(m, 'corner', `Escanteio para o ${team}`, `${c.corners[0]} x ${c.corners[1]} escanteios · ${m.minute}'`, `corner-${i}-${c.corners[i]}`)
        if (prefs.foul && c.fouls[i] > p.fouls[i])
          add(m, 'foul', `Falta do ${team}`, `${c.fouls[0]} x ${c.fouls[1]} faltas · ${m.minute}'`, `foul-${i}-${c.fouls[i]}`)
        if (prefs.offside && c.offsides[i] > p.offsides[i])
          add(m, 'offside', `Impedimento: ${team}`, `${c.offsides[0]} x ${c.offsides[1]} impedimentos · ${m.minute}'`, `off-${i}-${c.offsides[i]}`)
        if (prefs.card && c.cards[i] > p.cards[i]) {
          const card = [...m.events].reverse().find((e) => (e.type === 'yellow' || e.type === 'red') && e.teamId === (i === 0 ? m.home.id : m.away.id))
          add(m, 'card', `${card?.type === 'red' ? 'Cartão vermelho' : 'Cartão amarelo'} · ${team}`, `${card?.player ?? ''} ${card?.minute ?? ''}' · ${label}`, `card-${i}-${c.cards[i]}`)
        }
      })
      if (prefs.penalty && c.penalties > p.penalties) {
        const pen = [...m.events].reverse().find((e) => e.type === 'penalty_goal' || e.type === 'penalty_missed')
        add(m, 'penalty', pen?.type === 'penalty_missed' ? 'Pênalti perdido!' : 'Pênalti convertido!', `${pen?.player ?? ''} ${pen?.minute ?? ''}' · ${label}`, `pen-${c.penalties}`)
      }
      if (prefs.halftime && c.status === 'HT' && p.status !== 'HT') add(m, 'halftime', 'Intervalo', label, 'ht')
      if (prefs.end && ['FT', 'AET', 'PEN'].includes(c.status) && !['FT', 'AET', 'PEN'].includes(p.status))
        add(m, 'end', 'Fim de jogo', label, 'end')
    }

    if (prefs.end) {
      for (const [id, p] of prev) {
        if (next.has(id)) continue
        const fake = { id, home: { id: -1 }, away: { id: -2 } }
        const fav = readFavorites()
        const watched = prefs.scope === 'all' || fav.matches.includes(id) || fav.teams.some((t) => t.name === p.home || t.name === p.away)
        if (watched) add(fake, 'end', 'Fim de jogo', `${p.home} ${p.score[0]} x ${p.score[1]} ${p.away}`, 'end')
      }
    }

    snapshots.current = next
    emit(out)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live])

  useEffect(() => {
    if (!today) return
    const prefs = readAlertPrefs()
    if (!prefs.lineup) return
    const fav = readFavorites()
    if (!fav.teams.length) return
    const now = Date.now()
    const out: AppNotification[] = []
    for (const m of today.matches) {
      if (m.status !== 'NS') continue
      const diff = new Date(m.kickoff).getTime() - now
      if (diff < 0 || diff > 75 * 60_000) continue
      const favTeam = fav.teams.find((t) => t.id === m.home.id || t.id === m.away.id)
      if (!favTeam) continue
      out.push({
        id: `${m.id}-lineup`,
        matchId: m.id,
        kind: 'lineup',
        title: `Escalação prevista: ${favTeam.name}`,
        body: `${m.home.name} x ${m.away.name} às ${formatTime(m.kickoff)} — veja o time provável`,
        at: now,
        read: false,
      })
    }
    emit(out)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])

  return null
}
