-- Uživatelé (navázáno na Supabase Auth)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nickname text not null unique,
  avatar_url text,
  elo_rating integer not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profily
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  bio text,
  country text,
  preferred_language text default 'cs'
);

-- Statistiky
create table public.statistics (
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

-- Historie ELO
create table public.elo_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  elo_change integer not null,
  elo_before integer not null,
  elo_after integer not null,
  game_id uuid,
  created_at timestamptz not null default now()
);

-- Hry
create table public.games (
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

-- Hráči ve hře
create table public.game_players (
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

-- Herní tahy
create table public.game_moves (
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

-- Pozvánky do her
create table public.game_invites (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  from_user_id uuid not null references public.users(id),
  to_user_id uuid not null references public.users(id),
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

-- Ranked matchmaking fronta
create table public.ranked_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id),
  elo_rating integer not null,
  status text not null default 'WAITING' check (status in ('WAITING', 'MATCHED', 'CANCELLED')),
  search_range_min integer not null,
  search_range_max integer not null,
  joined_at timestamptz not null default now(),
  matched_at timestamptz
);

-- Zprávy globálního a herního chatu
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  user_id uuid not null references public.users(id),
  content text not null check (char_length(content) <= 500),
  created_at timestamptz not null default now()
);

-- DM vlákna
create table public.direct_message_threads (
  id uuid primary key default gen_random_uuid(),
  participant1_id uuid not null references public.users(id),
  participant2_id uuid not null references public.users(id),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(participant1_id, participant2_id)
);

-- Přímé zprávy
create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.direct_message_threads(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  content text not null check (char_length(content) <= 500),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Slovník
create table public.dictionary_words (
  id uuid primary key default gen_random_uuid(),
  word text not null unique,
  length integer not null generated always as (char_length(word)) stored,
  is_valid boolean not null default true
);

-- Notifikace
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('GAME_INVITE', 'GAME_START', 'GAME_END', 'DM', 'SYSTEM')),
  title text not null,
  body text not null,
  is_read boolean not null default false,
  related_id uuid,
  created_at timestamptz not null default now()
);

-- Trigger pro aktualizaci updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at_column();

create trigger update_games_updated_at
  before update on public.games
  for each row execute function public.update_updated_at_column();
