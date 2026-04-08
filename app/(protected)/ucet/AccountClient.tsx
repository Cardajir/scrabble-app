'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Profile {
  id: string
  email: string
  nickname: string
  avatar_url: string | null
  elo_rating: number
  created_at: string
}

type Stats = {
  games_played: number
  games_won: number
  games_lost: number
  average_score: number
  best_win_streak: number
  current_win_streak: number
  highest_single_turn_score: number
  longest_word: string | null
  longest_word_score: number
  total_score: number
} | null

interface EloEntry {
  id: string
  elo_change: number
  elo_before: number
  elo_after: number
  created_at: string
}

interface Props {
  profile: Profile
  stats: Stats
  eloHistory: EloEntry[]
}

function eloTier(elo: number) {
  if (elo >= 2000) return { label: 'MISTR', color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' }
  if (elo >= 1600) return { label: 'EXPERT', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' }
  if (elo >= 1400) return { label: 'POKROČILÝ', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' }
  if (elo >= 1200) return { label: 'STŘEDNÍ', color: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-500/10' }
  return { label: 'ZAČÁTEČNÍK', color: 'text-muted-foreground', border: 'border-border', bg: 'bg-muted' }
}

export function AccountClient({ profile, stats, eloHistory }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [avatarSrc, setAvatarSrc] = useState(profile.avatar_url ?? '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [nickname, setNickname] = useState(profile.nickname)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const winRate = stats && stats.games_played > 0
    ? Math.round((stats.games_won / stats.games_played) * 100)
    : 0

  const tier = eloTier(profile.elo_rating)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Obrázek musí být menší než 2 MB')
      return
    }

    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${profile.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        toast.error('Chyba při nahrávání: ' + uploadError.message)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: publicUrl }),
      })

      if (!res.ok) {
        toast.error('Chyba při ukládání avatara')
        return
      }

      setAvatarSrc(publicUrl + '?t=' + Date.now())
      toast.success('Avatar uložen')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    if (nickname.length < 3) { toast.error('Přezdívka musí mít alespoň 3 znaky'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname !== profile.nickname ? nickname : undefined }),
      })
      if (!res.ok) { const e = await res.json(); toast.error(e.error ?? 'Chyba'); return }
      toast.success('Přezdívka uložena')
      router.refresh()
    } finally { setSaving(false) }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error('Heslo musí mít alespoň 6 znaků'); return }
    if (newPassword !== confirmPassword) { toast.error('Hesla se neshodují'); return }
    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) { toast.error(error.message); return }
      toast.success('Heslo změněno')
      setNewPassword(''); setConfirmPassword('')
    } finally { setSavingPassword(false) }
  }

  return (
    <div className="relative min-h-screen grid-bg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-purple-600/8 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-10 max-w-5xl">

        {/* Hero banner */}
        <div className="relative rounded-2xl overflow-hidden border border-primary/20 mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="relative p-8 flex flex-col sm:flex-row items-center sm:items-end gap-6">

            {/* Avatar */}
            <div className="relative group shrink-0">
              <Avatar className="h-28 w-28 ring-4 ring-primary/30 shadow-2xl">
                <AvatarImage src={avatarSrc || undefined} />
                <AvatarFallback className="text-4xl font-bold bg-primary/20 text-primary">
                  {profile.nickname.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Změnit avatar"
              >
                {uploadingAvatar ? (
                  <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Name + rank */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-4xl font-heading text-neon">{profile.nickname}</h1>
              <p className="text-muted-foreground text-sm mt-1">{profile.email}</p>
              <div className="flex items-center gap-3 mt-3 justify-center sm:justify-start flex-wrap">
                <span className={`font-heading text-xs tracking-widest px-3 py-1 rounded-lg border ${tier.bg} ${tier.color} ${tier.border}`}>
                  {tier.label}
                </span>
                <span className="font-mono text-lg font-bold text-primary px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
                  {profile.elo_rating} ELO
                </span>
                <span className="text-xs text-muted-foreground">
                  Člen od {new Date(profile.created_at).toLocaleDateString('cs-CZ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={<svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" /></svg>}
            label="Odehráno"
            value={stats?.games_played ?? 0}
          />
          <StatCard
            icon={<svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" /></svg>}
            label="Výher"
            value={stats?.games_won ?? 0}
            valueColor="text-yellow-400"
          />
          <StatCard
            icon={<svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>}
            label="Průměrné skóre"
            value={Number(stats?.average_score ?? 0).toFixed(0)}
            valueColor="text-blue-400"
          />
          <StatCard
            icon={<svg className="w-5 h-5 text-[#F43F5E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>}
            label="Nejlepší tah"
            value={stats?.highest_single_turn_score ?? 0}
            valueColor="text-[#F43F5E]"
          />
        </div>

        {/* Win rate bar */}
        <div className="card-gaming rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-semibold">Výhernost</span>
              <span className="text-xs text-muted-foreground ml-2">
                {stats?.games_won ?? 0}V / {stats?.games_lost ?? 0}P
              </span>
            </div>
            <span className="text-xl font-heading text-primary">{winRate}%</span>
          </div>
          <Progress value={winRate} className="h-2.5" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Aktuální série: <strong className="text-foreground">{stats?.current_win_streak ?? 0}</strong></span>
            <span>Rekord: <strong className="text-foreground">{stats?.best_win_streak ?? 0}</strong></span>
          </div>
        </div>

        {/* Records */}
        {stats?.longest_word && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div className="card-gaming rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Nejdelší slovo</p>
                <p className="text-xl font-mono font-bold tracking-wider">{stats.longest_word}</p>
                <p className="text-xs text-muted-foreground">{stats.longest_word_score} bodů</p>
              </div>
            </div>
            <div className="card-gaming rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Celkové skóre</p>
                <p className="text-xl font-bold">{stats.total_score.toLocaleString('cs-CZ')}</p>
                <p className="text-xs text-muted-foreground">ze všech her</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="profil">
          <TabsList className="w-full mb-4 bg-card border border-primary/20">
            <TabsTrigger value="profil" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Profil</TabsTrigger>
            <TabsTrigger value="heslo" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Heslo</TabsTrigger>
            <TabsTrigger value="elo" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">ELO Historie</TabsTrigger>
          </TabsList>

          <TabsContent value="profil">
            <div className="card-gaming rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="font-heading text-base mb-1">PŘEZDÍVKA</h3>
                <p className="text-xs text-muted-foreground mb-4">Zobrazuje se ostatním hráčům</p>
                <div className="space-y-2">
                  <Label htmlFor="nickname" className="text-sm">Přezdívka</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={20}
                    className="bg-background/50 border-primary/20 focus:border-primary max-w-sm"
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="neon-purple">
                {saving ? 'Ukládám...' : 'Uložit přezdívku'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="heslo">
            <div className="card-gaming rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="font-heading text-base mb-1">NOVÉ HESLO</h3>
                <p className="text-xs text-muted-foreground mb-4">Min. 6 znaků</p>
              </div>
              <div className="space-y-2 max-w-sm">
                <Label htmlFor="newPassword" className="text-sm">Nové heslo</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-background/50 border-primary/20 focus:border-primary"
                />
              </div>
              <div className="space-y-2 max-w-sm">
                <Label htmlFor="confirmPassword" className="text-sm">Potvrzení</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background/50 border-primary/20 focus:border-primary"
                />
              </div>
              <Button onClick={handleChangePassword} disabled={savingPassword} className="neon-purple">
                {savingPassword ? 'Měním...' : 'Změnit heslo'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="elo">
            <div className="card-gaming rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-primary/10">
                <h3 className="font-heading text-base">ELO HISTORIE</h3>
              </div>
              {eloHistory.length > 0 ? (
                <div className="divide-y divide-primary/10">
                  {eloHistory.map((entry) => {
                    const won = entry.elo_change >= 0
                    return (
                      <div key={entry.id} className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            won ? 'bg-green-500/10' : 'bg-[#F43F5E]/10'
                          }`}>
                            <svg className={`w-4 h-4 ${won ? 'text-green-400' : 'text-[#F43F5E]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              {won
                                ? <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                                : <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                              }
                            </svg>
                          </div>
                          <div>
                            <span className={`font-mono font-bold ${won ? 'text-green-400' : 'text-[#F43F5E]'}`}>
                              {won ? '+' : ''}{entry.elo_change}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {entry.elo_before} → {entry.elo_after}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString('cs-CZ')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground text-sm">Žádná ELO historie</p>
                  <p className="text-xs text-muted-foreground mt-1">Odehrajte ranked hru!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function StatCard({
  icon, label, value, valueColor,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  valueColor?: string
}) {
  return (
    <div className="card-gaming rounded-2xl p-5 text-center">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mx-auto mb-3">
        {icon}
      </div>
      <div className={`text-2xl font-bold ${valueColor ?? ''}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}
