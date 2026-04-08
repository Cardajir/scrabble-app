import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { chatMessageSchema } from '@/lib/validations/game'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  // Ověřit přístup
  const { data: thread } = await supabase
    .from('direct_message_threads')
    .select('id')
    .eq('id', threadId)
    .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
    .single()

  if (!thread) return NextResponse.json({ error: 'Vlákno nenalezeno' }, { status: 404 })

  const { data } = await supabase
    .from('direct_messages')
    .select('*, sender:users!direct_messages_sender_id_fkey(nickname, avatar_url)')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(50)

  // Označit jako přečtené
  await supabase
    .from('direct_messages')
    .update({ is_read: true })
    .eq('thread_id', threadId)
    .neq('sender_id', user.id)
    .eq('is_read', false)

  return NextResponse.json((data ?? []).reverse())
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const { data: thread } = await supabase
    .from('direct_message_threads')
    .select('id, participant1_id, participant2_id')
    .eq('id', threadId)
    .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
    .single()

  if (!thread) return NextResponse.json({ error: 'Vlákno nenalezeno' }, { status: 404 })

  const body = await request.json()
  const parsed = chatMessageSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Neplatná zpráva' }, { status: 400 })

  await supabase.from('direct_messages').insert({
    thread_id: threadId,
    sender_id: user.id,
    content: parsed.data.content.trim(),
  })

  await supabase
    .from('direct_message_threads')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', threadId)

  // Notifikace příjemci
  const recipientId =
    thread.participant1_id === user.id ? thread.participant2_id : thread.participant1_id
  const { data: sender } = await supabase
    .from('users')
    .select('nickname')
    .eq('id', user.id)
    .single()

  await supabase.from('notifications').insert({
    user_id: recipientId,
    type: 'DM',
    title: 'Nová zpráva',
    body: `${sender?.nickname ?? 'Hráč'}: ${parsed.data.content.slice(0, 50)}`,
    related_id: threadId,
  })

  return NextResponse.json({ success: true })
}
