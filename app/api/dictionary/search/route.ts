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
    .from('dictionary_words')
    .select('word, length')
    .ilike('word', `${q.toUpperCase()}%`)
    .eq('is_valid', true)
    .order('length')
    .limit(20)

  return NextResponse.json(data ?? [])
}
