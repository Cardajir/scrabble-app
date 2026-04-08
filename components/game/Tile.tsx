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
        'w-10 h-10 text-base font-bold shadow-sm border',
        'bg-amber-100 border-amber-400 text-amber-900',
        isPending && 'ring-2 ring-blue-500 bg-blue-50 border-blue-400',
        isPlaced && !isPending && 'bg-amber-200 border-amber-500 cursor-default',
        (dragging || isDragging) && 'opacity-50 z-50 scale-110',
        tile.isBlank && 'bg-yellow-50 border-yellow-400'
      )}
    >
      <span className="text-sm font-bold leading-none">{displayLetter}</span>
      <span className="absolute bottom-0.5 right-0.5 text-[9px] font-normal leading-none">
        {tile.value}
      </span>
    </div>
  )
}
