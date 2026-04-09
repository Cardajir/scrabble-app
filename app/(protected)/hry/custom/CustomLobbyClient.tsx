'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreateGameModal } from '@/components/lobby/CreateGameModal'

interface Game {
  id: string
  name: string | null
  status: string
  max_players: number
  is_private: boolean
  created_at: string
  game_players: { count: number }[]
  users: { nickname: string } | null
}

interface Props {
  user: { id: string; nickname: string; elo_rating: number }
  initialGames: Game[]
}

export function CustomLobbyClient({ user, initialGames }: Props) {
  const router = useRouter()
  const [games] = useState(initialGames)
  const [showCreate, setShowCreate] = useState(false)
  const [joining, setJoining] = useState<string | null>(null)

  const handleJoin = async (gameId: string) => {
    setJoining(gameId)
    try {
      const res = await fetch(`/api/games/${gameId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Chyba pri pripojovani ke hre')
        return
      }

      router.push(`/hry/${gameId}`)
    } finally {
      setJoining(null)
    }
  }

  return (
    <div className="relative min-h-screen paper-bg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-accent/30 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Custom hry</h1>
            <p className="text-muted-foreground mt-1 text-sm">Pripojte se k existujici hre nebo vytvorte novou</p>
          </div>
          <Button onClick={() => setShowCreate(true)} size="lg" className="glow-primary gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Vytvorit hru
          </Button>
        </div>

        {games.length === 0 ? (
          <div className="text-center py-28">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/8 mb-6">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" />
              </svg>
            </div>
            <p className="text-xl font-bold text-muted-foreground mb-2">Zadne dostupne hry</p>
            <p className="text-sm text-muted-foreground mb-6">Budte prvni a vytvorte hru</p>
            <Button onClick={() => setShowCreate(true)} className="glow-primary">Vytvorit prvni hru</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => {
              const playerCount = game.game_players?.[0]?.count ?? 0
              const isFull = playerCount >= game.max_players
              const isInProgress = game.status === 'IN_PROGRESS'

              return (
                <div
                  key={game.id}
                  className={`card-clubhouse rounded-2xl p-5 flex flex-col gap-4 transition-all ${
                    isFull ? 'opacity-50' : 'hover:shadow-md'
                  }`}
                >
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base truncate flex-1">
                      {game.name ?? 'Nepojmenovana hra'}
                    </h3>
                    <div className="flex gap-1 shrink-0">
                      {game.is_private && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-[#8B6914]/10 text-[#8B6914]">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                          </svg>
                          Soukroma
                        </span>
                      )}
                      {isInProgress && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-primary/8 text-primary">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          Probiha
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                      <span>Vytvoril: <span className="text-foreground font-medium">{game.users?.nickname ?? 'Neznamy'}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                      </svg>
                      <span>Hraci: <span className="text-foreground font-medium">{playerCount}/{game.max_players}</span></span>
                    </div>
                  </div>

                  {/* Player bar */}
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(playerCount / game.max_players) * 100}%` }}
                    />
                  </div>

                  <Button
                    className={`w-full ${!isFull && !isInProgress ? 'glow-primary' : ''}`}
                    disabled={isFull || isInProgress || joining === game.id}
                    onClick={() => handleJoin(game.id)}
                    variant={isFull || isInProgress ? 'outline' : 'default'}
                  >
                    {isFull ? 'Plna' : isInProgress ? 'Probiha' : joining === game.id ? 'Pripojuji...' : 'Pripojit se'}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateGameModal
          type="CUSTOM"
          onClose={() => setShowCreate(false)}
          onCreated={(gameId) => router.push(`/hry/${gameId}`)}
        />
      )}
    </div>
  )
}
