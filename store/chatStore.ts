import { create } from 'zustand'

export interface ChatMessage {
  id: string
  user_id: string
  content: string
  created_at: string
  game_id?: string | null
  users?: { nickname: string; avatar_url: string | null } | null
}

export interface DMThread {
  id: string
  participant1_id: string
  participant2_id: string
  last_message_at: string
  other_user?: { id: string; nickname: string; avatar_url: string | null }
}

interface ChatState {
  isOpen: boolean
  activeTab: 'global' | 'dm' | 'game'
  globalMessages: ChatMessage[]
  gameMessages: Record<string, ChatMessage[]>
  dmThreads: DMThread[]
  activeThreadId: string | null
  dmMessages: Record<string, ChatMessage[]>
  unreadCount: number

  setOpen: (open: boolean) => void
  setActiveTab: (tab: 'global' | 'dm' | 'game') => void
  addGlobalMessage: (msg: ChatMessage) => void
  setGlobalMessages: (msgs: ChatMessage[]) => void
  addGameMessage: (gameId: string, msg: ChatMessage) => void
  setGameMessages: (gameId: string, msgs: ChatMessage[]) => void
  setDMThreads: (threads: DMThread[]) => void
  setActiveThread: (threadId: string | null) => void
  addDMMessage: (threadId: string, msg: ChatMessage) => void
  setDMMessages: (threadId: string, msgs: ChatMessage[]) => void
  incrementUnread: () => void
  resetUnread: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  activeTab: 'global',
  globalMessages: [],
  gameMessages: {},
  dmThreads: [],
  activeThreadId: null,
  dmMessages: {},
  unreadCount: 0,

  setOpen: (isOpen) => set({ isOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),

  addGlobalMessage: (msg) =>
    set((state) => ({
      globalMessages: [...state.globalMessages.slice(-49), msg],
    })),

  setGlobalMessages: (msgs) => set({ globalMessages: msgs }),

  addGameMessage: (gameId, msg) =>
    set((state) => ({
      gameMessages: {
        ...state.gameMessages,
        [gameId]: [...(state.gameMessages[gameId] ?? []).slice(-49), msg],
      },
    })),

  setGameMessages: (gameId, msgs) =>
    set((state) => ({
      gameMessages: { ...state.gameMessages, [gameId]: msgs },
    })),

  setDMThreads: (dmThreads) => set({ dmThreads }),

  setActiveThread: (activeThreadId) => set({ activeThreadId }),

  addDMMessage: (threadId, msg) =>
    set((state) => ({
      dmMessages: {
        ...state.dmMessages,
        [threadId]: [...(state.dmMessages[threadId] ?? []).slice(-49), msg],
      },
    })),

  setDMMessages: (threadId, msgs) =>
    set((state) => ({
      dmMessages: { ...state.dmMessages, [threadId]: msgs },
    })),

  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  resetUnread: () => set({ unreadCount: 0 }),
}))
