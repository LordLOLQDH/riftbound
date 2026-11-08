create table if not exists public.riftbound_player_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot smallint not null default 1 check (slot between 1 and 3),
  save_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint riftbound_player_saves_user_slot_unique unique (user_id, slot)
);
alter table public.riftbound_player_saves enable row level security;
grant select, insert, update, delete on public.riftbound_player_saves to authenticated;
create policy "Players read own RIFTBOUND saves" on public.riftbound_player_saves
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Players create own RIFTBOUND saves" on public.riftbound_player_saves
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Players update own RIFTBOUND saves" on public.riftbound_player_saves
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Players delete own RIFTBOUND saves" on public.riftbound_player_saves
  for delete to authenticated using ((select auth.uid()) = user_id);
