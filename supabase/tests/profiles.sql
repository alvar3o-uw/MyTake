begin;
select set_config('mytake.test_a', gen_random_uuid()::text, true);
select set_config('mytake.test_b', gen_random_uuid()::text, true);
select set_config('mytake.test_name', 'test_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12), true);
insert into auth.users(id) values (current_setting('mytake.test_a')::uuid), (current_setting('mytake.test_b')::uuid);
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('mytake.test_a'), 'role', 'authenticated')::text, true);
insert into public.profiles(id,username) values(current_setting('mytake.test_a')::uuid,current_setting('mytake.test_name'));
do $$
begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'Owner read failed'; end if;
end $$;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('mytake.test_b'), 'role', 'authenticated')::text, true);
do $$
declare affected integer;
begin
  if (select count(*) from public.profiles) <> 0 then raise exception 'Cross-account read leaked'; end if;
  update public.profiles set username='not_allowed' where id=current_setting('mytake.test_a')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-account update allowed'; end if;
  begin
    insert into public.profiles(id,username) values(current_setting('mytake.test_b')::uuid,current_setting('mytake.test_name'));
    raise exception 'Duplicate username allowed';
  exception when unique_violation then null; end;
  begin
    insert into public.profiles(id,username) values(current_setting('mytake.test_b')::uuid,'Invalid Name');
    raise exception 'Invalid username allowed';
  exception when check_violation then null; end;
  begin
    insert into public.profiles(id,username) values(current_setting('mytake.test_a')::uuid,'spoofed_owner');
    raise exception 'Ownership spoof allowed';
  exception when insufficient_privilege then null; end;
end $$;
insert into public.profiles(id,username) values(current_setting('mytake.test_b')::uuid,'b_' || substr(replace(current_setting('mytake.test_b'),'-',''),1,12));
do $$
begin
  begin
    update public.profiles set id=current_setting('mytake.test_a')::uuid where id=current_setting('mytake.test_b')::uuid;
    raise exception 'Owner reassignment allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$
begin
 if has_table_privilege('anon','public.profiles','select') then raise exception 'Anonymous read permission granted'; end if;
end $$;
select 'Passed: owner access, cross-account isolation, unique usernames, username format, insert ownership, update ownership, anonymous denial. Fixtures rolled back.' as result;
rollback;
