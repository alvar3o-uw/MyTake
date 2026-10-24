begin;
select set_config('mytake.remove_a',gen_random_uuid()::text,true);
select set_config('mytake.remove_b',gen_random_uuid()::text,true);
select set_config('mytake.remove_entry_a',gen_random_uuid()::text,true);
select set_config('mytake.remove_entry_b',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('mytake.remove_a')::uuid),(current_setting('mytake.remove_b')::uuid);
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.remove_a'),'role','authenticated')::text,true);
select public.save_library_entry(current_setting('mytake.remove_entry_a')::uuid,999010,'tv','Removal fixture A','',null,8.8,'in_progress',12345,1,3,'Fixture episode');
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.remove_b'),'role','authenticated')::text,true);
select public.save_library_entry(current_setting('mytake.remove_entry_b')::uuid,999010,'tv','Removal fixture B','',null,7,'completed');
do $$
declare affected integer;
begin
 delete from public.media_snapshots where id=current_setting('mytake.remove_entry_a')::uuid;
 get diagnostics affected = row_count;
 if affected <> 0 then raise exception 'Cross-account deletion allowed'; end if;
 delete from public.media_snapshots where id=current_setting('mytake.remove_entry_b')::uuid;
 get diagnostics affected = row_count;
 if affected <> 1 then raise exception 'Owner deletion failed'; end if;
 if exists(select 1 from public.library_entries where id=current_setting('mytake.remove_entry_b')::uuid) then raise exception 'Rating/progress did not cascade'; end if;
 delete from public.media_snapshots where id=current_setting('mytake.remove_entry_b')::uuid;
 get diagnostics affected = row_count;
 if affected <> 0 then raise exception 'Repeated deletion not empty'; end if;
end $$;
reset role;
do $$
begin
 if not exists(select 1 from public.library_entries where id=current_setting('mytake.remove_entry_a')::uuid and rating=8.8 and episode_number=3) then raise exception 'Other account affected'; end if;
 if exists(select 1 from public.media_snapshots where id=current_setting('mytake.remove_entry_b')::uuid) then raise exception 'Snapshot remained'; end if;
 if has_table_privilege('anon','public.media_snapshots','delete') then raise exception 'Anonymous deletion granted'; end if;
 if has_table_privilege('authenticated','public.library_entries','delete') then raise exception 'Unexpected direct entry deletion grant'; end if;
end $$;
select 'Passed: owner-only removal, cascade cleanup, cross-account denial, safe repeat, anonymous denial. Fixtures rolled back.' as result;
rollback;
