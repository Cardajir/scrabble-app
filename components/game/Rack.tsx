'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { Tile } from './Tile'
import type { Tile as TileType } from '@/lib/game/tiles'

interface RackProps {
  tiles: TileType[]
  pendingTileIds?: Set<string>
}

export function Rack({ tiles, pendingTileIds }: RackProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'rack' })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'px-4 py-3 rounded-xl transition-colors duration-150',
        'bg-secondary dark:bg-secondary',
        isOver
          ? 'bg-accent dark:bg-accent'
          : ''
      )}
    >
      <div className="flex gap-2 justify-center">
        {tiles.map((tile) => (
          <Tile
            key={tile.id}
            tile={tile}
            isPending={pendingTileIds?.has(tile.id)}
          />
        ))}
        {tiles.length === 0 && (
          <span className="text-sm text-muted-foreground italic py-2">Prazdny stojanek</span>
        )}
      </div>
    </div>
  )
}
