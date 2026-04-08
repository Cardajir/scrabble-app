import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const { data } = await supabase
    .from('direct_message_threads')
    .select(`
      id, participant1_id, participant2_id, last_message_at,
      p1:users!direct_message_threads_participant1_id_fkey(id, nickname, avatar_url),
      p2:users!direct_message_threads_participant2_id_fkey(id, nickname, avatar_url)
    `)
    .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
