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
        'px-4 py-3 border-2 rounded-xl transition-colors duration-150',
        'bg-amber-50/80 dark:bg-secondary/30',
        isOver
          ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
          : 'border-amber-300/60 dark:border-primary/25'
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
          <span className="text-sm text-muted-foreground italic py-2">Prázdný stojánek</span>
        )}
      </div>
    </div>
  )
}
