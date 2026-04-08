'use client'

import { useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore, type ChatMessage } from '@/store/chatStore'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { toast } from 'sonner'

interface GameChatTabProps {
  gameId: string
  userId: string
}

export function GameChatTab({ gameId, userId }: GameChatTabProps) {
  const { gameMessages } = useChatStore()
  const supabase = useMemo(() => createClient(), [])
  const bottomRef = useRef<HTMLDivElement>(null)
  const messages = gameMessages[gameId] ?? []
  const loadedRef = useRef(false)

  // Load initial messages once
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    const load = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*, users(nickname, avatar_url)')
        .eq('game_id', gameId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) {
        useChatStore.getState().setGameMessages(gameId, data.reverse() as ChatMessage[])
      }
    }
    load()
  }, [gameId, supabase])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`game-chat:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `game_id=eq.${gameId}`,
        },
        async (payload) => {
          const msg = payload.new
          const { data: userData } = await supabase
            .from('users')
            .select('nickname, avatar_url')
            .eq('id', msg.user_id)
            .single()

          useChatStore.getState().addGameMessage(gameId, { ...msg, users: userData } as ChatMessage)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (content: string) => {
    const res = await fetch(`/api/chat/game/${gameId}`, {
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
        {messages.map((msg) => (
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
      <MessageInput onSend={handleSend} placeholder="Napište zprávu hráčům..." />
    </>
  )
}
