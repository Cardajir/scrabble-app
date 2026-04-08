import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validateExchange, drawTiles } from '@/lib/game/tiles'
import type { Tile } from '@/lib/game/tiles'

const schema = z.object({
  tileIds: z.array(z.string()).min(1).max(7),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Neplatná data' }, { status: 400 })

  const { tileIds } = parsed.data

  const { data: game } = await supabase
    .from('games')
    .select('*, game_players(*)')
    .eq('id', gameId)
    .single()

  if (!game || game.status !== 'IN_PROGRESS') {
    return NextResponse.json({ error: 'Hra není aktivní' }, { status: 400 })
  }

  const players = (game.game_players as unknown as { user_id: string; rack: Tile[]; turn_order: number }[])
  const currentPlayer = players[game.current_player_index]

  if (currentPlayer.user_id !== user.id) {
    return NextResponse.json({ error: 'Nejste na tahu' }, { status: 403 })
  }

  const rack = currentPlayer.rack as unknown as Tile[]
  const tileBag = game.tile_bag as unknown as Tile[]

  const validation = validateExchange(rack, tileIds, tileBag.length)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  // Odebrat vybraná písmena ze stojánku
  const exchangedTiles = rack.filter((t) => tileIds.includes(t.id))
  const remainingRack = rack.filter((t) => !tileIds.includes(t.id))

  // Vylosovat nová písmena z pytlíku
  const { drawn, remaining } = drawTiles(tileBag, tileIds.length)
  const newRack = [...remainingRack, ...drawn]

  // Vrátit vyměněná písmena do pytlíku (zamíchat)
  const newBag = [...remaining, ...exchangedTiles].sort(() => Math.random() - 0.5)

  const nextPlayerIndex = (game.current_player_index + 1) % players.length

  await Promise.all([
    supabase.from('game_moves').insert({
      game_id: gameId,
      user_id: user.id,
      move_type: 'EXCHANGE',
      tiles: JSON.stringify(exchangedTiles),
      score: 0,
      rack_after: JSON.stringify(newRack),
    }),
    supabase
      .from('game_players')
      .update({ rack: JSON.stringify(newRack) })
      .eq('game_id', gameId)
      .eq('user_id', user.id),
    supabase
      .from('games')
      .update({
        tile_bag: JSON.stringify(newBag),
        current_player_index: nextPlayerIndex,
        turn_number: game.turn_number + 1,
      })
      .eq('id', gameId),
  ])

  return NextResponse.json({ newRack })
}
