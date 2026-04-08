import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { inviteId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Neplatná data' }, { status: 400 })

  const { data: invite } = await supabase
    .from('game_invites')
    .select('*')
    .eq('id', inviteId)
    .eq('to_user_id', user.id)
    .single()

  if (!invite) return NextResponse.json({ error: 'Pozvánka nenalezena' }, { status: 404 })
  if (invite.status !== 'PENDING') return NextResponse.json({ error: 'Pozvánka již byla zpracována' }, { status: 400 })

  await supabase
    .from('game_invites')
    .update({ status: parsed.data.status })
    .eq('id', inviteId)

  if (parsed.data.status === 'ACCEPTED') {
    // Přidat hráče do hry
    const joinRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/games/${invite.game_id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const joinData = await joinRes.json()
    return NextResponse.json({ gameId: invite.game_id, ...joinData })
  }

  return NextResponse.json({ success: true })
}
