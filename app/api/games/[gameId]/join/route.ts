import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  const { data: game } = await supabase
    .from('games')
    .select('*, game_players(count)')
    .eq('id', gameId)
    .single()

  if (!game) return NextResponse.json({ error: 'Hra nenalezena' }, { status: 404 })
  if (game.status !== 'WAITING') return NextResponse.json({ error: 'Hra již probíhá nebo skončila' }, { status: 400 })

  const playerCount = (game.game_players as unknown as { count: number }[])[0]?.count ?? 0
  if (playerCount >= game.max_players) return NextResponse.json({ error: 'Hra je plná' }, { status: 400 })

  // Zkontrolovat, zda hráč již není ve hře
  const { data: existing } = await supabase
    .from('game_players')
    .select('id')
    .eq('game_id', gameId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Hráč je již ve hře, vrátit success
    return NextResponse.json({ gameId })
  }

  // Ověřit heslo soukromé hry
  if (game.is_private && game.password_hash) {
    const password = body.password ?? ''
    const valid = await bcrypt.compare(password, game.password_hash)
    if (!valid) return NextResponse.json({ error: 'Nesprávné heslo' }, { status: 403 })
  }

  // Přidělit hráči kameny
  const tileBag = game.tile_bag as { id: string; letter: string; value: number; isBlank: boolean }[]
  const rack = tileBag.splice(0, 7)

  const { error: playerError } = await supabase.from('game_players').insert({
    game_id: gameId,
    user_id: user.id,
    turn_order: playerCount,
    rack: rack as unknown as import('@/types/supabase').Json,
  })

  if (playerError) {
    console.error('Join error:', playerError)
    return NextResponse.json({ error: `Chyba při připojování: ${playerError.message}` }, { status: 500 })
  }

  // Aktualizovat pytel
  const updates: Record<string, unknown> = { tile_bag: tileBag }

  // Pokud je hra plná, spustit ji
  if (playerCount + 1 >= game.max_players) {
    updates.status = 'IN_PROGRESS'
  }

  await supabase.from('games').update(updates).eq('id', gameId)

  return NextResponse.json({ gameId })
}
