import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RankedLobbyClient } from './RankedLobbyClient'

export default async function RankedHryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/prihlaseni')

  const { data: userData } = await supabase
    .from('users')
    .select('id, nickname, elo_rating')
    .eq('id', user.id)
    .single()

  if (!userData) redirect('/prihlaseni')

  // Zkontrolovat, zda je hráč ve frontě
  const { data: queueEntry } = await supabase
    .from('ranked_queue')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'WAITING')
    .single()

  // Nedávné ranked hry hráče
  const { data: recentGames } = await supabase
    .from('games')
    .select(`
      id, status, created_at, winner_id,
      game_players!inner(user_id, score, turn_order)
    `)
    .eq('type', 'RANKED')
    .eq('game_players.user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <RankedLobbyClient
      user={userData}
      initialQueueEntry={queueEntry}
      recentGames={recentGames ?? []}
    />
  )
}
