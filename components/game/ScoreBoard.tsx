'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Player {
  user_id: string
  score: number
  turn_order: number
  is_active: boolean
  users: { id: string; nickname: string; elo_rating: number; avatar_url: string | null } | null
}

interface ScoreBoardProps {
  players: Player[]
  currentUserId: string
  currentTurnUserId?: string
}

export function ScoreBoard({ players, currentUserId, currentTurnUserId }: ScoreBoardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="space-y-2">
      {sorted.map((player, index) => {
        const isMe = player.user_id === currentUserId
        const isCurrentTurn = player.user_id === currentTurnUserId

        return (
          <div
            key={player.user_id}
            className={cn(
              'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
              isCurrentTurn
                ? 'bg-accent shadow-[0_1px_8px_rgba(1,38,31,0.08)]'
                : 'bg-secondary/50',
              isMe && !isCurrentTurn && 'bg-secondary'
            )}
          >
            {/* Rank badge */}
            <div className={cn(
              'flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0',
              index === 0 ? 'bg-[#8B6914]/15 text-[#8B6914]' : 'bg-muted text-muted-foreground'
            )}>
              {index + 1}
            </div>

            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className={cn(
                'h-9 w-9 ring-2 transition-all',
                isCurrentTurn ? 'ring-primary' : 'ring-transparent'
              )}>
                <AvatarImage src={player.users?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs bg-accent text-primary font-bold">
                  {player.users?.nickname?.slice(0, 2).toUpperCase() ?? '??'}
                </AvatarFallback>
              </Avatar>
              {isCurrentTurn && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background animate-pulse" />
              )}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none truncate">
                {player.users?.nickname ?? 'Neznamy'}
                {isMe && <span className="text-[10px] text-primary ml-1">(vy)</span>}
              </p>
              {isCurrentTurn && (
                <p className="text-[10px] text-primary mt-0.5 font-medium">Na tahu</p>
              )}
            </div>

            {/* Score */}
            <div className={cn(
              'font-mono text-lg font-bold tabular-nums px-3 py-1 rounded-lg shrink-0',
              isMe
                ? 'bg-primary/8 text-primary'
                : 'text-foreground'
            )}>
              {player.score}
            </div>
          </div>
        )
      })}
    </div>
  )
}
