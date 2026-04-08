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

  if (!game || game.status === 'FINISHED') {
    return NextResponse.json({ error: 'Hra již skončila' }, { status: 400 })
  }

  const players = (game.game_players as unknown as { user_id: string; rack: Tile[]; score: number }[])
  const myPlayer = players.find((p) => p.user_id === user.id)

  if (!myPlayer) return NextResponse.json({ error: 'Nejste ve hře' }, { status: 403 })

  // Ostatní hráči vyhrávají – vybrat hráče s nejvyšším skóre
  const otherPlayers = players.filter((p) => p.user_id !== user.id)
  const winnerId =
    otherPlayers.length > 0
      ? otherPlayers.reduce((a, b) => (a.score > b.score ? a : b)).user_id
      : null

  await Promise.all([
    supabase.from('game_moves').insert({
      game_id: gameId,
      user_id: user.id,
      move_type: 'RESIGN',
      score: 0,
      rack_after: JSON.stringify(myPlayer.rack),
    }),
    supabase
      .from('game_players')
      .update({ has_left: true, is_active: false })
      .eq('game_id', gameId)
      .eq('user_id', user.id),
    supabase
      .from('games')
      .update({ status: 'FINISHED', winner_id: winnerId })
      .eq('id', gameId),
  ])

  return NextResponse.json({ success: true })
}
