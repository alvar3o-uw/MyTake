-- Ratings belong to a private saved TV entry; no shared opinions or progress dependency.
create table public.episode_ratings (
  entry_id uuid not null references public.library_entries(id) on delete cascade,
  episode_id integer not null check (episode_id > 0),
  season_number integer not null check (season_number between 0 and 99999),
  episode_number integer not null check (episode_number >= 0),
  rating numeric not null check (rating between 0 and 10 and rating = round(rating, 1)),
  primary key (entry_id, episode_id),
  unique (entry_id, season_number, episode_number)
);
alter table public.episode_ratings enable row level security;
revoke all on public.episode_ratings from anon, authenticated;
grant select, insert, delete on public.episode_ratings to authenticated;
grant update (rating) on public.episode_ratings to authenticated;
create policy "Read own episode ratings" on public.episode_ratings for select to authenticated using (
  exists (select 1 from public.library_entries e where e.id = entry_id and e.user_id = (select auth.uid()) and e.media_type = 'tv')
);
create policy "Insert own episode ratings" on public.episode_ratings for insert to authenticated with check (
  exists (select 1 from public.library_entries e where e.id = entry_id and e.user_id = (select auth.uid()) and e.media_type = 'tv')
);
create policy "Update own episode ratings" on public.episode_ratings for update to authenticated using (
  exists (select 1 from public.library_entries e where e.id = entry_id and e.user_id = (select auth.uid()) and e.media_type = 'tv')
) with check (
  exists (select 1 from public.library_entries e where e.id = entry_id and e.user_id = (select auth.uid()) and e.media_type = 'tv')
);
create policy "Delete own episode ratings" on public.episode_ratings for delete to authenticated using (
  exists (select 1 from public.library_entries e where e.id = entry_id and e.user_id = (select auth.uid()) and e.media_type = 'tv')
);
create function public.save_episode_rating(p_entry_id uuid, p_episode_id integer, p_season_number integer, p_episode_number integer, p_rating numeric)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from public.library_entries where id = p_entry_id and user_id = auth.uid() and media_type = 'tv') then
    raise insufficient_privilege using message = 'Saved show required';
  end if;
  if p_rating is null then
    delete from public.episode_ratings where entry_id = p_entry_id and episode_id = p_episode_id;
  else
    insert into public.episode_ratings(entry_id, episode_id, season_number, episode_number, rating)
    values(p_entry_id, p_episode_id, p_season_number, p_episode_number, p_rating)
    on conflict (entry_id, episode_id) do update set rating = excluded.rating;
  end if;
end;
$$;
revoke all on function public.save_episode_rating(uuid, integer, integer, integer, numeric) from public, anon, authenticated;
grant execute on function public.save_episode_rating(uuid, integer, integer, integer, numeric) to authenticated;
