# Česká Scrabble – Online Multiplayer Hra

Online multiplayer Scrabble pro česky mluvící uživatele. Plná podpora české diakritiky, pravidel a slovníku.

## Technologický stack

| Vrstva | Technologie |
|--------|-------------|
| Frontend | Next.js 14+ (App Router) + TypeScript |
| Backend | Next.js API Routes (serverless) |
| Databáze | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime Channels |
| Styling | Tailwind CSS + shadcn/ui |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| State | Zustand |
| Formuláře | React Hook Form + Zod |
| Deploy | Vercel |

## Předpoklady

- **Node.js** 20+
- **npm** 10+
- **Supabase CLI** – `npm install -g supabase`
- Účet na [supabase.com](https://supabase.com)

## Setup – krok za krokem

### 1. Klonování a instalace

```bash
git clone <repo-url>
cd scrabble-app
npm install
```

### 2. Vytvoření Supabase projektu

1. Přihlaste se na [supabase.com](https://supabase.com)
2. Klikněte na **New Project**
3. Zadejte název, heslo a region (EU West doporučeno)
4. Počkejte na inicializaci

### 3. Konfigurace proměnných prostředí

```bash
cp .env.example .env.local
```

Vyplňte `.env.local` hodnotami z Supabase Dashboard → **Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Aplikace databázových migrací

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

Nebo spusťte SQL soubory ručně v Supabase Dashboard → SQL Editor:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_indexes.sql`
3. `supabase/migrations/003_rls.sql`

### 5. Seed data (volitelné)

```bash
supabase db seed
```

### 6. Import slovníku

```bash
npx tsx scripts/import-dictionary.ts ./data/czech-words.txt
```

Seed data již obsahují ~500 základních slov pro testování.

### 7. Generování TypeScript typů

```bash
supabase gen types typescript --project-id <project-id> > types/supabase.ts
```

### 8. Spuštění aplikace

```bash
npm run dev

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
