-- ============================================================
-- KOMPLETNÍ SETUP – spustit vše najednou v Supabase SQL Editoru
-- ============================================================

-- 1. TABULKY
-- ============================================================

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nickname text not null unique,
  avatar_url text,
  elo_rating integer not null default 1200,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  bio text,
  country text,
  preferred_language text default 'cs'
);

create table if not exists public.statistics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  games_played integer not null default 0,
  games_won integer not null default 0,
  games_lost integer not null default 0,
  total_score integer not null default 0,
  average_score numeric(8,2) not null default 0,
  longest_word text,
  longest_word_score integer not null default 0,
  highest_single_turn_score integer not null default 0,
  current_win_streak integer not null default 0,
  best_win_streak integer not null default 0
);

create table if not exists public.elo_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  elo_change integer not null,
  elo_before integer not null,
  elo_after integer not null,
  game_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('CUSTOM', 'RANKED')),
  status text not null default 'WAITING' check (status in ('WAITING', 'IN_PROGRESS', 'FINISHED', 'ABANDONED')),
  name text,
  is_private boolean not null default false,
  password_hash text,
  board_state jsonb not null default '{}',
  tile_bag jsonb not null default '[]',
  current_player_index integer not null default 0,
  turn_number integer not null default 0,
  max_players integer not null default 2 check (max_players between 2 and 4),
  turn_time_limit integer,
  winner_id uuid references public.users(id),
  created_by_id uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references public.users(id),
  rack jsonb not null default '[]',
  score integer not null default 0,
  is_active boolean not null default true,
  has_left boolean not null default false,
  turn_order integer not null,
  joined_at timestamptz not null default now(),
  unique(game_id, user_id),
  unique(game_id, turn_order)
);

create table if not exists public.game_moves (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references public.users(id),
  move_type text not null check (move_type in ('PLACE', 'EXCHANGE', 'PASS', 'RESIGN')),
  tiles jsonb default '[]',
  words jsonb default '[]',
  score integer not null default 0,
  rack_after jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.game_invites (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  from_user_id uuid not null references public.users(id),
  to_user_id uuid not null references public.users(id),
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

create table if not exists public.ranked_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id),
  elo_rating integer not null,
  status text not null default 'WAITING' check (status in ('WAITING', 'MATCHED', 'CANCELLED')),
  search_range_min integer not null,
  search_range_max integer not null,
  joined_at timestamptz not null default now(),
  matched_at timestamptz
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  user_id uuid not null references public.users(id),
  content text not null check (char_length(content) <= 500),
  created_at timestamptz not null default now()
);

create table if not exists public.direct_message_threads (
  id uuid primary key default gen_random_uuid(),
  participant1_id uuid not null references public.users(id),
  participant2_id uuid not null references public.users(id),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(participant1_id, participant2_id)
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.direct_message_threads(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  content text not null check (char_length(content) <= 500),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.dictionary_words (
  id uuid primary key default gen_random_uuid(),
  word text not null unique,
  length integer not null generated always as (char_length(word)) stored,
  is_valid boolean not null default true
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('GAME_INVITE', 'GAME_START', 'GAME_END', 'DM', 'SYSTEM')),
  title text not null,
  body text not null,
  is_read boolean not null default false,
  related_id uuid,
  created_at timestamptz not null default now()
);

-- 2. UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_users_updated_at on public.users;
create trigger update_users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_games_updated_at on public.games;
create trigger update_games_updated_at
  before update on public.games
  for each row execute function public.update_updated_at_column();

-- 3. INDEXY
-- ============================================================

create index if not exists idx_games_status on public.games(status);
create index if not exists idx_games_type on public.games(type);
create index if not exists idx_game_players_game_id on public.game_players(game_id);
create index if not exists idx_game_players_user_id on public.game_players(user_id);
create index if not exists idx_game_moves_game_id on public.game_moves(game_id);
create index if not exists idx_chat_messages_game_id on public.chat_messages(game_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at desc);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_dictionary_word on public.dictionary_words(word);

-- 4. RLS
-- ============================================================

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.statistics enable row level security;
alter table public.elo_history enable row level security;
alter table public.games enable row level security;
alter table public.game_players enable row level security;
alter table public.game_moves enable row level security;
alter table public.game_invites enable row level security;
alter table public.ranked_queue enable row level security;
alter table public.chat_messages enable row level security;
alter table public.direct_message_threads enable row level security;
alter table public.direct_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.dictionary_words enable row level security;

-- users
drop policy if exists "users_select" on public.users;
drop policy if exists "users_update" on public.users;
drop policy if exists "users_insert" on public.users;
create policy "users_select" on public.users for select using (true);
create policy "users_update" on public.users for update using (auth.uid() = id);
create policy "users_insert" on public.users for insert with check (true);  -- trigger potřebuje vložit

-- profiles
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = user_id);
create policy "profiles_insert" on public.profiles for insert with check (true);

