-- One favourite per saved show, independent of episode ratings.
create table public.episode_favourites (
  entry_id uuid primary key references public.library_entries(id) on delete cascade,
  episode_id integer not null check (episode_id > 0),
  season_number integer not null check (season_number between 0 and 99999),
  episode_number integer not null check (episode_number >= 0)
);
alter table public.episode_favourites enable row level security;
revoke all on public.episode_favourites from anon, authenticated;
grant select, insert, delete on public.episode_favourites to authenticated;
grant update (episode_id, season_number, episode_number) on public.episode_favourites to authenticated;
create policy "Read own favourite episode" on public.episode_favourites for select to authenticated using (
 exists(select 1 from public.library_entries e where e.id=entry_id and e.user_id=(select auth.uid()) and e.media_type='tv')
);
create policy "Insert own favourite episode" on public.episode_favourites for insert to authenticated with check (
 exists(select 1 from public.library_entries e where e.id=entry_id and e.user_id=(select auth.uid()) and e.media_type='tv')
);
create policy "Update own favourite episode" on public.episode_favourites for update to authenticated using (
 exists(select 1 from public.library_entries e where e.id=entry_id and e.user_id=(select auth.uid()) and e.media_type='tv')
) with check (
 exists(select 1 from public.library_entries e where e.id=entry_id and e.user_id=(select auth.uid()) and e.media_type='tv')
);
create policy "Delete own favourite episode" on public.episode_favourites for delete to authenticated using (
 exists(select 1 from public.library_entries e where e.id=entry_id and e.user_id=(select auth.uid()) and e.media_type='tv')
);
create function public.set_favourite_episode(p_entry_id uuid, p_episode_id integer, p_season_number integer, p_episode_number integer)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.library_entries where id=p_entry_id and user_id=auth.uid() and media_type='tv') then
  raise insufficient_privilege using message='Saved show required';
 end if;
 if p_episode_id is null then
  delete from public.episode_favourites where entry_id=p_entry_id;
 else
  insert into public.episode_favourites(entry_id,episode_id,season_number,episode_number)
  values(p_entry_id,p_episode_id,p_season_number,p_episode_number)
  on conflict(entry_id) do update set episode_id=excluded.episode_id,season_number=excluded.season_number,episode_number=excluded.episode_number;
 end if;
end;
$$;
revoke all on function public.set_favourite_episode(uuid,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.set_favourite_episode(uuid,integer,integer,integer) to authenticated;
