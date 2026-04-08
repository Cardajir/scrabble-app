'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGameStore } from '@/store/gameStore'
import type { Database } from '@/types/supabase'

type Game = Database['public']['Tables']['games']['Row']
type GamePlayer = Database['public']['Tables']['game_players']['Row']
type GameMove = Database['public']['Tables']['game_moves']['Row']

export function useGame(gameId: string, currentUserId: string) {
  const {
    game, setGame,
    players, setPlayers,
    setBoardState, setRack,
    clearPendingTiles,
  } = useGameStore()

  const supabase = createClient()

  const refreshPlayers = useCallback(async () => {
    const { data } = await supabase
      .from('game_players')
      .select('*, users(id, nickname, elo_rating, avatar_url)')
      .eq('game_id', gameId)
      .order('turn_order')

    if (data) {
      setPlayers(data as Parameters<typeof setPlayers>[0])
      const me = data.find((p) => p.user_id === currentUserId)
      if (me) {
        setRack(me.rack as unknown as Parameters<typeof setRack>[0])
        clearPendingTiles()
      }
    }
  }, [gameId, currentUserId, supabase, setPlayers, setRack, clearPendingTiles])

  useEffect(() => {
    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => {
          const updatedGame = payload.new as Game
          setGame(updatedGame)
          setBoardState(
            updatedGame.board_state as unknown as Parameters<typeof setBoardState>[0]
          )
          refreshPlayers()
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_moves', filter: `game_id=eq.${gameId}` },
        (_payload) => {
          refreshPlayers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, supabase, setGame, setBoardState, refreshPlayers])

  const currentPlayerIndex = game?.current_player_index ?? 0
  const currentTurnPlayer = players[currentPlayerIndex]
  const isMyTurn = currentTurnPlayer?.user_id === currentUserId

  return { game, players, isMyTurn, currentTurnPlayer, refreshPlayers }
}
