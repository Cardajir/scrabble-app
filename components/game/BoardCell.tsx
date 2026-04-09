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
  TW: { bg: 'bg-[#ba1a1a]/40 text-[#ba1a1a] dark:bg-[#ff897d]/20 dark:text-[#ff897d]', label: '3xS' },
  DW: { bg: 'bg-[#ba1a1a]/20 text-[#ba1a1a]/80 dark:bg-[#ff897d]/12 dark:text-[#ff897d]/80', label: '2xS' },
  TL: { bg: 'bg-[#005da7]/35 text-[#005da7] dark:bg-[#9fc6ff]/20 dark:text-[#9fc6ff]', label: '3xP' },
  DL: { bg: 'bg-[#005da7]/20 text-[#005da7]/80 dark:bg-[#9fc6ff]/12 dark:text-[#9fc6ff]/80', label: '2xP' },
  STAR: { bg: 'bg-[#8B6914]/20 text-[#8B6914] dark:bg-[#8B6914]/25 dark:text-[#d4a84b]', label: '\u2605' },
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
        isEmpty && isOver && 'bg-accent ring-1 ring-secondary-foreground/40',
        isEmpty && !isOver && !bonusStyle && 'bg-[#f4f4ef] dark:bg-[#1e2320]',
        isEmpty && !isOver && bonusStyle && bonusStyle.bg,
        tile && 'bg-[#e8e8e4] dark:bg-[#e8e8e4]',
        pendingTile && 'bg-accent ring-1 ring-secondary-foreground/50',
      )}
    >
      {isEmpty && bonusStyle && (
        <span className="text-[clamp(6px,1.8cqi,11px)] font-bold leading-none text-center select-none">
          {bonusStyle.label}
        </span>
      )}
      {(tile || pendingTile) && (
        <div className="relative flex items-center justify-center w-full h-full">
          <span className="text-[clamp(8px,2cqi,14px)] font-bold text-primary">
            {tile ? tile.letter : pendingTile?.letter}
          </span>
          <span className="absolute bottom-0 right-0.5 text-[clamp(5px,1cqi,8px)] text-muted-foreground">
            {tile ? tile.value : pendingTile?.value}
          </span>
        </div>
      )}
    </div>
  )
}
