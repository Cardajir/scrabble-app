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
        toast.error(err.error ?? 'Chyba pri vymene')
        return
      }

      toast.success('Pismena vymenena')
      onExchanged()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vymena pismen</DialogTitle>
          <DialogDescription>
            Vyberte pismena, ktera chcete vratit do pytliku. Dostanete stejny pocet novych.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 flex-wrap justify-center py-4">
          {rack.map((tile) => (
            <button
              key={tile.id}
              onClick={() => toggleTile(tile.id)}
              className={cn(
                'relative flex items-center justify-center rounded w-12 h-12 text-lg font-bold transition-all',
                'bg-secondary text-primary cursor-pointer',
                selected.has(tile.id) && 'ring-2 ring-destructive bg-destructive/8 scale-110'
              )}
            >
              {tile.isBlank ? '?' : tile.letter}
              <span className="absolute bottom-0.5 right-0.5 text-[9px] text-muted-foreground">{tile.value}</span>
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Vybrano: {selected.size} pismen
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Zrusit
          </Button>
          <Button
            onClick={handleExchange}
            disabled={selected.size === 0 || loading}
          >
            {loading ? 'Vymenuji...' : `Vymenit ${selected.size} ${selected.size === 1 ? 'pismeno' : 'pismen'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
