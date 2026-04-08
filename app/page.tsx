import { LinkButton } from '@/components/ui/link-button'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: leaderboard } = await supabase
    .from('users')
    .select('id, nickname, elo_rating')
    .order('elo_rating', { ascending: false })
    .limit(5)

  return (
    <div className="relative min-h-screen grid-bg">
      {/* Radial glow top */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-20">
        {/* Hero */}
        <div className="text-center mb-24">
          {/* Logo mark */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 mb-8 neon-purple">
            <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>

          <h1 className="text-6xl md:text-7xl font-heading text-neon mb-4 tracking-wide">
            ČESKÁ SCRABBLE
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Online multiplayer Scrabble v češtině. Hrajte s přáteli nebo se utkejte
            s náhodnými soupeři v ranked módě. Plná podpora české diakritiky a pravidel.
          </p>

          {user ? (
            <div className="flex flex-wrap gap-4 justify-center">
              <LinkButton size="lg" href="/hry/custom" className="neon-purple px-8">
                Custom hra
              </LinkButton>
              <LinkButton size="lg" variant="outline" href="/hry/ranked" className="border-primary/50 hover:border-primary px-8">
                Ranked mód
              </LinkButton>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 justify-center">
              <LinkButton size="lg" href="/registrace" className="neon-purple px-8">
                Začít hrát zdarma
              </LinkButton>
              <LinkButton size="lg" variant="outline" href="/prihlaseni" className="border-primary/50 hover:border-primary px-8">
                Přihlásit se
              </LinkButton>
            </div>
          )}
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-24">
          <FeatureCard
            icon={
              <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
            }
            title="Multiplayer"
            description="Hrajte 2–4 hráči v real-time. Custom i Ranked hry. Vytvořte vlastní hru nebo se připojte k existující."
          />
          <FeatureCard
            icon={
              <svg className="w-7 h-7 text-[#F43F5E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
              </svg>
            }
            title="Čeština"
            description="Plná podpora české diakritiky. Hrací sada obsahuje všechna česká písmena včetně Č, Š, Ž, Ř a dalších."
          />
          <FeatureCard
            icon={
              <svg className="w-7 h-7 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
              </svg>
            }
            title="ELO Rating"
            description="Sledujte svůj postup přes ELO systém. Každá ranked hra ovlivní vaše hodnocení."
          />
        </div>

        {/* Leaderboard */}
        {leaderboard && leaderboard.length > 0 && (
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-heading text-center mb-6 text-neon">ŽEBŘÍČEK HRÁČŮ</h2>
            <div className="card-gaming rounded-2xl overflow-hidden">
              {leaderboard.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-6 py-4 ${
                    index < leaderboard.length - 1 ? 'border-b border-primary/10' : ''
                  } ${index === 0 ? 'bg-yellow-500/5' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-slate-400/20 text-slate-300' :
                      index === 2 ? 'bg-amber-600/20 text-amber-500' :
                      'bg-primary/10 text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-medium">{player.nickname}</span>
                  </div>
                  <span className="font-mono text-sm px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    {player.elo_rating} ELO
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="card-gaming rounded-2xl p-6 hover:border-primary/50 transition-colors cursor-default">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-heading text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
