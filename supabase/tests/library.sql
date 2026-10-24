begin;
select set_config('mytake.test_a', gen_random_uuid()::text, true);
select set_config('mytake.test_b', gen_random_uuid()::text, true);
select set_config('mytake.test_entry', gen_random_uuid()::text, true);
insert into auth.users(id) values(current_setting('mytake.test_a')::uuid), (current_setting('mytake.test_b')::uuid);
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('mytake.test_a'), 'role', 'authenticated')::text, true);
select public.save_library_entry(current_setting('mytake.test_entry')::uuid, 999001, 'tv', 'Library fixture', '2019', '/fixture.jpg', 8.8, 'in_progress', 12345, 1, 3, 'Episode three');
select public.save_library_entry(current_setting('mytake.test_entry')::uuid, 999001, 'tv', 'Library fixture', '2019', '/fixture.jpg', 8.8, 'in_progress', 12345, 1, 3, 'Episode three');
select public.save_library_entry(gen_random_uuid(), 999002, 'movie', 'Zero fixture', '', null, 0, 'completed');
select public.save_library_entry(gen_random_uuid(), 999003, 'movie', 'Unrated fixture', '', null, null, 'in_progress');
do $$
begin
  if (select count(*) from public.library_entries) <> 3 then raise exception 'Owner read/idempotency failed'; end if;
  if (select count(*) from public.media_snapshots) <> 3 then raise exception 'Owner metadata read failed'; end if;
  if not exists(select 1 from public.library_entries where rating = 0) then raise exception 'Zero score lost'; end if;
  if not exists(select 1 from public.library_entries where rating is null) then raise exception 'Unrated lost'; end if;
  if not exists(select 1 from public.library_entries where rating = 8.8 and season_number = 1 and episode_number = 3) then raise exception 'Progress lost'; end if;
  begin
    perform public.save_library_entry(gen_random_uuid(), 999001, 'tv', 'Duplicate', '', null, 1, 'completed');
    raise exception 'Duplicate title allowed';
  exception when unique_violation then null; end;
  begin
    perform public.save_library_entry(gen_random_uuid(), 999004, 'movie', 'Invalid precision', '', null, 8.85, 'completed');
    raise exception 'Invalid precision allowed';
  exception when check_violation then null; end;
  begin
    perform public.save_library_entry(gen_random_uuid(), 999005, 'movie', 'Invalid range', '', null, 10.1, 'completed');
    raise exception 'Invalid range allowed';
  exception when check_violation then null; end;
  begin
    perform public.save_library_entry(gen_random_uuid(), 999006, 'movie', 'Invalid progress', '', null, 1, 'in_progress', 1, 1, 1, 'No movie episodes');
    raise exception 'Movie progress allowed';
  exception when check_violation then null; end;
  begin
    perform public.save_library_entry(gen_random_uuid(), 999007, 'tv', 'Invalid completed', '', null, 1, 'completed', 1, 1, 1, 'No completed progress');
    raise exception 'Completed progress allowed';
  exception when check_violation then null; end;
  if (select count(*) from public.media_snapshots) <> 3 then raise exception 'Failed saves left orphan media'; end if;
end $$;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('mytake.test_b'), 'role', 'authenticated')::text, true);
do $$
begin
  if (select count(*) from public.library_entries) <> 0 then raise exception 'Cross-account entries leaked'; end if;
  if (select count(*) from public.media_snapshots) <> 0 then raise exception 'Cross-account metadata leaked'; end if;
  begin
    insert into public.media_snapshots(id,user_id,tmdb_id,media_type,title) values(gen_random_uuid(),current_setting('mytake.test_a')::uuid,1,'movie','Spoof');
    raise exception 'Spoofed metadata owner allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.library_entries(id,user_id,media_id,media_type,rating,viewing_status) values(gen_random_uuid(),current_setting('mytake.test_a')::uuid,current_setting('mytake.test_entry')::uuid,'tv',1,'completed');
    raise exception 'Spoofed entry owner allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.library_entries(id,user_id,media_id,media_type,rating,viewing_status) values(gen_random_uuid(),current_setting('mytake.test_b')::uuid,current_setting('mytake.test_entry')::uuid,'tv',1,'completed');
    raise exception 'Referenced another account metadata';
  exception when foreign_key_violation or unique_violation then null; end;
  begin
    update public.library_entries set user_id=current_setting('mytake.test_b')::uuid;
    raise exception 'Unexpected update permission';
  exception when insufficient_privilege then null; end;
end $$;
-- The same catalogue title can belong independently to another account.
select public.save_library_entry(gen_random_uuid(), 999001, 'tv', 'Independent library', '', null, 7, 'completed');
reset role;
do $$
begin
  if has_table_privilege('anon','public.library_entries','select') or has_table_privilege('anon','public.media_snapshots','select') then raise exception 'Anonymous table access'; end if;
  if has_function_privilege('anon','public.save_library_entry(uuid,integer,text,text,text,text,numeric,text,integer,integer,integer,text)','execute') then raise exception 'Anonymous save access'; end if;
  delete from auth.users where id=current_setting('mytake.test_a')::uuid;
  if exists(select 1 from public.library_entries where user_id=current_setting('mytake.test_a')::uuid) then raise exception 'Entries survived account deletion'; end if;
  if exists(select 1 from public.media_snapshots where user_id=current_setting('mytake.test_a')::uuid) then raise exception 'Media survived account deletion'; end if;
  if (select count(*) from public.library_entries where user_id=current_setting('mytake.test_b')::uuid) <> 1 then raise exception 'Deletion affected other account'; end if;
end $$;
select 'Passed: ownership, isolation, null/zero/8.8, progress, constraints, atomic saves, retry, duplicates, anonymous denial and account cascade. Fixtures rolled back.' as result;
rollback;
