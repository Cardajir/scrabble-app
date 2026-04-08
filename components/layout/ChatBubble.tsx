'use client'

import { useChatStore } from '@/store/chatStore'
import { ChatWindow } from './ChatWindow'
import { cn } from '@/lib/utils'

interface ChatBubbleProps {
  userId: string
  gameId?: string
}

export function ChatBubble({ userId, gameId }: ChatBubbleProps) {
  const { isOpen, setOpen, unreadCount } = useChatStore()

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2">
          <ChatWindow userId={userId} gameId={gameId} onClose={() => setOpen(false)} />
        </div>
      )}
      <button
        onClick={() => setOpen(!isOpen)}
        className={cn(
          'relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          'neon-purple',
          isOpen && 'rotate-12'
        )}
        aria-label="Otevřít chat"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}
