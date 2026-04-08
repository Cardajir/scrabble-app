'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface QueueEntry {
  id: string
  status: string
  joined_at: string
  search_range_min: number
  search_range_max: number
}

interface Props {
  user: { id: string; nickname: string; elo_rating: number }
  initialQueueEntry: QueueEntry | null
  recentGames: {
    id: string
    status: string
    created_at: string
    winner_id: string | null
    game_players: { user_id: string; score: number; turn_order: number }[]
  }[]
}

export function RankedLobbyClient({ user, initialQueueEntry, recentGames }: Props) {
  const router = useRouter()
  const [inQueue, setInQueue] = useState(!!initialQueueEntry)
  const [loading, setLoading] = useState(false)
  const [waitTime, setWaitTime] = useState(0)
  const [joinedAt] = useState(
    initialQueueEntry ? new Date(initialQueueEntry.joined_at) : null
  )

  useEffect(() => {
    if (!inQueue || !joinedAt) return

    const interval = setInterval(() => {
      setWaitTime(Math.floor((Date.now() - joinedAt.getTime()) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [inQueue, joinedAt])

  const handleJoinQueue = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ranked/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Chyba při vstupu do fronty')
        return
      }

      setInQueue(true)
      toast.success('Vstoupili jste do ranked fronty')
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveQueue = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ranked/queue', { method: 'DELETE' })

      if (!res.ok) {
        toast.error('Chyba při odchodu z fronty')
        return
      }

      setInQueue(false)
      setWaitTime(0)
      toast.success('Opustili jste frontu')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const eloRange = Math.min(100 + Math.floor(waitTime / 30) * 50, 400)

  return (
    <div className="relative min-h-screen grid-bg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-purple-600/8 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-4xl font-heading text-neon mb-2">RANKED MÓD</h1>
        <p className="text-muted-foreground mb-10 text-sm">
          Soutěžní hry s ELO systémem. Hráči jsou párováni dle podobného ratingu.
        </p>

        {/* ELO card */}
        <div className="card-gaming rounded-2xl p-6 mb-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-lg">{user.nickname}</p>
            <p className="text-muted-foreground text-xs mt-0.5">Váš aktuální rating</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
            </svg>
            <span className="font-mono font-bold text-xl text-primary">{user.elo_rating}</span>
            <span className="text-xs text-muted-foreground">ELO</span>
          </div>
        </div>

        {/* Matchmaking card */}
        <div className="card-gaming rounded-2xl p-8 mb-8 text-center">
          <h2 className="font-heading text-lg mb-6">MATCHMAKING</h2>

          {inQueue ? (
            <div className="space-y-6">
              {/* Animated radar */}
              <div className="relative inline-flex items-center justify-center w-24 h-24 mx-auto">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary/20 animate-ping" />
                <span className="absolute inline-flex h-16 w-16 rounded-full bg-primary/10 animate-ping" style={{ animationDelay: '0.3s' }} />
                <svg className="relative w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>

              <p className="text-lg font-semibold">Hledám soupeře...</p>
              <p className="text-4xl font-mono font-bold text-primary text-neon">
                {formatTime(waitTime)}
              </p>
              <p className="text-sm text-muted-foreground">
                Hledám hráče s ELO v rozsahu ±{eloRange}
              </p>

              <Button
                variant="outline"
                onClick={handleLeaveQueue}
                disabled={loading}
                className="border-[#F43F5E]/40 text-[#F43F5E] hover:bg-[#F43F5E]/10 hover:border-[#F43F5E]"
              >
                {loading ? 'Odcházím...' : 'Opustit frontu'}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mx-auto">
                <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
                </svg>
              </div>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Připraveni na ranked hru? Systém vám najde soupeře s podobným ELO.
              </p>
              <Button size="lg" onClick={handleJoinQueue} disabled={loading} className="neon-purple px-10">
                {loading ? 'Vstupuji...' : 'Hledat soupeře'}
              </Button>
            </div>
          )}
        </div>

        {/* Recent games */}
        {recentGames.length > 0 && (
          <div className="card-gaming rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-primary/10">
              <h2 className="font-heading text-base">NEDÁVNÉ RANKED HRY</h2>
            </div>
            <div className="divide-y divide-primary/10">
              {recentGames.map((game) => {
                const myPlayer = game.game_players.find((p) => p.user_id === user.id)
                const isWinner = game.winner_id === user.id
                const isFinished = game.status === 'FINISHED'

                return (
                  <div
                    key={game.id}
                    className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-primary/5 transition-colors"
                    onClick={() => router.push(`/hry/${game.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        !isFinished ? 'bg-primary/10' :
                        isWinner ? 'bg-yellow-500/10' : 'bg-[#F43F5E]/10'
                      }`}>
                        {!isFinished ? (
                          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                        ) : isWinner ? (
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-[#F43F5E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {!isFinished ? 'Probíhá' : isWinner ? 'Výhra' : 'Prohra'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(game.created_at).toLocaleDateString('cs-CZ')}
                        </p>
                      </div>
                    </div>
                    {myPlayer && (
                      <span className="font-mono text-sm px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                        {myPlayer.score} b
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
