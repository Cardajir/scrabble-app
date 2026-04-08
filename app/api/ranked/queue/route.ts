import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateSearchRange } from '@/lib/game/matchmaking'

// POST /api/ranked/queue – vstup do fronty
export async function POST(_request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const { data: userData } = await supabase
    .from('users')
    .select('elo_rating')
    .eq('id', user.id)
    .single()

  if (!userData) return NextResponse.json({ error: 'Uživatel nenalezen' }, { status: 404 })

  const { min, max } = calculateSearchRange(userData.elo_rating, new Date())

  const { error } = await supabase.from('ranked_queue').upsert({
    user_id: user.id,
    elo_rating: userData.elo_rating,
    status: 'WAITING',
    search_range_min: min,
    search_range_max: max,
  }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: 'Chyba při vstupu do fronty' }, { status: 500 })

  // Zkusit párování
  await tryMatchmaking(supabase, user.id, userData.elo_rating, min, max)

  return NextResponse.json({ success: true })
}

// DELETE /api/ranked/queue – odchod z fronty
export async function DELETE(_request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  await supabase
    .from('ranked_queue')
    .update({ status: 'CANCELLED' })
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}

async function tryMatchmaking(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  userId: string,
  elo: number,
  min: number,
  max: number
) {
  // Najít čekajícího hráče ve vhodném ELO rozsahu
  const { data: candidates } = await supabase
    .from('ranked_queue')
    .select('*')
    .eq('status', 'WAITING')
    .neq('user_id', userId)
    .lte('search_range_min', elo)
    .gte('search_range_max', elo)
    .order('joined_at')
    .limit(1)

  if (!candidates || candidates.length === 0) return

  const opponent = candidates[0]

  // Ověřit oboustranný rozsah
  if (elo < opponent.search_range_min || elo > opponent.search_range_max) return
  if (opponent.elo_rating < min || opponent.elo_rating > max) return

  // Spárovat oba hráče
  await supabase
    .from('ranked_queue')
    .update({ status: 'MATCHED', matched_at: new Date().toISOString() })
    .in('user_id', [userId, opponent.user_id])

  // Vytvořit ranked hru
  const { createTileBag } = await import('@/lib/game/tiles')
  const bag = createTileBag()
  const rack1 = bag.splice(0, 7)
  const rack2 = bag.splice(0, 7)

  const { data: game } = await supabase
    .from('games')
    .insert({
      type: 'RANKED',
      status: 'IN_PROGRESS',
      name: 'Ranked hra',
      tile_bag: JSON.stringify(bag),
      created_by_id: userId,
    })
    .select('id')
    .single()

  if (!game) return

  await supabase.from('game_players').insert([
    { game_id: game.id, user_id: userId, turn_order: 0, rack: JSON.stringify(rack1) },
    { game_id: game.id, user_id: opponent.user_id, turn_order: 1, rack: JSON.stringify(rack2) },
  ])

  // Notifikace
  await supabase.from('notifications').insert([
    {
      user_id: userId,
      type: 'GAME_START',
      title: 'Ranked hra nalezena!',
      body: 'Soupeř byl nalezen. Hra začíná!',
      related_id: game.id,
    },
    {
      user_id: opponent.user_id,
      type: 'GAME_START',
      title: 'Ranked hra nalezena!',
      body: 'Soupeř byl nalezen. Hra začíná!',
      related_id: game.id,
    },
  ])
}
