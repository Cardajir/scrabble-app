'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface DMThreadViewProps {
  threadId: string
  userId: string
  otherUser?: { id: string; nickname: string; avatar_url: string | null } | null
  onBack: () => void
}

export function DMThreadView({ threadId, userId, otherUser, onBack }: DMThreadViewProps) {
  const { dmMessages, setDMMessages, addDMMessage } = useChatStore()
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const messages = dmMessages[threadId] ?? []
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    const load = async () => {
      const { data } = await supabase
        .from('direct_messages')
        .select('*, sender:users!direct_messages_sender_id_fkey(nickname, avatar_url)')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) {
        setDMMessages(threadId, data.reverse().map((m) => ({
          id: m.id,
          user_id: m.sender_id,
          content: m.content,
          created_at: m.created_at,
          users: m.sender as unknown as { nickname: string; avatar_url: string | null } | null,
        })))
      }

      // Označit jako přečtené
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('thread_id', threadId)
        .neq('sender_id', userId)
        .eq('is_read', false)
    }
    load()

    const channel = supabase
      .channel(`dm:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          const msg = payload.new
          const { data: userData } = await supabase
            .from('users')
            .select('nickname, avatar_url')
            .eq('id', msg.sender_id)
            .single()

          addDMMessage(threadId, {
            id: msg.id,
            user_id: msg.sender_id,
            content: msg.content,
            created_at: msg.created_at,
            users: userData,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [threadId, userId, supabase, setDMMessages, addDMMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (content: string) => {
    const res = await fetch(`/api/chat/dm/threads/${threadId}/messages`, {
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
      <div className="flex items-center gap-2 px-3 py-2 border-b">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-1">
          ← Zpět
        </Button>
        <span className="text-sm font-medium">{otherUser?.nickname ?? 'Konverzace'}</span>
      </div>
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
      <MessageInput onSend={handleSend} placeholder="Napište zprávu..." />
    </>
  )
}
