import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Tile } from '@/lib/game/tiles'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const { data: game } = await supabase
    .from('games')
    .select('*, game_players(*)')
    .eq('id', gameId)
    .single()

  if (!game || game.status !== 'IN_PROGRESS') {
    return NextResponse.json({ error: 'Hra není aktivní' }, { status: 400 })
  }

  const players = (game.game_players as unknown as { user_id: string; rack: Tile[] }[])
  const currentPlayer = players[game.current_player_index]

  if (currentPlayer.user_id !== user.id) {
    return NextResponse.json({ error: 'Nejste na tahu' }, { status: 403 })
  }

  const nextPlayerIndex = (game.current_player_index + 1) % players.length

  await Promise.all([
    supabase.from('game_moves').insert({
      game_id: gameId,
      user_id: user.id,
      move_type: 'PASS',
      score: 0,
      rack_after: currentPlayer.rack as unknown as import('@/types/supabase').Json,
    }),
    supabase
      .from('games')
      .update({
        current_player_index: nextPlayerIndex,
        turn_number: game.turn_number + 1,
      })
      .eq('id', gameId),
  ])

  return NextResponse.json({ success: true })
}
