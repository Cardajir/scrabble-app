import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  nickname: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_\-]+$/),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Neplatná data' }, { status: 400 })
    }

    const { userId, email, nickname } = parsed.data
    const supabase = await createClient()

    // Ověřit, že přihlášený uživatel odpovídá userId
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
    }

    // Zkontrolovat unikátnost nicku
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Tato přezdívka je již obsazena' },
        { status: 409 }
      )
    }

    // Vytvořit záznam v users
    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      email,
      nickname,
    })

    if (userError) {
      return NextResponse.json(
        { error: 'Chyba při vytváření uživatele' },
        { status: 500 }
      )
    }

    // Vytvořit profil
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: userId,
      preferred_language: 'cs',
    })

    if (profileError) {
      console.error('Profile creation error:', profileError)
    }

    // Vytvořit statistiky
    const { error: statsError } = await supabase.from('statistics').insert({
      user_id: userId,
    })

    if (statsError) {
      console.error('Statistics creation error:', statsError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 })
  }
}
