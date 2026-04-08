'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.string().email('Zadejte platný e-mail'),
  nickname: z
    .string()
    .min(3, 'Přezdívka musí mít alespoň 3 znaky')
    .max(20, 'Přezdívka může mít nejvýše 20 znaků')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Jen písmena, čísla, _ a -'),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Hesla se neshodují',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegistracePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { nickname: data.nickname },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          toast.error('Tento e-mail je již zaregistrován')
        } else {
          toast.error(error.message)
        }
        return
      }

      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center px-4">
        <div className="relative w-full max-w-md text-center">
          <div className="card-gaming rounded-2xl p-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 mb-6 mx-auto">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-2xl font-heading mb-3">ZKONTROLUJTE E-MAIL</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              Poslali jsme vám potvrzovací odkaz. Klikněte na něj a účet se aktivuje.
            </p>
            <Link href="/prihlaseni" className="text-sm text-primary hover:underline">
              Zpět na přihlášení
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4 py-16">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 mb-4 neon-purple">
            <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h1 className="text-3xl font-heading text-neon">REGISTROVAT SE</h1>
          <p className="text-muted-foreground text-sm mt-2">Vytvořte si účet a začněte hrát</p>
        </div>

        {/* Card */}
        <div className="card-gaming rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="vas@email.cz"
                {...register('email')}
                disabled={loading}
                className="bg-background/50 border-primary/20 focus:border-primary"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-sm font-medium">Přezdívka</Label>
              <Input
                id="nickname"
                placeholder="VášNick123"
                {...register('nickname')}
                disabled={loading}
                className="bg-background/50 border-primary/20 focus:border-primary"
              />
              {errors.nickname && <p className="text-xs text-destructive">{errors.nickname.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Heslo</Label>
              <Input
                id="password"
                type="password"
                placeholder="min. 6 znaků"
                {...register('password')}
                disabled={loading}
                className="bg-background/50 border-primary/20 focus:border-primary"
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Potvrzení hesla</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                disabled={loading}
                className="bg-background/50 border-primary/20 focus:border-primary"
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full neon-purple mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Registruji...
                </span>
              ) : 'Registrovat se'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Máte již účet?{' '}
            <Link href="/prihlaseni" className="font-medium text-primary hover:underline">
              Přihlásit se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
