import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createGameSchema } from '@/lib/validations/game'
import { createTileBag } from '@/lib/game/tiles'
import bcrypt from 'bcryptjs'

// GET /api/games – seznam custom her
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const type = (searchParams.get('type') ?? 'CUSTOM') as 'CUSTOM' | 'RANKED'

  const { data, error } = await supabase
    .from('games')
    .select(`
      id, name, status, max_players, is_private, type, created_at,
      game_players(count),
      users!games_created_by_id_fkey(nickname)
    `)
    .eq('type', type)
    .in('status', ['WAITING', 'IN_PROGRESS'])
    .eq('is_private', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: 'Chyba při načítání her' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/games – vytvoření nové hry
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createGameSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, type, isPrivate, password, maxPlayers, turnTimeLimit } = parsed.data

  // Zajistit, že uživatel existuje v public.users (FK constraint)
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existingUser) {
    // Uživatel nemá záznam – vytvoříme ho
    const nickname = (user.user_metadata?.nickname as string | undefined)
      ?? user.email?.split('@')[0]
      ?? 'Hráč'

    const { error: upsertError } = await supabase.from('users').insert({
      id: user.id,
      email: user.email!,
      nickname,
      elo_rating: 1200,
    })

    if (upsertError) {
      return NextResponse.json(
        { error: 'Váš profil není dokončen. Spusťte setup databáze.' },
        { status: 400 }
      )
    }

    // Vytvořit i profil a statistiky
    await supabase.from('profiles').insert({ user_id: user.id, preferred_language: 'cs' })
    await supabase.from('statistics').insert({ user_id: user.id })
  }

  let passwordHash: string | null = null
  if (isPrivate && password) {
    passwordHash = await bcrypt.hash(password, 10)
  }

  const tileBag = createTileBag()
  const initialRack = tileBag.splice(0, 7)

  // Vložit hru — jsonb sloupce přijímají přímo JS objekty (bez JSON.stringify)
  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert({
      name,
      type,
      is_private: isPrivate,
      password_hash: passwordHash,
      max_players: maxPlayers,
      turn_time_limit: turnTimeLimit ?? null,
      tile_bag: tileBag as unknown as import('@/types/supabase').Json,
      created_by_id: user.id,
    })
    .select('id')
    .single()

  if (gameError || !game) {
    console.error('Game insert error:', gameError)
    return NextResponse.json(
      { error: `Chyba při vytváření hry: ${gameError?.message ?? 'neznámá chyba'}` },
      { status: 500 }
    )
  }

  // Přidat tvůrce jako prvního hráče
  const { error: playerError } = await supabase.from('game_players').insert({
    game_id: game.id,
    user_id: user.id,
    turn_order: 0,
    rack: initialRack as unknown as import('@/types/supabase').Json,
  })

  if (playerError) {
    console.error('Player insert error:', playerError)
    return NextResponse.json(
      { error: `Chyba při přidání hráče: ${playerError.message}` },
      { status: 500 }
    )
  }

  // Aktualizovat pytel kamenů po odebrání 7 pro hráče
  const { error: bagError } = await supabase
    .from('games')
    .update({ tile_bag: tileBag as unknown as import('@/types/supabase').Json })
    .eq('id', game.id)

  if (bagError) {
    console.error('Bag update error:', bagError)
    // Nekritická chyba – hra existuje, jen bag není aktuální
  }

  return NextResponse.json({ gameId: game.id }, { status: 201 })
}
