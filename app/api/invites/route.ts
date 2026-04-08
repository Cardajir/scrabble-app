import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const { data } = await supabase
    .from('game_invites')
    .select(`
      id, status, created_at, expires_at, game_id,
      from_user:users!game_invites_from_user_id_fkey(id, nickname, avatar_url),
      games(id, name, status)
    `)
    .eq('to_user_id', user.id)
    .eq('status', 'PENDING')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
