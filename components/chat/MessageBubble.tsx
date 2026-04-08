import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  content: string
  senderNickname: string
  senderAvatar?: string | null
  createdAt: string
  isOwn?: boolean
}

export function MessageBubble({
  content,
  senderNickname,
  senderAvatar,
  createdAt,
  isOwn,
}: MessageBubbleProps) {
  const time = new Date(createdAt).toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={cn('flex gap-2 mb-2', isOwn && 'flex-row-reverse')}>
      <Avatar className="h-7 w-7 shrink-0 mt-1">
        <AvatarImage src={senderAvatar ?? undefined} />
        <AvatarFallback className="text-xs">
          {senderNickname.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className={cn('max-w-[70%]', isOwn && 'items-end flex flex-col')}>
        <div className="flex items-baseline gap-1 mb-0.5">
          {!isOwn && (
            <span className="text-xs font-medium">{senderNickname}</span>
          )}
          <span className="text-[10px] text-muted-foreground">{time}</span>
        </div>
        <div
          className={cn(
            'px-3 py-2 rounded-xl text-sm',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted rounded-tl-sm'
          )}
        >
          {content}
        </div>
      </div>
    </div>
  )
}
