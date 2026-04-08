import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { chatMessageSchema } from '@/lib/validations/game'

const lastMessageAt = new Map<string, number>()
const RATE_LIMIT_MS = 2000

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const { data } = await supabase
    .from('chat_messages')
    .select('*, users(nickname, avatar_url)')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json((data ?? []).reverse())
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  // Ověřit, že je hráč ve hře
  const { data: player } = await supabase
    .from('game_players')
    .select('id')
    .eq('game_id', gameId)
    .eq('user_id', user.id)
    .single()

  if (!player) return NextResponse.json({ error: 'Nejste ve hře' }, { status: 403 })

  // Rate limiting
  const key = `${user.id}:${gameId}`
  const now = Date.now()
  const last = lastMessageAt.get(key) ?? 0
  if (now - last < RATE_LIMIT_MS) {
    return NextResponse.json({ error: 'Příliš mnoho zpráv' }, { status: 429 })
  }
  lastMessageAt.set(key, now)

  const body = await request.json()
  const parsed = chatMessageSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Neplatná zpráva' }, { status: 400 })

  await supabase.from('chat_messages').insert({
    user_id: user.id,
    content: parsed.data.content.trim(),
    game_id: gameId,
  })

  return NextResponse.json({ success: true })
}