-- statistics
drop policy if exists "statistics_select" on public.statistics;
drop policy if exists "statistics_update" on public.statistics;
drop policy if exists "statistics_insert" on public.statistics;
create policy "statistics_select" on public.statistics for select using (true);
create policy "statistics_update" on public.statistics for update using (auth.uid() = user_id);
create policy "statistics_insert" on public.statistics for insert with check (true);

-- elo_history
drop policy if exists "elo_select" on public.elo_history;
drop policy if exists "elo_insert" on public.elo_history;
create policy "elo_select" on public.elo_history for select using (auth.uid() = user_id);
create policy "elo_insert" on public.elo_history for insert with check (true);

-- games
drop policy if exists "games_select" on public.games;
drop policy if exists "games_insert" on public.games;
drop policy if exists "games_update" on public.games;
create policy "games_select" on public.games for select
  using (is_private = false or exists (
    select 1 from public.game_players where game_id = games.id and user_id = auth.uid()
  ));
create policy "games_insert" on public.games for insert with check (auth.uid() = created_by_id);
create policy "games_update" on public.games for update
  using (exists (select 1 from public.game_players where game_id = games.id and user_id = auth.uid()));

-- game_players
drop policy if exists "gp_select" on public.game_players;
drop policy if exists "gp_insert" on public.game_players;
drop policy if exists "gp_update" on public.game_players;
create policy "gp_select" on public.game_players for select using (true);
create policy "gp_insert" on public.game_players for insert with check (auth.uid() = user_id);
create policy "gp_update" on public.game_players for update using (auth.uid() = user_id);

-- game_moves
drop policy if exists "gm_select" on public.game_moves;
drop policy if exists "gm_insert" on public.game_moves;
create policy "gm_select" on public.game_moves for select
  using (exists (select 1 from public.game_players where game_id = game_moves.game_id and user_id = auth.uid()));
create policy "gm_insert" on public.game_moves for insert with check (auth.uid() = user_id);

-- game_invites
drop policy if exists "gi_select" on public.game_invites;
drop policy if exists "gi_insert" on public.game_invites;
drop policy if exists "gi_update" on public.game_invites;
create policy "gi_select" on public.game_invites for select using (auth.uid() in (from_user_id, to_user_id));
create policy "gi_insert" on public.game_invites for insert with check (auth.uid() = from_user_id);
create policy "gi_update" on public.game_invites for update using (auth.uid() = to_user_id);

-- ranked_queue
drop policy if exists "rq_select" on public.ranked_queue;
drop policy if exists "rq_insert" on public.ranked_queue;
drop policy if exists "rq_update" on public.ranked_queue;
drop policy if exists "rq_delete" on public.ranked_queue;
create policy "rq_select" on public.ranked_queue for select using (auth.uid() = user_id);
create policy "rq_insert" on public.ranked_queue for insert with check (auth.uid() = user_id);
create policy "rq_update" on public.ranked_queue for update using (auth.uid() = user_id);
create policy "rq_delete" on public.ranked_queue for delete using (auth.uid() = user_id);

-- chat_messages
drop policy if exists "chat_select" on public.chat_messages;
drop policy if exists "chat_insert" on public.chat_messages;
create policy "chat_select" on public.chat_messages for select using (
  game_id is null or exists (
    select 1 from public.game_players where game_id = chat_messages.game_id and user_id = auth.uid()
  )
);
create policy "chat_insert" on public.chat_messages for insert with check (auth.uid() = user_id);

