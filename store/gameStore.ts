import { create } from 'zustand'
import type { Database } from '@/types/supabase'
import type { Tile } from '@/lib/game/tiles'
import type { PlacedTile } from '@/lib/game/board'

type Game = Database['public']['Tables']['games']['Row']
type GamePlayer = Database['public']['Tables']['game_players']['Row'] & {
  users: { id: string; nickname: string; elo_rating: number; avatar_url: string | null } | null
}

export interface PendingTileMove {
  row: number
  col: number
  tile: Tile
}

interface GameState {
  game: Game | null
  players: GamePlayer[]
  boardState: Record<string, PlacedTile>
  rack: Tile[]
  pendingTiles: PendingTileMove[]
  activeDragId: string | null

  setGame: (game: Game) => void
  setPlayers: (players: GamePlayer[]) => void
  setBoardState: (state: Record<string, PlacedTile>) => void
  setRack: (rack: Tile[]) => void
  addPendingTile: (move: PendingTileMove) => void
  removePendingTile: (tileId: string) => void
  clearPendingTiles: () => void
  setActiveDragId: (id: string | null) => void
}

export const useGameStore = create<GameState>((set) => ({
  game: null,
  players: [],
  boardState: {},
  rack: [],
  pendingTiles: [],
  activeDragId: null,

  setGame: (game) => set({ game }),
  setPlayers: (players) => set({ players }),
  setBoardState: (boardState) => set({ boardState }),
  setRack: (rack) => set({ rack }),

  addPendingTile: (move) =>
    set((state) => {
      // Pokud je na pozici jiná pending dlaždice, vrátit ji
      const existing = state.pendingTiles.find(
        (pt) => pt.row === move.row && pt.col === move.col
      )
      const filtered = existing
        ? state.pendingTiles.filter((pt) => !(pt.row === move.row && pt.col === move.col))
        : state.pendingTiles
      return { pendingTiles: [...filtered, move] }
    }),

  removePendingTile: (tileId) =>
    set((state) => ({
      pendingTiles: state.pendingTiles.filter((pt) => pt.tile.id !== tileId),
    })),

  clearPendingTiles: () => set({ pendingTiles: [] }),
  setActiveDragId: (activeDragId) => set({ activeDragId }),
}))
