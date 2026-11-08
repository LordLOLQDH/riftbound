drop policy if exists "Players read own RIFTBOUND saves" on public.riftbound_player_saves;
create policy "Players read own RIFTBOUND saves" on public.riftbound_player_saves
  for select to authenticated
  using ((select auth.uid()) = user_id and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false);

drop policy if exists "Players create own RIFTBOUND saves" on public.riftbound_player_saves;
create policy "Players create own RIFTBOUND saves" on public.riftbound_player_saves
  for insert to authenticated
  with check ((select auth.uid()) = user_id and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false);

drop policy if exists "Players update own RIFTBOUND saves" on public.riftbound_player_saves;
create policy "Players update own RIFTBOUND saves" on public.riftbound_player_saves
  for update to authenticated
  using ((select auth.uid()) = user_id and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false)
  with check ((select auth.uid()) = user_id and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false);

drop policy if exists "Players delete own RIFTBOUND saves" on public.riftbound_player_saves;
create policy "Players delete own RIFTBOUND saves" on public.riftbound_player_saves
  for delete to authenticated
  using ((select auth.uid()) = user_id and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false);
