import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { chatMessageSchema } from '@/lib/validations/game'

// Jednoduché in-memory rate limiting (reset při restartu serveru)
const lastMessageAt = new Map<string, number>()
const RATE_LIMIT_MS = 2000

export async function GET(_request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const { data } = await supabase
    .from('chat_messages')
    .select('*, users(nickname, avatar_url)')
    .is('game_id', null)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json((data ?? []).reverse())
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  // Rate limiting
  const now = Date.now()
  const last = lastMessageAt.get(user.id) ?? 0
  if (now - last < RATE_LIMIT_MS) {
    return NextResponse.json({ error: 'Příliš mnoho zpráv. Počkejte chvíli.' }, { status: 429 })
  }
  lastMessageAt.set(user.id, now)

  const body = await request.json()
  const parsed = chatMessageSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Neplatná zpráva' }, { status: 400 })

  const { error } = await supabase.from('chat_messages').insert({
    user_id: user.id,
    content: parsed.data.content.trim(),
    game_id: null,
  })

  if (error) return NextResponse.json({ error: 'Chyba při odesílání' }, { status: 500 })

  return NextResponse.json({ success: true })
}
