begin;
select set_config('mytake.edit_a',gen_random_uuid()::text,true);
select set_config('mytake.edit_b',gen_random_uuid()::text,true);
select set_config('mytake.edit_entry',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('mytake.edit_a')::uuid),(current_setting('mytake.edit_b')::uuid);
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.edit_a'),'role','authenticated')::text,true);
select public.save_library_entry(current_setting('mytake.edit_entry')::uuid,999020,'tv','Edit fixture','',null,8.8,'in_progress',12345,1,3,'Old episode');
do $$
begin
 update public.library_entries set rating=9.1,episode_id=12346,episode_number=4,episode_name='New episode' where id=current_setting('mytake.edit_entry')::uuid;
 if not exists(select 1 from public.library_entries where id=current_setting('mytake.edit_entry')::uuid and rating=9.1 and episode_number=4) then raise exception 'Owner edit failed'; end if;
 begin
  update public.library_entries set rating=10.1 where id=current_setting('mytake.edit_entry')::uuid;
  raise exception 'Invalid rating allowed';
 exception when check_violation then null; end;
 begin
  update public.library_entries set viewing_status='completed' where id=current_setting('mytake.edit_entry')::uuid;
  raise exception 'Completed with progress allowed';
 exception when check_violation then null; end;
 begin
  update public.library_entries set user_id=current_setting('mytake.edit_b')::uuid where id=current_setting('mytake.edit_entry')::uuid;
  raise exception 'Owner reassignment allowed';
 exception when insufficient_privilege then null; end;
 begin
  update public.library_entries set media_type='movie' where id=current_setting('mytake.edit_entry')::uuid;
  raise exception 'Media identity edit allowed';
 exception when insufficient_privilege then null; end;
 update public.library_entries set viewing_status='completed',rating=0,episode_id=null,season_number=null,episode_number=null,episode_name=null where id=current_setting('mytake.edit_entry')::uuid;
 if not exists(select 1 from public.library_entries where rating=0 and viewing_status='completed' and episode_id is null) then raise exception 'Completion cleanup/zero failed'; end if;
 update public.library_entries set rating=null where id=current_setting('mytake.edit_entry')::uuid;
 if not exists(select 1 from public.library_entries where rating is null) then raise exception 'Clearing rating failed'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.edit_b'),'role','authenticated')::text,true);
do $$
declare affected integer;
begin
 update public.library_entries set rating=1 where id=current_setting('mytake.edit_entry')::uuid;
 get diagnostics affected = row_count;
 if affected <> 0 then raise exception 'Cross-account update allowed'; end if;
end $$;
reset role;
do $$
begin
 if has_column_privilege('anon','public.library_entries','rating','update') then raise exception 'Anonymous update allowed'; end if;
 if not exists(select 1 from public.library_entries where id=current_setting('mytake.edit_entry')::uuid and rating is null and viewing_status='completed') then raise exception 'Other user changed entry'; end if;
end $$;
select 'Passed: owner edit, progress change/clear, zero/unrated, constraints, immutable identity/owner, cross-account and anonymous denial. Fixtures rolled back.' as result;
rollback;
