'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'
import { DMThreadView } from './DMThreadView'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface DMListTabProps {
  userId: string
}

export function DMListTab({ userId }: DMListTabProps) {
  const { dmThreads, setDMThreads, activeThreadId, setActiveThread } = useChatStore()
  const supabase = createClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; nickname: string }[]>([])

  useEffect(() => {
    const loadThreads = async () => {
      const { data } = await supabase
        .from('direct_message_threads')
        .select(`
          id, participant1_id, participant2_id, last_message_at,
          p1:users!direct_message_threads_participant1_id_fkey(id, nickname, avatar_url),
          p2:users!direct_message_threads_participant2_id_fkey(id, nickname, avatar_url)
        `)
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })

      if (data) {
        const threads = data.map((t) => {
          const otherUser =
            t.participant1_id === userId
              ? (t.p2 as unknown as { id: string; nickname: string; avatar_url: string | null } | null)
              : (t.p1 as unknown as { id: string; nickname: string; avatar_url: string | null } | null)
          return {
            id: t.id,
            participant1_id: t.participant1_id,
            participant2_id: t.participant2_id,
            last_message_at: t.last_message_at,
            other_user: otherUser ?? undefined,
          }
        })
        setDMThreads(threads)
      }
    }
    loadThreads()
  }, [userId, supabase, setDMThreads])

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) {
      setSearchResults([])
      return
    }

    const { data } = await supabase
      .from('users')
      .select('id, nickname')
      .ilike('nickname', `%${q}%`)
      .neq('id', userId)
      .limit(5)

    setSearchResults(data ?? [])
  }

  const handleStartDM = async (targetUserId: string) => {
    const res = await fetch('/api/chat/dm/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    })

    if (!res.ok) {
      toast.error('Chyba při zahájení konverzace')
      return
    }

    const { threadId } = await res.json()
    setSearchQuery('')
    setSearchResults([])
    setActiveThread(threadId)
  }

  if (activeThreadId) {
    const thread = dmThreads.find((t) => t.id === activeThreadId)
    return (
      <DMThreadView
        threadId={activeThreadId}
        userId={userId}
        otherUser={thread?.other_user}
        onBack={() => setActiveThread(null)}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Input
          placeholder="Hledat uživatele..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="text-sm"
        />
        {searchResults.length > 0 && (
          <div className="mt-2 border rounded-lg divide-y bg-background shadow-sm">
            {searchResults.map((user) => (
              <button
                key={user.id}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted text-left"
                onClick={() => handleStartDM(user.id)}
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">
                    {user.nickname.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.nickname}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y">
        {dmThreads.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Žádné konverzace. Vyhledejte uživatele výše.
          </div>
        ) : (
          dmThreads.map((thread) => (
            <button
              key={thread.id}
              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-muted text-left"
              onClick={() => setActiveThread(thread.id)}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={thread.other_user?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {thread.other_user?.nickname?.slice(0, 2).toUpperCase() ?? '??'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{thread.other_user?.nickname ?? 'Neznámý'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {new Date(thread.last_message_at).toLocaleDateString('cs-CZ')}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
