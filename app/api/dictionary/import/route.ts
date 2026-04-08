import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/dictionary/import – pouze admin (service role)
export async function POST(request: Request) {
  // Ověření admin přístupu přes service role key
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
  }

  const body = await request.json()
  const words: string[] = body.words ?? []

  if (!Array.isArray(words) || words.length === 0) {
    return NextResponse.json({ error: 'Chybí seznam slov' }, { status: 400 })
  }

  const supabase = await createClient()
  const BATCH_SIZE = 500
  let imported = 0

  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE).map((w) => ({
      word: w.toUpperCase().trim(),
      is_valid: true,
    }))

    const { error } = await supabase
      .from('dictionary_words')
      .upsert(batch, { onConflict: 'word', ignoreDuplicates: true })

    if (error) {
      console.error('Import error:', error)
      return NextResponse.json({ error: 'Chyba při importu', imported }, { status: 500 })
    }

    imported += batch.length
  }

  return NextResponse.json({ success: true, imported })
}
