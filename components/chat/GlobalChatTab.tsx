'use client'

import { useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { toast } from 'sonner'

interface GlobalChatTabProps {
  userId: string
}

export function GlobalChatTab({ userId }: GlobalChatTabProps) {
  const { globalMessages, setGlobalMessages, addGlobalMessage } = useChatStore()
  const supabase = useMemo(() => createClient(), [])
  const bottomRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)

  // Load initial messages once
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    const loadMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*, users(nickname, avatar_url)')
        .is('game_id', null)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) {
        setGlobalMessages(data.reverse() as Parameters<typeof setGlobalMessages>[0])
      }
    }

    loadMessages()
  }, [supabase, setGlobalMessages])

  // Realtime subscription (separate effect, stable deps)
  useEffect(() => {
    const addMsg = useChatStore.getState().addGlobalMessage

    const channel = supabase
      .channel('global-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: 'game_id=is.null',
        },
        async (payload) => {
          const msg = payload.new
          const { data: userData } = await supabase
            .from('users')
            .select('nickname, avatar_url')
            .eq('id', msg.user_id)
            .single()

          useChatStore.getState().addGlobalMessage({
            ...msg,
            users: userData,
          } as Parameters<typeof addMsg>[0])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [globalMessages])

  const handleSend = async (content: string) => {
    const res = await fetch('/api/chat/global', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (!res.ok) {
      toast.error('Chyba při odesílání zprávy')
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {globalMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            content={msg.content}
            senderNickname={(msg as { users?: { nickname?: string } }).users?.nickname ?? 'Neznámý'}
            senderAvatar={(msg as { users?: { avatar_url?: string | null } }).users?.avatar_url}
            createdAt={msg.created_at}
            isOwn={msg.user_id === userId}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <MessageInput onSend={handleSend} />
    </>
  )
}
