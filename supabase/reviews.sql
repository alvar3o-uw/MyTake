-- One private review per saved media entry; scores and progress remain independent.
alter table public.library_entries add column review text
  check (review is null or (length(btrim(review)) > 0 and length(review) <= 10000));
grant update (review) on public.library_entries to authenticated;

-- Reviews need no corresponding episode score.
create table public.episode_reviews (
  entry_id uuid not null references public.library_entries(id) on delete cascade,
  episode_id integer not null check (episode_id > 0),
  season_number integer not null check (season_number between 0 and 99999),
  episode_number integer not null check (episode_number >= 0),
  review text not null check (length(btrim(review)) > 0 and length(review) <= 10000),
  primary key (entry_id, episode_id),
  unique (entry_id, season_number, episode_number)
);
alter table public.episode_reviews enable row level security;
revoke all on public.episode_reviews from anon, authenticated;
grant select, insert, delete on public.episode_reviews to authenticated;
grant update (review) on public.episode_reviews to authenticated;
create policy "Read own episode reviews" on public.episode_reviews for select to authenticated using (
 exists(select 1 from public.library_entries e where e.id=entry_id and e.user_id=(select auth.uid()) and e.media_type='tv')
);
create policy "Insert own episode reviews" on public.episode_reviews for insert to authenticated with check (
 exists(select 1 from public.library_entries e where e.id=entry_id and e.user_id=(select auth.uid()) and e.media_type='tv')
);
create policy "Update own episode reviews" on public.episode_reviews for update to authenticated using (
 exists(select 1 from public.library_entries e where e.id=entry_id and e.user_id=(select auth.uid()) and e.media_type='tv')
) with check (
 exists(select 1 from public.library_entries e where e.id=entry_id and e.user_id=(select auth.uid()) and e.media_type='tv')
);
create policy "Delete own episode reviews" on public.episode_reviews for delete to authenticated using (
 exists(select 1 from public.library_entries e where e.id=entry_id and e.user_id=(select auth.uid()) and e.media_type='tv')
);
create function public.save_episode_review(p_entry_id uuid, p_episode_id integer, p_season_number integer, p_episode_number integer, p_review text)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.library_entries where id=p_entry_id and user_id=auth.uid() and media_type='tv') then
  raise insufficient_privilege using message='Saved show required';
 end if;
 if p_review is null then
  delete from public.episode_reviews where entry_id=p_entry_id and episode_id=p_episode_id;
 else
  insert into public.episode_reviews(entry_id,episode_id,season_number,episode_number,review)
  values(p_entry_id,p_episode_id,p_season_number,p_episode_number,p_review)
  on conflict(entry_id,episode_id) do update set review=excluded.review;
 end if;
end;
$$;
revoke all on function public.save_episode_review(uuid,integer,integer,integer,text) from public,anon,authenticated;
grant execute on function public.save_episode_review(uuid,integer,integer,integer,text) to authenticated;
