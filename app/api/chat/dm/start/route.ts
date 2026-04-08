import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  targetUserId: z.string().uuid(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Neplatná data' }, { status: 400 })

  const { targetUserId } = parsed.data

  if (targetUserId === user.id) {
    return NextResponse.json({ error: 'Nelze si psát sám sobě' }, { status: 400 })
  }

  // Hledat existující vlákno (pořadí účastníků může být v obou směrech)
  const { data: existing } = await supabase
    .from('direct_message_threads')
    .select('id')
    .or(
      `and(participant1_id.eq.${user.id},participant2_id.eq.${targetUserId}),` +
      `and(participant1_id.eq.${targetUserId},participant2_id.eq.${user.id})`
    )
    .single()

  if (existing) {
    return NextResponse.json({ threadId: existing.id })
  }

  // Vytvořit nové vlákno
  const { data: thread, error } = await supabase
    .from('direct_message_threads')
    .insert({
      participant1_id: user.id,
      participant2_id: targetUserId,
    })
    .select('id')
    .single()

  if (error || !thread) {
    return NextResponse.json({ error: 'Chyba při vytváření konverzace' }, { status: 500 })
  }

  return NextResponse.json({ threadId: thread.id })
}
