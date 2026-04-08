'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OnlineUser {
  userId: string
  nickname: string
}

export function usePresence(userId: string, nickname: string) {
  const supabase = createClient()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])

  useEffect(() => {
    const channel = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<OnlineUser>()
        const users = (Object.values(state).flat() as unknown as OnlineUser[])
        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const joined = newPresences as unknown as OnlineUser[]
        setOnlineUsers((prev) => [
          ...prev.filter((u) => !joined.some((p) => p.userId === u.userId)),
          ...joined,
        ])
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const left = leftPresences as unknown as OnlineUser[]
        setOnlineUsers((prev) =>
          prev.filter((u) => !left.some((p) => p.userId === u.userId))
        )
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId, nickname })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, nickname, supabase])

  return { onlineUsers, onlineCount: onlineUsers.length }
}
