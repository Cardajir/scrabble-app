'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { BonusType, PlacedTile } from '@/lib/game/board'

interface BoardCellProps {
  row: number
  col: number
  bonus: BonusType
  tile: PlacedTile | null
  pendingTile?: { letter: string; value: number; isBlank: boolean } | null
}

const BONUS_STYLES: Record<NonNullable<BonusType>, { bg: string; label: string }> = {
  TW: { bg: 'bg-red-600 text-white', label: '3×S' },
  DW: { bg: 'bg-rose-400 dark:bg-rose-500 text-white', label: '2×S' },
  TL: { bg: 'bg-blue-600 text-white', label: '3×P' },
  DL: { bg: 'bg-sky-400 dark:bg-sky-500 text-white', label: '2×P' },
  STAR: { bg: 'bg-yellow-400 text-yellow-900', label: '★' },
}

export function BoardCell({ row, col, bonus, tile, pendingTile }: BoardCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `board-cell-${row}-${col}`,
    disabled: !!(tile || pendingTile),
  })

  const isEmpty = !tile && !pendingTile
  const bonusStyle = bonus && isEmpty ? BONUS_STYLES[bonus] : null

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative aspect-square flex items-center justify-center',
        'transition-colors duration-100',
        isEmpty && isOver && 'bg-green-300 dark:bg-green-600/60 ring-1 ring-green-400',
        isEmpty && !isOver && !bonusStyle && 'bg-amber-50 dark:bg-[#2a2a50]',
        isEmpty && !isOver && bonusStyle && bonusStyle.bg,
        tile && 'bg-amber-100 dark:bg-amber-200',
        pendingTile && 'bg-blue-100 dark:bg-blue-400/40 ring-1 ring-blue-400',
      )}
    >
      {isEmpty && bonusStyle && (
        <span className="text-[clamp(6px,1.8cqi,11px)] font-bold leading-none text-center select-none drop-shadow-sm">
          {bonusStyle.label}
        </span>
      )}
      {(tile || pendingTile) && (
        <div className="relative flex items-center justify-center w-full h-full">
          <span className="text-[clamp(8px,2cqi,14px)] font-bold text-amber-900 dark:text-amber-900">
            {tile ? tile.letter : pendingTile?.letter}
          </span>
          <span className="absolute bottom-0 right-0.5 text-[clamp(5px,1cqi,8px)] text-amber-700 dark:text-amber-800">
            {tile ? tile.value : pendingTile?.value}
          </span>
        </div>
      )}
    </div>
  )
}
