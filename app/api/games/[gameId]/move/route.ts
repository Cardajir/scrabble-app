import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validatePlaceMove, validateRackHasTiles } from '@/lib/game/validation'
import { validateWords } from '@/lib/game/dictionary'
import { drawTiles } from '@/lib/game/tiles'
import type { Tile } from '@/lib/game/tiles'
import type { PlacedTile, BoardState } from '@/lib/game/board'
import type { Json } from '@/types/supabase'

const moveSchema = z.object({
  tiles: z.array(z.object({
    row: z.number().int().min(0).max(14),
    col: z.number().int().min(0).max(14),
    tile: z.object({
      id: z.string(),
      letter: z.string(),
      value: z.number(),
      isBlank: z.boolean(),
      blankLetter: z.string().optional(),
    }),
    blankLetter: z.string().optional(),
  })).min(1),
})

type GamePlayer = {
  id: string
  game_id: string
  user_id: string
  rack: Tile[]
  score: number
  is_active: boolean
  has_left: boolean
  turn_order: number
  joined_at: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const body = await request.json()
  const parsed = moveSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Neplatná data tahu' }, { status: 400 })

  const { tiles: tilesToPlace } = parsed.data

  // Načíst stav hry
  const { data: game } = await supabase
    .from('games')
    .select('*, game_players(*)')
    .eq('id', gameId)
    .single()

  if (!game) return NextResponse.json({ error: 'Hra nenalezena' }, { status: 404 })
  if (game.status !== 'IN_PROGRESS') return NextResponse.json({ error: 'Hra není aktivní' }, { status: 400 })

  const players = (game.game_players as unknown as GamePlayer[])
  const currentPlayer = players[game.current_player_index]

  if (currentPlayer.user_id !== user.id) {
    return NextResponse.json({ error: 'Nejste na tahu' }, { status: 403 })
  }

  const rack = currentPlayer.rack as Tile[]
  const boardState = game.board_state as unknown as Record<string, PlacedTile>

  // Ověřit, že hráč má všechna dlaždice
  if (!validateRackHasTiles(rack, tilesToPlace)) {
    return NextResponse.json({ error: 'Nemáte tato písmena na stojánku' }, { status: 400 })
  }

  // Validovat tah
  const validation = validatePlaceMove(boardState, tilesToPlace, game.turn_number)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  // Validovat slova ve slovníku
  const wordMap = await validateWords(validation.words)
  const invalidWords = validation.words.filter((w) => !wordMap.get(w))
  if (invalidWords.length > 0) {
    return NextResponse.json(
      { error: `Neplatná slova: ${invalidWords.join(', ')}` },
      { status: 400 }
    )
  }

  // Odebrat použité kameny ze stojánku a doplnit z pytlíku
  const usedIds = new Set(tilesToPlace.map((t) => t.tile.id))
  const newRack = rack.filter((t) => !usedIds.has(t.id))
  const tileBag = game.tile_bag as unknown as Tile[]
  const { drawn, remaining } = drawTiles(tileBag, 7 - newRack.length)
  const finalRack = [...newRack, ...drawn]

  // Přepočítat next player index
  const nextPlayerIndex = (game.current_player_index + 1) % players.length

  // Zkontrolovat, zda hra skončila (prázdný pytlík a prázdný stojánek)
  let newStatus: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED' = game.status
  let winnerId: string | null = null

  if (remaining.length === 0 && finalRack.length === 0) {
    newStatus = 'FINISHED'
    // Vítěz = hráč s nejvyšším skóre
    const updatedScores = players.map((p) => ({
      userId: p.user_id,
      score: p.score + (p.user_id === user.id ? validation.score : 0),
    }))
    winnerId = updatedScores.reduce((a, b) => (a.score > b.score ? a : b)).userId
  }

  // Uložit tah do DB
  await supabase.from('game_moves').insert({
    game_id: gameId,
    user_id: user.id,
    move_type: 'PLACE',
    tiles: JSON.stringify(tilesToPlace) as unknown as Json,
    words: JSON.stringify(validation.words) as unknown as Json,
    score: validation.score,
    rack_after: JSON.stringify(finalRack) as unknown as Json,
  })

  // Aktualizovat stav hráče
  const newScore = currentPlayer.score + validation.score
  await supabase
    .from('game_players')
    .update({ rack: JSON.stringify(finalRack) as unknown as Json, score: newScore })
    .eq('game_id', gameId)
    .eq('user_id', user.id)

  // Aktualizovat stav hry
  await supabase.from('games').update({
    board_state: validation.newBoardState as unknown as Json,
    tile_bag: JSON.stringify(remaining) as unknown as Json,
    current_player_index: nextPlayerIndex,
    turn_number: game.turn_number + 1,
    status: newStatus,
    winner_id: winnerId,
  }).eq('id', gameId)

  // Pokud hra skončila, aktualizovat statistiky
  if (newStatus === 'FINISHED') {
    await finalizeGame(supabase, gameId, players, winnerId)
  }

  return NextResponse.json({
    score: validation.score,
    words: validation.words,
    newRack: finalRack,
  })
}

async function finalizeGame(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  gameId: string,
  players: GamePlayer[],
  winnerId: string | null
) {
  for (const player of players) {
    const isWinner = player.user_id === winnerId

    // Aktualizovat statistiky manuálně
    const { data: stats } = await supabase
      .from('statistics')
      .select('*')
      .eq('user_id', player.user_id)
      .single()

    if (stats) {
      await supabase.from('statistics').update({
        games_played: stats.games_played + 1,
        games_won: isWinner ? stats.games_won + 1 : stats.games_won,
        games_lost: !isWinner ? stats.games_lost + 1 : stats.games_lost,
        total_score: stats.total_score + player.score,
        average_score: (stats.total_score + player.score) / (stats.games_played + 1),
        current_win_streak: isWinner ? stats.current_win_streak + 1 : 0,
        best_win_streak: isWinner
          ? Math.max(stats.best_win_streak, stats.current_win_streak + 1)
          : stats.best_win_streak,
      }).eq('user_id', player.user_id)
    }
  }

  // Notifikace o konci hry
  for (const player of players) {
    await supabase.from('notifications').insert({
      user_id: player.user_id,
      type: 'GAME_END',
      title: 'Hra skončila',
      body: player.user_id === winnerId ? 'Vyhráli jste!' : 'Hra skončila.',
      related_id: gameId,
    })
  }
}
