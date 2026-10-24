-- Catalogue snapshots are separate from opinions and private to each account.
-- No timestamps: library ordering is based on rating or title.
create table public.media_snapshots (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null check (tmdb_id > 0),
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null check (length(btrim(title)) between 1 and 500),
  release_year text not null default '' check (release_year = '' or release_year ~ '^[0-9]{4}$'),
  poster_path text check (poster_path is null or poster_path ~ '^/[a-zA-Z0-9._-]+$'),
  unique (user_id, tmdb_id, media_type),
  unique (id, user_id, media_type)
);
create table public.library_entries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  media_id uuid not null unique,
  media_type text not null check (media_type in ('movie', 'tv')),
  rating numeric check (rating is null or (rating between 0 and 10 and rating = round(rating, 1))),
  viewing_status text not null check (viewing_status in ('in_progress', 'completed')),
  episode_id integer,
  season_number integer,
  episode_number integer,
  episode_name text,
  constraint library_entries_media_fkey foreign key (media_id, user_id, media_type)
    references public.media_snapshots(id, user_id, media_type) on delete cascade,
  constraint library_entries_progress_check check (
    (episode_id is null and season_number is null and episode_number is null and episode_name is null)
    or (media_type = 'tv' and viewing_status = 'in_progress'
      and episode_id is not null and episode_id > 0
      and season_number is not null and season_number >= 0
      and episode_number is not null and episode_number >= 0
      and episode_name is not null and length(episode_name) <= 500)
  )
);
create index library_entries_user_idx on public.library_entries(user_id);
create index library_entries_media_owner_type_idx on public.library_entries(media_id,user_id,media_type);

alter table public.media_snapshots enable row level security;
alter table public.library_entries enable row level security;
revoke all on public.media_snapshots, public.library_entries from anon, authenticated;
grant select, insert on public.media_snapshots, public.library_entries to authenticated;
grant delete on public.media_snapshots to authenticated;
create policy "Read own media snapshots" on public.media_snapshots
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own media snapshots" on public.media_snapshots
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Read own library entries" on public.library_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own library entries" on public.library_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Delete own media snapshots" on public.media_snapshots
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Both inserts succeed together or neither is saved. RLS still applies.
create function public.save_library_entry(
  p_entry_id uuid, p_tmdb_id integer, p_media_type text, p_title text,
  p_release_year text, p_poster_path text, p_rating numeric, p_viewing_status text,
  p_episode_id integer default null, p_season_number integer default null,
  p_episode_number integer default null, p_episode_name text default null
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null then raise insufficient_privilege using message = 'Sign in required'; end if;
  -- Repeating the same confirmed request does not create another entry.
  if exists (select 1 from public.library_entries where id = p_entry_id and user_id = owner_id) then
    return p_entry_id;
  end if;
  insert into public.media_snapshots(id, user_id, tmdb_id, media_type, title, release_year, poster_path)
    values(p_entry_id, owner_id, p_tmdb_id, p_media_type, p_title, p_release_year, p_poster_path);
  insert into public.library_entries(id, user_id, media_id, media_type, rating, viewing_status,
    episode_id, season_number, episode_number, episode_name)
    values(p_entry_id, owner_id, p_entry_id, p_media_type, p_rating, p_viewing_status,
      p_episode_id, p_season_number, p_episode_number, p_episode_name);
  return p_entry_id;
end;
$$;
revoke all on function public.save_library_entry(uuid, integer, text, text, text, text, numeric, text, integer, integer, integer, text) from public, anon, authenticated;
grant execute on function public.save_library_entry(uuid, integer, text, text, text, text, numeric, text, integer, integer, integer, text) to authenticated;
