'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createGameSchema, type CreateGameInput } from '@/lib/validations/game'

interface CreateGameModalProps {
  type: 'CUSTOM' | 'RANKED'
  onClose: () => void
  onCreated: (gameId: string) => void
}

export function CreateGameModal({ type, onClose, onCreated }: CreateGameModalProps) {
  const [loading, setLoading] = useState(false)
  const [unlimited, setUnlimited] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateGameInput>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      type,
      maxPlayers: 2,
      isPrivate: false,
      turnTimeLimit: null,
    },
  })

  const isPrivate = watch('isPrivate')

  const onSubmit = async (data: CreateGameInput) => {
    setLoading(true)
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Chyba pri vytvareni hry')
        return
      }

      const { gameId } = await res.json()
      toast.success('Hra vytvorena!')
      onCreated(gameId)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Vytvorit novou hru
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Nastavte parametry nove {type === 'CUSTOM' ? 'custom' : 'ranked'} hry.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          {/* Nazev */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Nazev hry</Label>
            <Input
              id="name"
              placeholder="Pratelska hra"
              {...register('name')}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Pocet hracu */}
          <div className="space-y-2">
            <Label htmlFor="maxPlayers" className="text-sm font-medium">Pocet hracu</Label>
            <select
              id="maxPlayers"
              {...register('maxPlayers', { valueAsNumber: true })}
              className="w-full rounded-lg px-3 py-2 text-sm bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
              disabled={loading}
            >
              <option value={2}>2 hraci</option>
              <option value={3}>3 hraci</option>
              <option value={4}>4 hraci</option>
            </select>
          </div>

          {/* Cas na tah */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Cas na tah</Label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${unlimited ? 'bg-primary' : 'bg-muted'}`}
                onClick={() => {
                  const next = !unlimited
                  setUnlimited(next)
                  if (next) setValue('turnTimeLimit', null)
                  else setValue('turnTimeLimit', 60)
                }}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${unlimited ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <input
                type="checkbox"
                id="unlimited"
                checked={unlimited}
                onChange={(e) => {
                  setUnlimited(e.target.checked)
                  if (e.target.checked) setValue('turnTimeLimit', null)
                  else setValue('turnTimeLimit', 60)
                }}
                className="sr-only"
                disabled={loading}
              />
              <span className="text-sm">Neomezeno</span>
            </label>
            {!unlimited && (
              <div className="flex items-center gap-3">
                <Input
                  id="turnTimeLimit"
                  type="number"
                  min={30}
                  max={600}
                  placeholder="60"
                  {...register('turnTimeLimit', { valueAsNumber: true })}
                  disabled={loading}
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">sekund</span>
              </div>
            )}
          </div>

          {/* Soukroma hra */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative w-10 h-5 rounded-full transition-colors ${isPrivate ? 'bg-primary' : 'bg-muted'}`}
            >
              <input
                type="checkbox"
                id="isPrivate"
                {...register('isPrivate')}
                className="sr-only"
                disabled={loading}
              />
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPrivate ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm">Soukroma hra (pouze s heslem)</span>
          </label>

          {isPrivate && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Heslo</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                disabled={loading}
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Zrusit
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 glow-primary">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Vytvarim...
                </span>
              ) : 'Vytvorit hru'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
