import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  toUserId: z.string().uuid(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Neplatná data' }, { status: 400 })

  const { toUserId } = parsed.data

  const { data: game } = await supabase
    .from('games')
    .select('id, status')
    .eq('id', gameId)
    .single()

  if (!game || game.status !== 'WAITING') {
    return NextResponse.json({ error: 'Hra není dostupná pro pozvánky' }, { status: 400 })
  }

  // Upsert pozvánky
  const { data: invite, error } = await supabase
    .from('game_invites')
    .upsert({
      game_id: gameId,
      from_user_id: user.id,
      to_user_id: toUserId,
      status: 'PENDING',
    }, { onConflict: 'game_id,to_user_id' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Chyba při odesílání pozvánky' }, { status: 500 })

  // Notifikace
  const { data: fromUser } = await supabase
    .from('users')
    .select('nickname')
    .eq('id', user.id)
    .single()

  await supabase.from('notifications').insert({
    user_id: toUserId,
    type: 'GAME_INVITE',
    title: 'Pozvánka do hry',
    body: `${fromUser?.nickname ?? 'Hráč'} vás zve do hry Scrabble`,
    related_id: gameId,
  })

  return NextResponse.json({ inviteId: invite.id })
}
