-- Permit edits to personal opinions/progress only; identity and ownership are immutable.
grant update (rating, viewing_status, episode_id, season_number, episode_number, episode_name)
  on public.library_entries to authenticated;
create policy "Update own library entries" on public.library_entries
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
