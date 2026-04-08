import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

  const { data } = await supabase
    .from('games')
    .select(`
      id, type, status, created_at, winner_id,
      game_players!inner(user_id, score, turn_order, users(id, nickname))
    `)
    .eq('game_players.user_id', user.id)
    .in('status', ['FINISHED', 'ABANDONED'])
    .order('created_at', { ascending: false })
    .limit(limit)

  return NextResponse.json(data ?? [])
}
