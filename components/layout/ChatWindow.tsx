'use client'

import { useChatStore } from '@/store/chatStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GlobalChatTab } from '@/components/chat/GlobalChatTab'
import { GameChatTab } from '@/components/chat/GameChatTab'
import { DMListTab } from '@/components/chat/DMListTab'
import { cn } from '@/lib/utils'

interface ChatWindowProps {
  userId: string
  gameId?: string
  onClose: () => void
}

export function ChatWindow({ userId, gameId, onClose }: ChatWindowProps) {
  const { activeTab, setActiveTab } = useChatStore()

  return (
    <div className={cn(
      'bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden',
      'w-[380px] h-[520px]'
    )}>
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <h2 className="font-semibold text-sm">Chat</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Zavřít chat"
        >
          ✕
        </button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'global' | 'dm' | 'game')}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="mx-3 mt-2 shrink-0">
          {gameId && <TabsTrigger value="game" className="flex-1 text-xs">Hra</TabsTrigger>}
          <TabsTrigger value="global" className="flex-1 text-xs">Globální</TabsTrigger>
          <TabsTrigger value="dm" className="flex-1 text-xs">Zprávy</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          {gameId && (
            <TabsContent value="game" className="h-full m-0 p-0 data-[state=active]:flex data-[state=active]:flex-col">
              <GameChatTab gameId={gameId} userId={userId} />
            </TabsContent>
          )}
          <TabsContent value="global" className="h-full m-0 p-0 data-[state=active]:flex data-[state=active]:flex-col">
            <GlobalChatTab userId={userId} />
          </TabsContent>
          <TabsContent value="dm" className="h-full m-0 p-0 data-[state=active]:flex data-[state=active]:flex-col">
            <DMListTab userId={userId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
