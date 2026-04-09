import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { ChatBubble } from '@/components/layout/ChatBubble'
import { Toaster } from '@/components/ui/sonner'
import { createClient } from '@/lib/supabase/server'
import { Providers } from './providers'

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Ceska Scrabble - Online hra',
  description: 'Online multiplayer Scrabble pro cesky mluvici hrace.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userData = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('id, nickname, elo_rating, avatar_url')
      .eq('id', user.id)
      .single()

    if (data) {
      userData = data
    } else {
      userData = {
        id: user.id,
        nickname: (user.user_metadata?.nickname as string | undefined)
          ?? user.email?.split('@')[0]
          ?? 'Hrac',
        elo_rating: 1200,
        avatar_url: null as string | null,
      }
    }
  }

  return (
    <html lang="cs" className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Providers>
          <Header user={userData} />
          <main className="flex-1">{children}</main>
          {userData && <ChatBubble userId={userData.id} />}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
