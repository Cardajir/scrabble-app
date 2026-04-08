-- users
alter table public.users enable row level security;
create policy "Veřejné čtení profilů" on public.users for select using (true);
create policy "Vlastní úprava" on public.users for update using (auth.uid() = id);
create policy "Vložení vlastního profilu" on public.users for insert with check (auth.uid() = id);

-- profiles
alter table public.profiles enable row level security;
create policy "Veřejné čtení profilů" on public.profiles for select using (true);
create policy "Vlastní úprava profilu" on public.profiles for update using (
  auth.uid() = user_id
);
create policy "Vložení vlastního profilu" on public.profiles for insert with check (
  auth.uid() = user_id
);

-- statistics
alter table public.statistics enable row level security;
create policy "Veřejné čtení statistik" on public.statistics for select using (true);
create policy "Vlastní úprava statistik" on public.statistics for update using (
  auth.uid() = user_id
);
create policy "Vložení vlastních statistik" on public.statistics for insert with check (
  auth.uid() = user_id
);

-- elo_history
alter table public.elo_history enable row level security;
create policy "Vlastní čtení ELO historie" on public.elo_history for select using (
  auth.uid() = user_id
);
create policy "Vložení ELO záznamu" on public.elo_history for insert with check (true);

-- games
alter table public.games enable row level security;
create policy "Čtení veřejných her" on public.games for select
  using (is_private = false or exists (
    select 1 from public.game_players where game_id = games.id and user_id = auth.uid()
  ));
create policy "Vytvoření hry" on public.games for insert with check (auth.uid() = created_by_id);
create policy "Aktualizace vlastní hry" on public.games for update
  using (exists (select 1 from public.game_players where game_id = games.id and user_id = auth.uid()));

-- game_players
alter table public.game_players enable row level security;
create policy "Čtení hráčů hry" on public.game_players for select
  using (true);
create policy "Přidání hráče" on public.game_players for insert with check (
  auth.uid() = user_id
);
create policy "Úprava vlastního záznamu" on public.game_players for update using (
  auth.uid() = user_id
);

-- game_moves
alter table public.game_moves enable row level security;
create policy "Čtení tahů" on public.game_moves for select
  using (exists (select 1 from public.game_players where game_id = game_moves.game_id and user_id = auth.uid()));
create policy "Vložení tahu" on public.game_moves for insert with check (
  auth.uid() = user_id
);

-- game_invites
alter table public.game_invites enable row level security;
create policy "Čtení vlastních pozvánek" on public.game_invites for select using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);
create policy "Vytvoření pozvánky" on public.game_invites for insert with check (
  auth.uid() = from_user_id
);
create policy "Aktualizace pozvánky" on public.game_invites for update using (
  auth.uid() = to_user_id
);

-- ranked_queue
alter table public.ranked_queue enable row level security;
create policy "Čtení fronty" on public.ranked_queue for select using (auth.uid() = user_id);
create policy "Vstup do fronty" on public.ranked_queue for insert with check (auth.uid() = user_id);
create policy "Aktualizace fronty" on public.ranked_queue for update using (auth.uid() = user_id);
create policy "Odchod z fronty" on public.ranked_queue for delete using (auth.uid() = user_id);

-- chat_messages
alter table public.chat_messages enable row level security;
create policy "Čtení zpráv" on public.chat_messages for select using (
  game_id is null or exists (
    select 1 from public.game_players where game_id = chat_messages.game_id and user_id = auth.uid()
  )
);
create policy "Psaní zpráv" on public.chat_messages for insert with check (auth.uid() = user_id);

-- direct_message_threads
alter table public.direct_message_threads enable row level security;
create policy "Čtení vlastních vláken" on public.direct_message_threads for select using (
  auth.uid() = participant1_id or auth.uid() = participant2_id
);
create policy "Vytvoření vlákna" on public.direct_message_threads for insert with check (
  auth.uid() = participant1_id or auth.uid() = participant2_id
);
create policy "Aktualizace vlákna" on public.direct_message_threads for update using (
  auth.uid() = participant1_id or auth.uid() = participant2_id
);

-- direct_messages
alter table public.direct_messages enable row level security;
create policy "Čtení DM" on public.direct_messages for select
  using (exists (select 1 from public.direct_message_threads
    where id = thread_id and (participant1_id = auth.uid() or participant2_id = auth.uid())));
create policy "Psaní DM" on public.direct_messages for insert
  with check (auth.uid() = sender_id and exists (
    select 1 from public.direct_message_threads
    where id = thread_id and (participant1_id = auth.uid() or participant2_id = auth.uid())
  ));
create policy "Označení jako přečtené" on public.direct_messages for update using (
  exists (select 1 from public.direct_message_threads
    where id = thread_id and (participant1_id = auth.uid() or participant2_id = auth.uid()))
);

-- notifications
alter table public.notifications enable row level security;
create policy "Vlastní notifikace" on public.notifications for all using (auth.uid() = user_id);

-- dictionary
alter table public.dictionary_words enable row level security;
create policy "Veřejné čtení slovníku" on public.dictionary_words for select using (true);
