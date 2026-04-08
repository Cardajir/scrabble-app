import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CustomLobbyClient } from './CustomLobbyClient'

export default async function CustomHryPage() {
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

  const { data: games } = await supabase
    .from('games')
    .select(`
      id, name, status, max_players, is_private, created_at,
      game_players(count),
      users!games_created_by_id_fkey(nickname)
    `)
    .eq('type', 'CUSTOM')
    .eq('status', 'WAITING')
    .eq('is_private', false)
    .order('created_at', { ascending: false })
    .limit(20)

  return <CustomLobbyClient user={userData} initialGames={games ?? []} />
}
