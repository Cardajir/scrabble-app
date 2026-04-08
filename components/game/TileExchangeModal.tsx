'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Tile } from '@/lib/game/tiles'

interface TileExchangeModalProps {
  gameId: string
  rack: Tile[]
  onClose: () => void
  onExchanged: () => void
}

export function TileExchangeModal({
  gameId,
  rack,
  onClose,
  onExchanged,
}: TileExchangeModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const toggleTile = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleExchange = async () => {
    if (selected.size === 0) return
    setLoading(true)
    try {
      const res = await fetch(`/api/games/${gameId}/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tileIds: Array.from(selected) }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Chyba při výměně')
        return
      }

      toast.success('Písmena vyměněna')
      onExchanged()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Výměna písmen</DialogTitle>
          <DialogDescription>
            Vyberte písmena, která chcete vrátit do pytlíku. Dostanete stejný počet nových.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 flex-wrap justify-center py-4">
          {rack.map((tile) => (
            <button
              key={tile.id}
              onClick={() => toggleTile(tile.id)}
              className={cn(
                'relative flex items-center justify-center rounded w-12 h-12 text-lg font-bold border-2 transition-all',
                'bg-amber-100 border-amber-400 text-amber-900 cursor-pointer',
                selected.has(tile.id) && 'ring-2 ring-red-500 bg-red-50 border-red-400 scale-110'
              )}
            >
              {tile.isBlank ? '?' : tile.letter}
              <span className="absolute bottom-0.5 right-0.5 text-[9px]">{tile.value}</span>
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Vybráno: {selected.size} písmen
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Zrušit
          </Button>
          <Button
            onClick={handleExchange}
            disabled={selected.size === 0 || loading}
          >
            {loading ? 'Vyměňuji...' : `Vyměnit ${selected.size} ${selected.size === 1 ? 'písmeno' : 'písmen'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
