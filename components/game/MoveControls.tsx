'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TileExchangeModal } from './TileExchangeModal'
import type { Tile } from '@/lib/game/tiles'

interface MoveControlsProps {
  hasPending: boolean
  isMyTurn: boolean
  isSubmitting: boolean
  isValidating: boolean
  validationError: string | null
  onConfirm: () => void
  onCancel: () => void
  onPass: () => void
  onResign: () => void
  gameId: string
  rack: Tile[]
  tileBagSize: number
}

export function MoveControls({
  hasPending,
  isMyTurn,
  isSubmitting,
  isValidating,
  validationError,
  onConfirm,
  onCancel,
  onPass,
  onResign,
  gameId,
  rack,
  tileBagSize,
}: MoveControlsProps) {
  const [showExchange, setShowExchange] = useState(false)

  return (
    <div className="card-gaming rounded-xl p-3 space-y-2">
      {validationError && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-lg flex items-center gap-2">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          {validationError}
        </div>
      )}

      {hasPending ? (
        <div className="flex flex-col gap-2">
          <Button
            className="w-full h-11 text-sm font-bold neon-purple cursor-pointer"
            onClick={onConfirm}
            disabled={!isMyTurn || isSubmitting || isValidating || !!validationError}
          >
            {isSubmitting ? 'Potvrzuji...' : isValidating ? 'Ověřuji...' : 'Potvrdit tah'}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full h-9 text-sm border-primary/20 hover:border-primary/50 cursor-pointer"
          >
            Zrušit
          </Button>
        </div>
      ) : isMyTurn ? (
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => setShowExchange(true)}
            disabled={isSubmitting || tileBagSize < 7}
            className="w-full h-9 text-sm border-primary/20 hover:border-primary/50 cursor-pointer"
          >
            Vyměnit písmena
          </Button>
          <Button
            variant="ghost"
            onClick={onPass}
            disabled={isSubmitting}
            className="w-full h-9 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Přeskočit tah
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-1">Čekáte na soupeře...</p>
      )}

      {showExchange && (
        <TileExchangeModal
          gameId={gameId}
          rack={rack}
          onClose={() => setShowExchange(false)}
          onExchanged={() => setShowExchange(false)}
        />
      )}
    </div>
  )
}
