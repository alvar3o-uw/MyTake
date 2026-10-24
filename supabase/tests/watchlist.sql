begin;
select set_config('mytake.watch_a',gen_random_uuid()::text,true);
select set_config('mytake.watch_b',gen_random_uuid()::text,true);
select set_config('mytake.watch_entry',gen_random_uuid()::text,true);
select set_config('mytake.watch_entry_b',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('mytake.watch_a')::uuid),(current_setting('mytake.watch_b')::uuid);
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.watch_a'),'role','authenticated')::text,true);
select public.save_watchlist_entry(current_setting('mytake.watch_entry')::uuid,999030,'tv','Watchlist fixture','2022',null);
select public.save_watchlist_entry(current_setting('mytake.watch_entry')::uuid,999030,'tv','Watchlist fixture','2022',null);
do $$
begin
 if (select count(*) from public.watchlist_entries)<>1 then raise exception 'Watchlist retry/owner read failed'; end if;
 if (select count(*) from public.library_entries)<>0 then raise exception 'Watchlist created library entry'; end if;
 begin
  perform public.save_watchlist_entry(gen_random_uuid(),999030,'tv','Duplicate','',null);
  raise exception 'Duplicate watchlist title allowed';
 exception when unique_violation then null; end;
 begin
  perform public.save_library_entry(gen_random_uuid(),999030,'tv','Dual membership','',null,8,'completed');
  raise exception 'Same title allowed in both lists';
 exception when unique_violation then null; end;
 begin
  insert into public.library_entries(id,user_id,media_id,media_type,rating,viewing_status) values(gen_random_uuid(),current_setting('mytake.watch_a')::uuid,current_setting('mytake.watch_entry')::uuid,'tv',8,'completed');
  raise exception 'Direct insert bypassed collection';
 exception when foreign_key_violation then null; end;
 begin
  perform public.move_watchlist_to_library(current_setting('mytake.watch_entry')::uuid,8.85,'completed');
  raise exception 'Invalid move rating allowed';
 exception when check_violation then null; end;
 if not exists(select 1 from public.watchlist_entries where id=current_setting('mytake.watch_entry')::uuid) then raise exception 'Failed move lost watchlist entry'; end if;
 if not exists(select 1 from public.media_snapshots where id=current_setting('mytake.watch_entry')::uuid and collection='watchlist') then raise exception 'Failed move changed collection'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.watch_b'),'role','authenticated')::text,true);
select public.save_watchlist_entry(current_setting('mytake.watch_entry_b')::uuid,999030,'tv','Independent fixture','',null);
do $$
declare affected integer;
begin
 if (select count(*) from public.watchlist_entries)<>1 then raise exception 'Cross-account read leaked'; end if;
 delete from public.watchlist_entries where id=current_setting('mytake.watch_entry')::uuid;
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Cross-account deletion allowed'; end if;
 begin
  perform public.move_watchlist_to_library(current_setting('mytake.watch_entry')::uuid,1,'completed');
  raise exception 'Cross-account move allowed';
 exception when no_data_found then null; end;
 begin
  insert into public.watchlist_entries(id,user_id,media_id,media_type) values(gen_random_uuid(),current_setting('mytake.watch_a')::uuid,current_setting('mytake.watch_entry')::uuid,'tv');
  raise exception 'Spoofed owner allowed';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.watch_a'),'role','authenticated')::text,true);
select public.move_watchlist_to_library(current_setting('mytake.watch_entry')::uuid,8.8,'in_progress',12345,0,3,'Special fixture');
select public.move_watchlist_to_library(current_setting('mytake.watch_entry')::uuid,1,'completed');
do $$
begin
 if (select count(*) from public.watchlist_entries)<>0 then raise exception 'Moved title remained on watchlist'; end if;
 if (select count(*) from public.library_entries)<>1 then raise exception 'Move/retry created wrong library count'; end if;
 if not exists(select 1 from public.library_entries where rating=8.8 and season_number=0 and episode_number=3) then raise exception 'Move lost rating/progress or retry overwrote it'; end if;
 begin
  perform public.save_watchlist_entry(gen_random_uuid(),999030,'tv','Already in library','',null);
  raise exception 'Library title re-added to watchlist';
 exception when unique_violation then null; end;
end $$;
reset role;
do $$
begin
 if has_table_privilege('anon','public.watchlist_entries','select') or has_table_privilege('anon','public.watchlist_entries','insert') or has_table_privilege('anon','public.watchlist_entries','delete') then raise exception 'Anonymous access'; end if;
 if has_function_privilege('anon','public.move_watchlist_to_library(uuid,numeric,text,integer,integer,integer,text)','execute') then raise exception 'Anonymous move'; end if;
 delete from auth.users where id=current_setting('mytake.watch_a')::uuid;
 if exists(select 1 from public.media_snapshots where user_id=current_setting('mytake.watch_a')::uuid) then raise exception 'Account cascade failed'; end if;
 if not exists(select 1 from public.watchlist_entries where id=current_setting('mytake.watch_entry_b')::uuid) then raise exception 'Other account affected'; end if;
 delete from public.media_snapshots where id=current_setting('mytake.watch_entry_b')::uuid;
 if exists(select 1 from public.watchlist_entries where id=current_setting('mytake.watch_entry_b')::uuid) then raise exception 'Watchlist removal cascade failed'; end if;
end $$;
select 'Passed: private watchlist, duplicates, exclusivity, atomic move rollback, ratings/progress, safe retry, cross-account denial, removal/account cascades and anonymous denial. Fixtures rolled back.' as result;
rollback;
