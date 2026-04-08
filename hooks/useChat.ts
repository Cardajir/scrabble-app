'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'

export function useGlobalChat(userId: string) {
  const { addGlobalMessage, incrementUnread, isOpen, activeTab } = useChatStore()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('global-chat-hook')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: 'game_id=is.null' },
        async (payload) => {
          const msg = payload.new
          const { data: userData } = await supabase
            .from('users')
            .select('nickname, avatar_url')
            .eq('id', msg.user_id)
            .single()

          addGlobalMessage({ ...msg, users: userData } as Parameters<typeof addGlobalMessage>[0])

          // Inkrementovat unread pokud chat není otevřen na globální záložce
          if (!isOpen || activeTab !== 'global') {
            if (msg.user_id !== userId) incrementUnread()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, addGlobalMessage, incrementUnread, isOpen, activeTab])
}

export function useDMNotifications(userId: string) {
  const { incrementUnread, isOpen, activeTab } = useChatStore()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`dm-notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        async (payload) => {
          const msg = payload.new
          if (msg.sender_id === userId) return

          // Ověřit, že je zpráva v vlákně, jehož je user účastníkem
          const { data: thread } = await supabase
            .from('direct_message_threads')
            .select('id')
            .eq('id', msg.thread_id)
            .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
            .single()

          if (thread && (!isOpen || activeTab !== 'dm')) {
            incrementUnread()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, incrementUnread, isOpen, activeTab])
}
