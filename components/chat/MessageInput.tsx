'use client'

import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface MessageInputProps {
  onSend: (content: string) => Promise<void>
  placeholder?: string
  maxLength?: number
}

const RATE_LIMIT_MS = 2000

export function MessageInput({ onSend, placeholder = 'Napište zprávu...', maxLength = 500 }: MessageInputProps) {
  const [value, setValue] = useState('')
  const [sending, setSending] = useState(false)
  const lastSentAt = useRef<number>(0)

  const handleSend = async () => {
    const trimmed = value.trim()
    if (!trimmed || sending) return

    const now = Date.now()
    if (now - lastSentAt.current < RATE_LIMIT_MS) {
      return
    }

    setSending(true)
    lastSentAt.current = now
    try {
      await onSend(trimmed)
      setValue('')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-2 p-3 border-t">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={sending}
        className="text-sm"
      />
      <Button size="sm" onClick={handleSend} disabled={!value.trim() || sending}>
        →
      </Button>
    </div>
  )
}
