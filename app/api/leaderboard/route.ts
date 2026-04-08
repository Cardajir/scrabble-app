import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)

  const { data } = await supabase
    .from('users')
    .select(`
      id, nickname, elo_rating, avatar_url, created_at,
      statistics(games_played, games_won, average_score)
    `)
    .order('elo_rating', { ascending: false })
    .limit(limit)

  return NextResponse.json(data ?? [])
}
