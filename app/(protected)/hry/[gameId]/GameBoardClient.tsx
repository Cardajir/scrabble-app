'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import { Board } from '@/components/game/Board'
import { Rack } from '@/components/game/Rack'
import { ScoreBoard } from '@/components/game/ScoreBoard'
import { MoveControls } from '@/components/game/MoveControls'
import { TurnTimer } from '@/components/game/TurnTimer'
import { Tile } from '@/components/game/Tile'
import { useGameStore } from '@/store/gameStore'
import type { Tile as TileType } from '@/lib/game/tiles'
import type { PlacedTileMove } from '@/lib/game/validation'

type Game = Database['public']['Tables']['games']['Row']
type GamePlayer = Database['public']['Tables']['game_players']['Row'] & {
  users: {
    id: string
    nickname: string
    elo_rating: number
    avatar_url: string | null
  } | null
}
type GameMove = Database['public']['Tables']['game_moves']['Row']

interface Props {
  gameId: string
  currentUser: {
    id: string
    nickname: string
    elo_rating: number
    avatar_url: string | null
  }
  initialGame: Game
  initialPlayers: GamePlayer[]
  initialMoves: GameMove[]
  isPlayer: boolean
}

export function GameBoardClient({
  gameId,
  currentUser,
  initialGame,
  initialPlayers,
  initialMoves,
  isPlayer,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const {
    game, setGame,
    players, setPlayers,
    boardState, setBoardState,
    rack, setRack,
    pendingTiles, addPendingTile, removePendingTile, clearPendingTiles,
    activeDragId, setActiveDragId,
  } = useGameStore()

  const [moves, setMoves] = useState(initialMoves)
  const [submitting, setSubmitting] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    setGame(initialGame)
    setPlayers(initialPlayers)
    setBoardState(initialGame.board_state as Record<string, { letter: string; value: number; isBlank: boolean }>)

    const myPlayer = initialPlayers.find((p) => p.user_id === currentUser.id)
    if (myPlayer) {
      setRack(myPlayer.rack as unknown as TileType[])
    }
  }, [initialGame, initialPlayers, currentUser.id, setGame, setPlayers, setBoardState, setRack])

  useEffect(() => {
    const gameChannel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_moves',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          setMoves((prev) => [payload.new as GameMove, ...prev])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        async (payload) => {
          const updatedGame = payload.new as Game
          setGame(updatedGame)
          setBoardState(updatedGame.board_state as Record<string, { letter: string; value: number; isBlank: boolean }>)

          const { data: updatedPlayers } = await supabase
            .from('game_players')
            .select(`id, game_id, user_id, rack, score, is_active, has_left, turn_order, joined_at, users(id, nickname, elo_rating, avatar_url)`)
            .eq('game_id', gameId)
            .order('turn_order')

          if (updatedPlayers) {
            setPlayers(updatedPlayers as unknown as GamePlayer[])
            const myPlayer = updatedPlayers.find((p) => p.user_id === currentUser.id)
            if (myPlayer) {
              setRack(myPlayer.rack as unknown as TileType[])
              clearPendingTiles()
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(gameChannel)
    }
  }, [gameId, currentUser.id, supabase, setGame, setPlayers, setBoardState, setRack, clearPendingTiles])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }, [setActiveDragId])

  const handleDragOver = useCallback((_event: DragOverEvent) => {}, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null)
      const { active, over } = event

      if (!over) return

      const tileId = String(active.id)
      const targetId = String(over.id)

      if (targetId.startsWith('board-cell-')) {
        const [, , rowStr, colStr] = targetId.split('-')
        const row = parseInt(rowStr)
        const col = parseInt(colStr)

        const tileFromRack = rack.find((t) => t.id === tileId)
        const tileFromPending = pendingTiles.find((pt) => pt.tile.id === tileId)

        if (tileFromRack) {
          addPendingTile({ row, col, tile: tileFromRack })
        } else if (tileFromPending) {
          removePendingTile(tileFromPending.tile.id)
          addPendingTile({ row, col, tile: tileFromPending.tile })
        }
      }

      if (targetId === 'rack' || targetId.startsWith('rack-slot-')) {
        const pending = pendingTiles.find((pt) => pt.tile.id === tileId)
        if (pending) {
          removePendingTile(tileId)
        }
      }
    },
    [rack, pendingTiles, addPendingTile, removePendingTile, setActiveDragId]
  )

  useEffect(() => {
    if (pendingTiles.length === 0) {
      setValidationError(null)
      return
    }

    setValidating(true)
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch('/api/dictionary/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pendingTiles, boardState }),
        })
        const data = await res.json()
        setValidationError(data.error ?? null)
      } finally {
        setValidating(false)
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [pendingTiles, boardState])

  const handleConfirmMove = async () => {
    if (pendingTiles.length === 0) return
    setSubmitting(true)

    try {
      const res = await fetch(`/api/games/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiles: pendingTiles }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Chyba pri potvrzeni tahu')
        return
      }

      const result = await res.json()
      toast.success(`Tah potvrzen! +${result.score} bodu`)
      clearPendingTiles()
    } finally {
      setSubmitting(false)
    }
  }

  const handlePass = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/games/${gameId}/pass`, { method: 'POST' })
      if (!res.ok) {
        toast.error('Chyba pri preskoceni tahu')
        return
      }
      clearPendingTiles()
      toast.info('Tah preskozen')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResign = async () => {
    if (!confirm('Opravdu chcete vzdat hru?')) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/games/${gameId}/resign`, { method: 'POST' })
      if (!res.ok) {
        toast.error('Chyba pri vzdavani hry')
        return
      }
      toast.info('Hru jste vzdali')
      router.push('/hry/custom')
    } finally {
      setSubmitting(false)
    }
  }

  const currentGame = game ?? initialGame
  const currentPlayers = players.length > 0 ? players : initialPlayers
  const myPlayer = currentPlayers.find((p) => p.user_id === currentUser.id)
  const currentPlayerIndex = currentGame.current_player_index
  const currentTurnPlayer = currentPlayers[currentPlayerIndex]
  const isMyTurn = currentTurnPlayer?.user_id === currentUser.id
  const tileBagSize = Array.isArray(currentGame.tile_bag) ? (currentGame.tile_bag as unknown[]).length : 0

  const activeTile =
    activeDragId
      ? rack.find((t) => t.id === activeDragId) ??
        pendingTiles.find((pt) => pt.tile.id === activeDragId)?.tile ??
        null
      : null

  if (currentGame.status === 'FINISHED') {
    const winner = currentPlayers.find((p) => p.user_id === currentGame.winner_id)
    return (
      <div className="min-h-screen paper-bg flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-[#8B6914]/10 mb-6">
          <svg className="w-12 h-12 text-[#8B6914]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-4">Hra skoncila!</h1>
        <p className="text-xl text-muted-foreground mb-10">
          {winner
            ? `Vitez: ${winner.users?.nickname}`
            : 'Hra skoncila remizou'}
        </p>
        <div className="w-full max-w-lg">
          <ScoreBoard players={currentPlayers} currentUserId={currentUser.id} />
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-2 border-b shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">
              {currentGame.name ?? 'Scrabble'}
            </h1>
            <span className={`text-xs flex items-center gap-1.5 ${isMyTurn ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              {isMyTurn ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Vas tah
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  {currentTurnPlayer?.users?.nickname ?? '...'}
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentGame.turn_time_limit && (
              <TurnTimer
                limit={currentGame.turn_time_limit}
                isActive={isMyTurn}
                onExpire={handlePass}
              />
            )}
            <button
              onClick={handleResign}
              disabled={submitting}
              className="text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/8 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Vzdat hru
            </button>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex min-h-0">
          {/* Left panel */}
          <aside className="w-64 xl:w-72 shrink-0 border-r p-3 flex flex-col gap-3 overflow-y-auto">
            {/* Score */}
            <div>
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground mb-2 px-1 uppercase">Skore</h3>
              <ScoreBoard
                players={currentPlayers}
                currentUserId={currentUser.id}
                currentTurnUserId={currentTurnPlayer?.user_id}
              />
            </div>

            {/* Game info */}
            <div className="card-clubhouse rounded-xl p-3 space-y-2">
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Info</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-secondary rounded-lg px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">V pytli</p>
                  <p className="text-lg font-mono font-bold">{tileBagSize}</p>
                </div>
                <div className="bg-secondary rounded-lg px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">Tah</p>
                  <p className="text-lg font-mono font-bold">{moves.length + 1}</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            {isPlayer && (
              <div className="space-y-2">
                <MoveControls
                  hasPending={pendingTiles.length > 0}
                  isMyTurn={isMyTurn}
                  isSubmitting={submitting}
                  isValidating={validating}
                  validationError={validationError}
                  onConfirm={handleConfirmMove}
                  onCancel={clearPendingTiles}
                  onPass={handlePass}
                  onResign={handleResign}
                  gameId={gameId}
                  rack={rack}
                  tileBagSize={tileBagSize}
                />
              </div>
            )}

            {/* Last moves */}
            {moves.length > 0 && (
              <div className="card-clubhouse rounded-xl p-3 flex-1 min-h-0">
                <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground mb-2 uppercase">Posledni tahy</h3>
                <div className="space-y-1 overflow-y-auto max-h-48">
                  {moves.slice(0, 15).map((move) => {
                    const player = currentPlayers.find((p) => p.user_id === move.user_id)
                    return (
                      <div key={move.id} className="text-xs flex justify-between py-0.5">
                        <span className="text-muted-foreground truncate max-w-[120px]">{player?.users?.nickname}</span>
                        <span className={`font-mono font-semibold ${move.move_type === 'PLACE' ? 'text-primary' : 'text-muted-foreground'}`}>
                          {move.move_type === 'PLACE'
                            ? `+${move.score}`
                            : move.move_type === 'PASS'
                            ? 'preskocil'
                            : move.move_type === 'EXCHANGE'
                            ? 'vymenil'
                            : 'vzdal'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* Center: Board + Rack */}
          <main className="flex-1 flex flex-col items-center min-h-0 p-4">
            <div className="flex-1 w-full flex items-center justify-center min-h-0">
              <div className="max-h-full max-w-full" style={{ aspectRatio: '1/1', height: '100%' }}>
                <Board
                  boardState={boardState}
                  pendingTiles={pendingTiles.map((pt) => ({
                    ...pt,
                    letter: pt.tile.isBlank ? (pt.tile.blankLetter ?? '?') : pt.tile.letter,
                  }))}
                />
              </div>
            </div>

            {isPlayer && (
              <div className="w-full max-w-2xl shrink-0 mt-3">
                <Rack
                  tiles={rack.filter(
                    (t) => !pendingTiles.some((pt) => pt.tile.id === t.id)
                  )}
                  pendingTileIds={new Set(pendingTiles.map((pt) => pt.tile.id))}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      <DragOverlay>
        {activeTile && (
          <Tile
            tile={activeTile}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
