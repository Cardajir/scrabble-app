import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const { data: game } = await supabase
    .from('games')
    .select('status')
    .eq('id', gameId)
    .single()

  if (!game) return NextResponse.json({ error: 'Hra nenalezena' }, { status: 404 })

  if (game.status === 'WAITING') {
    // Odebrat hráče ze hry
    await supabase
      .from('game_players')
      .delete()
      .eq('game_id', gameId)
      .eq('user_id', user.id)
  } else {
    // Označit jako odešel
    await supabase
      .from('game_players')
      .update({ has_left: true, is_active: false })
      .eq('game_id', gameId)
      .eq('user_id', user.id)
  }

  return NextResponse.json({ success: true })
}
