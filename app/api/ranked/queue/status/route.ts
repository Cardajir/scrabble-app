import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })

  const { data } = await supabase
    .from('ranked_queue')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(data ?? { status: 'NOT_IN_QUEUE' })
}
