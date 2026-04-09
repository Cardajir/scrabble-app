'use client'

import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { Tile as TileType } from '@/lib/game/tiles'

interface TileProps {
  tile: TileType
  isDragging?: boolean
  isPlaced?: boolean
  isPending?: boolean
}

export function Tile({ tile, isDragging, isPlaced, isPending }: TileProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging: dragging } = useDraggable({
    id: tile.id,
    disabled: isPlaced && !isPending,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  const displayLetter = tile.isBlank ? (tile.blankLetter ?? '?') : tile.letter

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'relative flex items-center justify-center rounded cursor-grab active:cursor-grabbing select-none',
        'w-10 h-10 text-base font-bold',
        'bg-[#f4f4ef] text-primary shadow-[0_1px_3px_rgba(26,28,25,0.06)]',
        isPending && 'ring-2 ring-secondary-foreground bg-accent',
        isPlaced && !isPending && 'bg-[#e8e8e4] cursor-default',
        (dragging || isDragging) && 'opacity-50 z-50 scale-110 shadow-[0_8px_32px_rgba(26,28,25,0.12)]',
        tile.isBlank && 'bg-accent/60'
      )}
    >
      <span className="text-sm font-bold leading-none">{displayLetter}</span>
      <span className="absolute bottom-0.5 right-0.5 text-[9px] font-normal leading-none text-muted-foreground">
        {tile.value}
      </span>
    </div>
  )
}
