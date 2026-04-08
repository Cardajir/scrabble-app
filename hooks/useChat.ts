'use client'

import { useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/store/chatStore'

export function useGlobalChat(userId: string) {
  const supabase = useMemo(() => createClient(), [])

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

          const store = useChatStore.getState()
          store.addGlobalMessage({ ...msg, users: userData } as Parameters<typeof store.addGlobalMessage>[0])

          if (!store.isOpen || store.activeTab !== 'global') {
            if (msg.user_id !== userId) store.incrementUnread()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])
}

export function useDMNotifications(userId: string) {
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const channel = supabase
      .channel(`dm-notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        async (payload) => {
          const msg = payload.new
          if (msg.sender_id === userId) return

          const { data: thread } = await supabase
            .from('direct_message_threads')
            .select('id')
            .eq('id', msg.thread_id)
            .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
            .single()

          const store = useChatStore.getState()
          if (thread && (!store.isOpen || store.activeTab !== 'dm')) {
            store.incrementUnread()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])
}
