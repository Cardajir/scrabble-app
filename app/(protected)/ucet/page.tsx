import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountClient } from './AccountClient'

export default async function UcetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/prihlaseni')

  const [{ data: userData }, { data: stats }, { data: eloHistory }] = await Promise.all([
    supabase.from('users').select('*, profiles(*)').eq('id', user.id).single(),
    supabase.from('statistics').select('*').eq('user_id', user.id).single(),
    supabase.from('elo_history').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(20),
  ])

  // Pokud záznam v public.users neexistuje, použij data z auth
  const profile = userData ?? {
    id: user.id,
    email: user.email ?? '',
    nickname: (user.user_metadata?.nickname as string | undefined) ?? user.email?.split('@')[0] ?? 'Hráč',
    avatar_url: null as string | null,
    elo_rating: 1200,
    created_at: user.created_at,
    updated_at: user.created_at,
    profiles: null,
  }

  return (
    <AccountClient
      profile={profile}
      stats={stats}
      eloHistory={eloHistory ?? []}
    />
  )
}
