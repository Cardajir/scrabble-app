import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GameBoardClient } from './GameBoardClient'

interface Props {
  params: Promise<{ gameId: string }>
}

export default async function HerniStulPage({ params }: Props) {
  const { gameId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/prihlaseni')

  const { data: userData } = await supabase
    .from('users')
    .select('id, nickname, elo_rating, avatar_url')
    .eq('id', user.id)
    .single()

  if (!userData) redirect('/prihlaseni')

  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single()

  if (!game) notFound()

  // Zkontrolovat, zda hráč je ve hře nebo se může připojit
  const { data: players } = await supabase
    .from('game_players')
    .select(`
      id, game_id, user_id, rack, score, is_active, has_left, turn_order, joined_at,
      users(id, nickname, elo_rating, avatar_url)
    `)
    .eq('game_id', gameId)
    .order('turn_order')

  const isPlayer = players?.some((p) => p.user_id === user.id)

  if (!isPlayer && game.status !== 'WAITING') {
    // Spectate – přesměrovat, ale zobrazit readonly stůl
    // Pro jednoduchost zobrazíme hru jako divák
  }

  const { data: moves } = await supabase
    .from('game_moves')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <GameBoardClient
      gameId={gameId}
      currentUser={userData}
      initialGame={game}
      initialPlayers={players ?? []}
      initialMoves={moves ?? []}
      isPlayer={!!isPlayer}
    />
  )
}
