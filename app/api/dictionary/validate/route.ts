import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validatePlaceMove } from '@/lib/game/validation'
import { validateWords } from '@/lib/game/dictionary'
import type { PlacedTile } from '@/lib/game/board'

const schema = z.object({
  // Validace konkrétního slova
  word: z.string().optional(),
  // Validace tahu (pending tiles + board state)
  pendingTiles: z.array(z.object({
    row: z.number().int().min(0).max(14),
    col: z.number().int().min(0).max(14),
    tile: z.object({
      id: z.string(),
      letter: z.string(),
      value: z.number(),
      isBlank: z.boolean(),
      blankLetter: z.string().optional(),
    }),
  })).optional(),
  boardState: z.record(z.string(), z.any()).optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Neplatná data' }, { status: 400 })

  const { word, pendingTiles, boardState } = parsed.data

  // Validace jednoho slova
  if (word) {
    const { data } = await supabase
      .from('dictionary_words')
      .select('id')
      .eq('word', word.toUpperCase())
      .eq('is_valid', true)
      .single()

    return NextResponse.json({ valid: !!data, word })
  }

  // Validace tahu
  if (pendingTiles && boardState) {
    const validation = validatePlaceMove(
      boardState as Record<string, PlacedTile>,
      pendingTiles,
      0 // turn_number pro preview
    )

    if (!validation.valid) {
      return NextResponse.json({ valid: false, error: validation.error })
    }

    // Ověřit slova ve slovníku
    const wordMap = await validateWords(validation.words)
    const invalidWords = validation.words.filter((w) => !wordMap.get(w))

    if (invalidWords.length > 0) {
      return NextResponse.json({
        valid: false,
        error: `Neplatná slova: ${invalidWords.join(', ')}`,
        words: validation.words,
        invalidWords,
      })
    }

    return NextResponse.json({
      valid: true,
      words: validation.words,
      score: validation.score,
    })
  }

  return NextResponse.json({ error: 'Chybí parametry' }, { status: 400 })
}