-- direct_message_threads
drop policy if exists "dmt_select" on public.direct_message_threads;
drop policy if exists "dmt_insert" on public.direct_message_threads;
drop policy if exists "dmt_update" on public.direct_message_threads;
create policy "dmt_select" on public.direct_message_threads for select using (auth.uid() in (participant1_id, participant2_id));
create policy "dmt_insert" on public.direct_message_threads for insert with check (auth.uid() in (participant1_id, participant2_id));
create policy "dmt_update" on public.direct_message_threads for update using (auth.uid() in (participant1_id, participant2_id));

-- direct_messages
drop policy if exists "dm_select" on public.direct_messages;
drop policy if exists "dm_insert" on public.direct_messages;
drop policy if exists "dm_update" on public.direct_messages;
create policy "dm_select" on public.direct_messages for select
  using (exists (select 1 from public.direct_message_threads
    where id = thread_id and auth.uid() in (participant1_id, participant2_id)));
create policy "dm_insert" on public.direct_messages for insert
  with check (auth.uid() = sender_id and exists (
    select 1 from public.direct_message_threads
    where id = thread_id and auth.uid() in (participant1_id, participant2_id)
  ));
create policy "dm_update" on public.direct_messages for update using (
  exists (select 1 from public.direct_message_threads
    where id = thread_id and auth.uid() in (participant1_id, participant2_id))
);

-- notifications
drop policy if exists "notif_all" on public.notifications;
create policy "notif_all" on public.notifications for all using (auth.uid() = user_id);

-- dictionary
drop policy if exists "dict_select" on public.dictionary_words;
create policy "dict_select" on public.dictionary_words for select using (true);

-- 5. TRIGGER – automatické vytvoření profilu při registraci
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nickname text;
begin
  v_nickname := coalesce(
    nullif(trim(new.raw_user_meta_data->>'nickname'), ''),
    split_part(new.email, '@', 1)
  );

  while exists (select 1 from public.users where nickname = v_nickname) loop
    v_nickname := v_nickname || floor(random() * 900 + 100)::text;
  end loop;

  insert into public.users (id, email, nickname, elo_rating)
  values (new.id, new.email, v_nickname, 1200)
  on conflict (id) do nothing;

  insert into public.profiles (user_id, preferred_language)
  values (new.id, 'cs')
  on conflict (user_id) do nothing;

  insert into public.statistics (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
exception when others then
  raise warning 'handle_new_user error for %: %', new.id, sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. ZPĚTNĚ VYPLNIT EXISTUJÍCÍ AUTH UŽIVATELE
-- (pro uživatele kteří se zaregistrovali před spuštěním tohoto setupu)
-- ============================================================

do $$
declare
  u record;
  v_nickname text;
begin
  for u in select id, email, raw_user_meta_data from auth.users loop
    if not exists (select 1 from public.users where id = u.id) then
      v_nickname := coalesce(
        nullif(trim(u.raw_user_meta_data->>'nickname'), ''),
        split_part(u.email, '@', 1)
      );
      while exists (select 1 from public.users where nickname = v_nickname) loop
        v_nickname := v_nickname || floor(random() * 900 + 100)::text;
      end loop;

      insert into public.users (id, email, nickname, elo_rating)
      values (u.id, u.email, v_nickname, 1200)
      on conflict do nothing;

      insert into public.profiles (user_id, preferred_language)
      values (u.id, 'cs')
      on conflict do nothing;

      insert into public.statistics (user_id)
      values (u.id)
      on conflict do nothing;

      raise notice 'Vytvořen profil pro: %', u.email;
    end if;
  end loop;
end;
$$;

-- 7. STORAGE – bucket pro avatary
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

drop policy if exists "avatars_select" on storage.objects;
drop policy if exists "avatars_insert" on storage.objects;
drop policy if exists "avatars_update" on storage.objects;
drop policy if exists "avatars_delete" on storage.objects;

create policy "avatars_select" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_insert" on storage.objects for insert with check (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "avatars_update" on storage.objects for update using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "avatars_delete" on storage.objects for delete using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================
-- HOTOVO
-- ============================================================
select 'Setup dokončen!' as status,
  (select count(*) from public.users) as pocet_uzivatelu,
  (select count(*) from public.statistics) as pocet_statistik;
