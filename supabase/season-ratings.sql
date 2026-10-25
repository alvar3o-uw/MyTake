-- Season opinions are independent of episode and overall show scores.
create table public.season_ratings (
  entry_id uuid not null references public.library_entries(id) on delete cascade,
  season_number integer not null check (season_number between 0 and 99999),
  rating numeric not null check (rating between 0 and 10 and rating = round(rating,1)),
  primary key (entry_id,season_number)
);
alter table public.season_ratings enable row level security;
revoke all on public.season_ratings from anon,authenticated;
grant select,insert,delete on public.season_ratings to authenticated;
grant update(rating) on public.season_ratings to authenticated;
create policy "Read own season ratings" on public.season_ratings for select to authenticated using (
 exists(select 1 from public.library_entries e where e.id=entry_id and e.user_id=(select auth.uid()) and e.media_type='tv')
);
create policy "Insert own season ratings" on public.season_ratings for insert to authenticated with check (
 exists(select 1 from public.library_entries e where e.id=entry_id and e.user_id=(select auth.uid()) and e.media_type='tv')
);
create policy "Update own season ratings" on public.season_ratings for update to authenticated using (
 exists(select 1 from public.library_entries e where e.id=entry_id and e.user_id=(select auth.uid()) and e.media_type='tv')
) with check (
 exists(select 1 from public.library_entries e where e.id=entry_id and e.user_id=(select auth.uid()) and e.media_type='tv')
);
create policy "Delete own season ratings" on public.season_ratings for delete to authenticated using (
 exists(select 1 from public.library_entries e where e.id=entry_id and e.user_id=(select auth.uid()) and e.media_type='tv')
);
create function public.save_season_rating(p_entry_id uuid,p_season_number integer,p_rating numeric)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.library_entries where id=p_entry_id and user_id=auth.uid() and media_type='tv') then
  raise insufficient_privilege using message='Saved show required';
 end if;
 if p_rating is null then
  delete from public.season_ratings where entry_id=p_entry_id and season_number=p_season_number;
 else
  insert into public.season_ratings(entry_id,season_number,rating) values(p_entry_id,p_season_number,p_rating)
  on conflict(entry_id,season_number) do update set rating=excluded.rating;
 end if;
end;
$$;
revoke all on function public.save_season_rating(uuid,integer,numeric) from public,anon,authenticated;
grant execute on function public.save_season_rating(uuid,integer,numeric) to authenticated;
