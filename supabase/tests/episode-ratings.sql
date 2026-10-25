begin;
select set_config('mytake.ep_owner',gen_random_uuid()::text,true);
select set_config('mytake.ep_other',gen_random_uuid()::text,true);
select set_config('mytake.ep_entry',gen_random_uuid()::text,true);
select set_config('mytake.ep_movie',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('mytake.ep_owner')::uuid),(current_setting('mytake.ep_other')::uuid);
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.ep_owner'),'role','authenticated')::text,true);
select public.save_library_entry(current_setting('mytake.ep_entry')::uuid,999040,'tv','Episode fixture','',null,8,'completed');
select public.save_library_entry(current_setting('mytake.ep_movie')::uuid,999041,'movie','Movie fixture','',null,null,'completed');
select public.save_episode_rating(current_setting('mytake.ep_entry')::uuid,9990401,0,1,0);
select public.save_episode_rating(current_setting('mytake.ep_entry')::uuid,9990402,99,999,8.8);
select public.save_episode_rating(current_setting('mytake.ep_entry')::uuid,9990402,99,999,9.3);
do $$ begin
 if (select rating from public.episode_ratings where episode_id=9990401)<>0 then raise exception 'Zero not preserved'; end if;
 if (select count(*) from public.episode_ratings)<>2 then raise exception 'Retry duplicated rating'; end if;
 if (select rating from public.episode_ratings where episode_id=9990402)<>9.3 then raise exception 'Edit failed'; end if;
 if (select rating from public.library_entries where id=current_setting('mytake.ep_entry')::uuid)<>8 then raise exception 'Show score changed'; end if;
 begin
  perform public.save_episode_rating(current_setting('mytake.ep_entry')::uuid,9990403,1,2,10.1);
  raise exception 'Out of range allowed';
 exception when check_violation then null; end;
 begin
  perform public.save_episode_rating(current_setting('mytake.ep_entry')::uuid,9990403,1,2,8.85);
  raise exception 'Precision allowed';
 exception when check_violation then null; end;
 begin
  perform public.save_episode_rating(current_setting('mytake.ep_movie')::uuid,9990403,1,2,8);
  raise exception 'Movie rating allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.episode_ratings values(current_setting('mytake.ep_movie')::uuid,9990403,1,2,8);
  raise exception 'Direct movie rating allowed';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.ep_other'),'role','authenticated')::text,true);
do $$ declare affected integer; begin
 if (select count(*) from public.episode_ratings)<>0 then raise exception 'Cross-account read'; end if;
 update public.episode_ratings set rating=1; get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Cross-account update'; end if;
 delete from public.episode_ratings; get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Cross-account delete'; end if;
 begin
  perform public.save_episode_rating(current_setting('mytake.ep_entry')::uuid,9990403,1,2,8);
  raise exception 'Cross-account save';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.ep_owner'),'role','authenticated')::text,true);
select public.save_episode_rating(current_setting('mytake.ep_entry')::uuid,9990401,0,1,null);
do $$ begin
 if exists(select 1 from public.episode_ratings where episode_id=9990401) then raise exception 'Clear failed'; end if;
end $$;
delete from public.media_snapshots where id=current_setting('mytake.ep_entry')::uuid;
do $$ begin
 if exists(select 1 from public.episode_ratings) then raise exception 'Show removal cascade failed'; end if;
end $$;
set local role anon;
do $$ begin
 begin
  perform * from public.episode_ratings;
  raise exception 'Anonymous read';
 exception when insufficient_privilege then null; end;
 begin
  perform public.save_episode_rating(current_setting('mytake.ep_entry')::uuid,9990401,0,1,8);
  raise exception 'Anonymous save';
 exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'Episode rating privacy, precision, retry, independence, clear and cascade checks passed' as result;
