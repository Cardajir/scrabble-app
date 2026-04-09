'use client'

import { getBonusAt, BOARD_SIZE, positionKey } from '@/lib/game/board'
import type { PlacedTile } from '@/lib/game/board'
import { BoardCell } from './BoardCell'

interface PendingCell {
  row: number
  col: number
  letter: string
  value?: number
  isBlank?: boolean
}

interface BoardProps {
  boardState: Record<string, PlacedTile>
  pendingTiles: PendingCell[]
}

export function Board({ boardState, pendingTiles }: BoardProps) {
  const pendingMap = new Map(
    pendingTiles.map((pt) => [positionKey(pt.row, pt.col), pt])
  )

  return (
    <div className="w-full aspect-square">
      <div
        className="grid h-full w-full bg-primary/8 dark:bg-primary/15 gap-px rounded-lg"
        style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: BOARD_SIZE }, (_, row) =>
          Array.from({ length: BOARD_SIZE }, (_, col) => {
            const key = positionKey(row, col)
            const tile = boardState[key] ?? null
            const pending = pendingMap.get(key)

            return (
              <BoardCell
                key={key}
                row={row}
                col={col}
                bonus={getBonusAt(row, col)}
                tile={tile}
                pendingTile={
                  pending
                    ? { letter: pending.letter, value: pending.value ?? 0, isBlank: pending.isBlank ?? false }
                    : null
                }
              />
            )
          })
        )}
      </div>
    </div>
  )
}
