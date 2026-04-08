'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface MatchmakingState {
  inQueue: boolean
  waitTime: number
  matchedGameId: string | null
  loading: boolean
}

export function useMatchmaking(userId: string) {
  const router = useRouter()
  const supabase = createClient()
  const [state, setState] = useState<MatchmakingState>({
    inQueue: false,
    waitTime: 0,
    matchedGameId: null,
    loading: false,
  })
  const [joinedAt, setJoinedAt] = useState<Date | null>(null)

  // Timer pro dobu čekání
  useEffect(() => {
    if (!state.inQueue || !joinedAt) return

    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        waitTime: Math.floor((Date.now() - joinedAt.getTime()) / 1000),
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [state.inQueue, joinedAt])

  // Sledovat notifikace o matchmakingu
  useEffect(() => {
    if (!state.inQueue) return

    const channel = supabase
      .channel(`matchmaking:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notif = payload.new
          if (notif.type === 'GAME_START' && notif.related_id) {
            setState((prev) => ({ ...prev, inQueue: false, matchedGameId: notif.related_id }))
            toast.success('Soupeř nalezen! Přesměrovávám do hry...')
            setTimeout(() => router.push(`/hry/${notif.related_id}`), 1500)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, state.inQueue, supabase, router])

  const joinQueue = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const res = await fetch('/api/ranked/queue', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Chyba při vstupu do fronty')
        return
      }
      setJoinedAt(new Date())
      setState((prev) => ({ ...prev, inQueue: true, waitTime: 0 }))
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  const leaveQueue = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }))
    try {
      await fetch('/api/ranked/queue', { method: 'DELETE' })
      setState((prev) => ({ ...prev, inQueue: false, waitTime: 0 }))
      setJoinedAt(null)
    } finally {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  return { ...state, joinQueue, leaveQueue }
}
