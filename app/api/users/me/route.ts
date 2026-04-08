import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  nickname: z
    .string()
    .min(3, 'Přezdívka musí mít alespoň 3 znaky')
    .max(20, 'Přezdívka může mít nejvýše 20 znaků')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Jen písmena, čísla, _ a -')
    .optional(),
  avatar_url: z.string().url('Neplatná URL').nullable().optional(),
  bio: z.string().max(200).optional(),
  country: z.string().max(50).optional(),
})

export async function GET(_request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const { data } = await supabase
    .from('users')
    .select('*, profiles(*)')
    .eq('id', user.id)
    .single()

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { nickname, avatar_url, bio, country } = parsed.data

  if (nickname) {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname)
      .neq('id', user.id)
      .single()

    if (existing) return NextResponse.json({ error: 'Přezdívka je již obsazena' }, { status: 409 })
  }

  // Aktualizovat users tabulku
  if (nickname !== undefined || avatar_url !== undefined) {
    const updates: Record<string, unknown> = {}
    if (nickname !== undefined) updates.nickname = nickname
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    await supabase.from('users').update(updates).eq('id', user.id)
  }

  // Aktualizovat profiles tabulku
  if (bio !== undefined || country !== undefined) {
    await supabase.from('profiles').update({ bio, country }).eq('user_id', user.id)
  }

  return NextResponse.json({ success: true })
}
