-- Apply after all existing schema files. Counts run with the caller's RLS policies.
alter table public.episode_ratings add constraint episode_ratings_episode_upper_bound
 check (episode_number <= 99999);
alter table public.episode_reviews add constraint episode_reviews_episode_upper_bound
 check (episode_number <= 99999);
alter table public.episode_favourites add constraint episode_favourites_episode_upper_bound
 check (episode_number <= 99999);
alter table public.library_entries add constraint library_entries_progress_upper_bounds
 check (episode_number <= 99999 and season_number <= 99999);
alter table public.media_snapshots add constraint media_snapshots_poster_upper_bound
 check (char_length(poster_path) <= 200);

create function public.enforce_storage_limits() returns trigger
language plpgsql security invoker volatile set search_path = '' as $$
declare
 owner_id uuid := auth.uid();
 titles_cap constant bigint := 1000;
 episode_ratings_cap constant bigint := 10000;
 season_ratings_cap constant bigint := 1000;
 episode_reviews_cap constant bigint := 2000;
 text_cap constant bigint := 1000000;
 row_growth bigint := 0;
 row_total bigint;
 row_cap bigint;
 row_limit text;
 new_bytes bigint := 0;
 old_bytes bigint := 0;
 text_total bigint;
begin
 -- Migrations and service-role account deletion have no signed-in user.
 if owner_id is null then return null; end if;
 -- Keep the lock and counts in separate statements. VOLATILE + READ COMMITTED
 -- gives each count a fresh snapshot after any preceding account writer commits.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text, 0));

 if tg_op = 'INSERT' then
  case tg_table_name
   when 'media_snapshots' then
    select count(*) into row_growth from new_rows where user_id = owner_id;
    row_limit := 'titles';
    row_cap := titles_cap;
    if row_growth > 0 then
     select count(*) into row_total from public.media_snapshots where user_id = owner_id;
    end if;
   when 'episode_ratings' then
    select count(*) into row_growth from new_rows n
     join public.library_entries e on e.id = n.entry_id where e.user_id = owner_id;
    row_limit := 'episode_ratings';
    row_cap := episode_ratings_cap;
    if row_growth > 0 then
     select count(*) into row_total from public.episode_ratings r
      join public.library_entries e on e.id = r.entry_id where e.user_id = owner_id;
    end if;
   when 'season_ratings' then
    select count(*) into row_growth from new_rows n
     join public.library_entries e on e.id = n.entry_id where e.user_id = owner_id;
    row_limit := 'season_ratings';
    row_cap := season_ratings_cap;
    if row_growth > 0 then
     select count(*) into row_total from public.season_ratings r
      join public.library_entries e on e.id = r.entry_id where e.user_id = owner_id;
    end if;
   when 'episode_reviews' then
    select count(*) into row_growth from new_rows n
     join public.library_entries e on e.id = n.entry_id where e.user_id = owner_id;
    row_limit := 'episode_reviews';
    row_cap := episode_reviews_cap;
    if row_growth > 0 then
     select count(*) into row_total from public.episode_reviews r
      join public.library_entries e on e.id = r.entry_id where e.user_id = owner_id;
    end if;
   else null; -- library_entries has text but no independent row cap.
  end case;
  if row_growth > 0 and row_total > row_cap then
   raise exception using errcode = 'MTLIM', message = row_limit;
  end if;
 end if;

 case tg_table_name
  when 'media_snapshots' then
   select coalesce(sum(octet_length(title)), 0) into new_bytes from new_rows where user_id = owner_id;
  when 'library_entries' then
   select coalesce(sum(coalesce(octet_length(episode_name), 0) + coalesce(octet_length(review), 0)), 0)
    into new_bytes from new_rows where user_id = owner_id;
   if tg_op = 'UPDATE' then
    select coalesce(sum(coalesce(octet_length(episode_name), 0) + coalesce(octet_length(review), 0)), 0)
     into old_bytes from old_rows where user_id = owner_id;
   end if;
  when 'episode_reviews' then
   select coalesce(sum(octet_length(n.review)), 0) into new_bytes from new_rows n
    join public.library_entries e on e.id = n.entry_id where e.user_id = owner_id;
   if tg_op = 'UPDATE' then
    select coalesce(sum(octet_length(o.review)), 0) into old_bytes from old_rows o
     join public.library_entries e on e.id = o.entry_id where e.user_id = owner_id;
   end if;
  else return null; -- Ratings affect only their own row limit.
 end case;
 if new_bytes > old_bytes then
  select
   coalesce((select sum(octet_length(title)) from public.media_snapshots where user_id = owner_id), 0)
   + coalesce((select sum(coalesce(octet_length(episode_name), 0) + coalesce(octet_length(review), 0))
      from public.library_entries where user_id = owner_id), 0)
   + coalesce((select sum(octet_length(r.review)) from public.episode_reviews r
      join public.library_entries e on e.id = r.entry_id where e.user_id = owner_id), 0)
   into text_total;
  if text_total > text_cap then
   raise exception using errcode = 'MTLIM', message = 'text';
  end if;
 end if;
 return null;
end;
$$;
revoke all on function public.enforce_storage_limits() from public, anon, authenticated;

-- One event per trigger: transition tables cannot use multi-event or UPDATE OF triggers.
create trigger media_snapshots_storage_insert after insert on public.media_snapshots
 referencing new table as new_rows for each statement execute function public.enforce_storage_limits();
create trigger library_entries_storage_insert after insert on public.library_entries
 referencing new table as new_rows for each statement execute function public.enforce_storage_limits();
create trigger library_entries_storage_update after update on public.library_entries
 referencing old table as old_rows new table as new_rows for each statement execute function public.enforce_storage_limits();
create trigger episode_ratings_storage_insert after insert on public.episode_ratings
 referencing new table as new_rows for each statement execute function public.enforce_storage_limits();
create trigger season_ratings_storage_insert after insert on public.season_ratings
 referencing new table as new_rows for each statement execute function public.enforce_storage_limits();
create trigger episode_reviews_storage_insert after insert on public.episode_reviews
 referencing new table as new_rows for each statement execute function public.enforce_storage_limits();
create trigger episode_reviews_storage_update after update on public.episode_reviews
 referencing old table as old_rows new table as new_rows for each statement execute function public.enforce_storage_limits();
