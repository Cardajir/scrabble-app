import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ nickname: string }> }
) {
  const { nickname } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('users')
    .select(`
      id, nickname, elo_rating, avatar_url, created_at,
      profiles(bio, country),
      statistics(games_played, games_won, games_lost, average_score, longest_word, best_win_streak)
    `)
    .eq('nickname', nickname)
    .single()

  if (!data) return NextResponse.json({ error: 'Uživatel nenalezen' }, { status: 404 })

  return NextResponse.json(data)
}
