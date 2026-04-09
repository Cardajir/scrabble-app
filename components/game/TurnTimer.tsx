'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TurnTimerProps {
  limit: number
  isActive: boolean
  onExpire: () => void
}

export function TurnTimer({ limit, isActive, onExpire }: TurnTimerProps) {
  const [remaining, setRemaining] = useState(limit)

  useEffect(() => {
    setRemaining(limit)
  }, [limit, isActive])

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onExpire()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, onExpire])

  const percentage = (remaining / limit) * 100
  const isUrgent = remaining <= 10

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          'text-2xl font-mono font-bold',
          isUrgent && isActive ? 'text-destructive animate-pulse' : percentage > 20 ? 'text-primary' : 'text-[#8B6914]'
        )}
      >
        {remaining}s
      </div>
      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            percentage > 50 ? 'bg-primary' : percentage > 20 ? 'bg-[#8B6914]' : 'bg-destructive'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
