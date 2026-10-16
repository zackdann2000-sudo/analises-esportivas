'use client'

import { useCallback, useSyncExternalStore } from 'react'
import type { TeamRef } from './types'

function createStore<T>(key: string, initial: T) {
  let cache: T | null = null
  const listeners = new Set<() => void>()

  const read = (): T => {
    if (cache) return cache
    if (typeof window === 'undefined') return initial
    try {
      const raw = window.localStorage.getItem(key)
      cache = raw ? { ...initial, ...JSON.parse(raw) } : initial
    } catch {
      cache = initial
    }
    return cache as T
  }

  const write = (next: T) => {
    cache = next
    try {
      window.localStorage.setItem(key, JSON.stringify(next))
    } catch {}
    listeners.forEach((l) => l())
  }

  const subscribe = (l: () => void) => {
    listeners.add(l)
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        cache = null
        l()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(l)
      window.removeEventListener('storage', onStorage)
    }
  }

  return { read, write, subscribe, initial }
}

export interface Favorites {
  teams: TeamRef[]
  matches: string[]
}

export interface AlertPrefs {
  goal: boolean
  corner: boolean
  foul: boolean
  offside: boolean
  card: boolean
  penalty: boolean
  start: boolean
  halftime: boolean
  end: boolean
  lineup: boolean
  scope: 'favorites' | 'all'
  push: boolean
}

export interface AppNotification {
  id: string
  matchId: string
  title: string
  body: string
  kind: keyof Omit<AlertPrefs, 'scope' | 'push'>
  at: number
  read: boolean
}

const favoritesStore = createStore<Favorites>('rg:favorites', { teams: [], matches: [] })

const alertStore = createStore<AlertPrefs>('rg:alerts', {
  goal: true,
  corner: true,
  foul: false,
  offside: true,
  card: true,
  penalty: true,
  start: true,
  halftime: true,
  end: true,
  lineup: true,
  scope: 'favorites',
  push: false,
})

const inboxStore = createStore<{ items: AppNotification[] }>('rg:inbox', { items: [] })

function useStore<T>(store: ReturnType<typeof createStore<T>>) {
  return useSyncExternalStore(store.subscribe, store.read, () => store.initial)
}

export function useFavorites() {
  const favorites = useStore(favoritesStore)

  const isTeamFavorite = useCallback((id: number) => favorites.teams.some((t) => t.id === id), [favorites])
  const isMatchFavorite = useCallback((id: string) => favorites.matches.includes(id), [favorites])

  const toggleTeam = useCallback((team: TeamRef) => {
    const cur = favoritesStore.read()
    const exists = cur.teams.some((t) => t.id === team.id)
    favoritesStore.write({
      ...cur,
      teams: exists ? cur.teams.filter((t) => t.id !== team.id) : [...cur.teams, team],
    })
    return !exists
  }, [])

  const toggleMatch = useCallback((id: string) => {
    const cur = favoritesStore.read()
    const exists = cur.matches.includes(id)
    favoritesStore.write({
      ...cur,
      matches: exists ? cur.matches.filter((m) => m !== id) : [...cur.matches, id].slice(-60),
    })
    return !exists
  }, [])

  return { favorites, isTeamFavorite, isMatchFavorite, toggleTeam, toggleMatch }
}

export function useAlertPrefs() {
  const prefs = useStore(alertStore)
  const update = useCallback((patch: Partial<AlertPrefs>) => {
    alertStore.write({ ...alertStore.read(), ...patch })
  }, [])
  return { prefs, update }
}

export function readAlertPrefs() {
  return alertStore.read()
}

export function readFavorites() {
  return favoritesStore.read()
}

export function useInbox() {
  const inbox = useStore(inboxStore)
  const markAllRead = useCallback(() => {
    const cur = inboxStore.read()
    inboxStore.write({ items: cur.items.map((i) => ({ ...i, read: true })) })
  }, [])
  const clear = useCallback(() => inboxStore.write({ items: [] }), [])
  return { items: inbox.items, unread: inbox.items.filter((i) => !i.read).length, markAllRead, clear }
}

export function pushInbox(items: AppNotification[]) {
  const cur = inboxStore.read()
  const known = new Set(cur.items.map((i) => i.id))
  const fresh = items.filter((i) => !known.has(i.id))
  if (fresh.length) inboxStore.write({ items: [...fresh, ...cur.items].slice(0, 50) })
  return fresh
}
