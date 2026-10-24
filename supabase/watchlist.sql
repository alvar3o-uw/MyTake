-- A snapshot belongs to exactly one collection. Child foreign keys enforce this.
alter table public.media_snapshots add column collection text not null default 'library'
  check (collection in ('library','watchlist'));
alter table public.media_snapshots add constraint media_snapshots_collection_key unique(id,user_id,media_type,collection);
alter table public.library_entries add column collection text not null default 'library' check (collection='library');
alter table public.library_entries drop constraint library_entries_media_fkey;
alter table public.library_entries add constraint library_entries_media_fkey foreign key(media_id,user_id,media_type,collection)
  references public.media_snapshots(id,user_id,media_type,collection) on delete cascade;
drop index public.library_entries_media_owner_type_idx;
create index library_entries_media_owner_type_idx on public.library_entries(media_id,user_id,media_type,collection);
create table public.watchlist_entries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  media_id uuid not null unique,
  media_type text not null check (media_type in ('movie','tv')),
  collection text not null default 'watchlist' check (collection='watchlist'),
  constraint watchlist_entries_media_fkey foreign key(media_id,user_id,media_type,collection)
    references public.media_snapshots(id,user_id,media_type,collection) on delete cascade
);
create index watchlist_entries_user_idx on public.watchlist_entries(user_id);
create index watchlist_entries_media_owner_type_idx on public.watchlist_entries(media_id,user_id,media_type,collection);
alter table public.watchlist_entries enable row level security;
revoke all on public.watchlist_entries from anon,authenticated;
grant select,insert,delete on public.watchlist_entries to authenticated;
create policy "Read own watchlist" on public.watchlist_entries for select to authenticated using ((select auth.uid())=user_id);
create policy "Insert own watchlist" on public.watchlist_entries for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Delete own watchlist" on public.watchlist_entries for delete to authenticated using ((select auth.uid())=user_id);
grant update(collection) on public.media_snapshots to authenticated;
create policy "Move own media snapshots" on public.media_snapshots for update to authenticated
  using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create function public.save_watchlist_entry(p_entry_id uuid,p_tmdb_id integer,p_media_type text,p_title text,p_release_year text,p_poster_path text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare owner_id uuid := auth.uid();
begin
 if owner_id is null then raise insufficient_privilege using message='Sign in required'; end if;
 if exists(select 1 from public.watchlist_entries where id=p_entry_id and user_id=owner_id) then return p_entry_id; end if;
 insert into public.media_snapshots(id,user_id,tmdb_id,media_type,title,release_year,poster_path,collection)
 values(p_entry_id,owner_id,p_tmdb_id,p_media_type,p_title,p_release_year,p_poster_path,'watchlist');
 insert into public.watchlist_entries(id,user_id,media_id,media_type) values(p_entry_id,owner_id,p_entry_id,p_media_type);
 return p_entry_id;
end;
$$;
revoke all on function public.save_watchlist_entry(uuid,integer,text,text,text,text) from public,anon,authenticated;
grant execute on function public.save_watchlist_entry(uuid,integer,text,text,text,text) to authenticated;

create function public.move_watchlist_to_library(p_entry_id uuid,p_rating numeric,p_viewing_status text,
 p_episode_id integer default null,p_season_number integer default null,p_episode_number integer default null,p_episode_name text default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare owner_id uuid := auth.uid(); target_media uuid; target_type text;
begin
 if owner_id is null then raise insufficient_privilege using message='Sign in required'; end if;
 if exists(select 1 from public.library_entries where id=p_entry_id and user_id=owner_id) then return p_entry_id; end if;
 delete from public.watchlist_entries where id=p_entry_id and user_id=owner_id returning media_id,media_type into target_media,target_type;
 if target_media is null then
  -- A concurrent retry may have completed while this transaction waited.
  if exists(select 1 from public.library_entries where id=p_entry_id and user_id=owner_id) then return p_entry_id; end if;
  raise no_data_found using message='Watchlist entry not found';
 end if;
 update public.media_snapshots set collection='library' where id=target_media and user_id=owner_id;
 insert into public.library_entries(id,user_id,media_id,media_type,rating,viewing_status,episode_id,season_number,episode_number,episode_name)
 values(p_entry_id,owner_id,target_media,target_type,p_rating,p_viewing_status,p_episode_id,p_season_number,p_episode_number,p_episode_name);
 return p_entry_id;
end;
$$;
revoke all on function public.move_watchlist_to_library(uuid,numeric,text,integer,integer,integer,text) from public,anon,authenticated;
grant execute on function public.move_watchlist_to_library(uuid,numeric,text,integer,integer,integer,text) to authenticated;
