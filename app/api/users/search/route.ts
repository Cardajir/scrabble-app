import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''

  if (q.length < 2) return NextResponse.json([])

  const { data } = await supabase
    .from('users')
    .select('id, nickname, elo_rating, avatar_url')
    .ilike('nickname', `%${q}%`)
    .neq('id', user.id)
    .limit(10)

  return NextResponse.json(data ?? [])
}
