begin;
select set_config('mytake.season_owner',gen_random_uuid()::text,true);
select set_config('mytake.season_other',gen_random_uuid()::text,true);
select set_config('mytake.season_entry',gen_random_uuid()::text,true);
select set_config('mytake.season_movie',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('mytake.season_owner')::uuid),(current_setting('mytake.season_other')::uuid);
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.season_owner'),'role','authenticated')::text,true);
select public.save_library_entry(current_setting('mytake.season_entry')::uuid,999070,'tv','Season fixture','',null,8,'completed');
select public.save_library_entry(current_setting('mytake.season_movie')::uuid,999071,'movie','Movie fixture','',null,null,'completed');
select public.save_season_rating(current_setting('mytake.season_entry')::uuid,0,0);
select public.save_season_rating(current_setting('mytake.season_entry')::uuid,1,8.8);
select public.save_season_rating(current_setting('mytake.season_entry')::uuid,2,9.3);
select public.save_season_rating(current_setting('mytake.season_entry')::uuid,3,9.3);
select public.save_season_rating(current_setting('mytake.season_entry')::uuid,1,8.8);
do $$ begin
 if (select count(*) from public.season_ratings)<>4 then raise exception 'Retry duplicated season'; end if;
 if (select rating from public.season_ratings where season_number=0)<>0 then raise exception 'Specials zero lost'; end if;
 if (select season_number from public.season_ratings order by rating desc,season_number asc limit 1)<>2 then raise exception 'Top season tie order failed'; end if;
 if (select rating from public.library_entries where id=current_setting('mytake.season_entry')::uuid)<>8 then raise exception 'Season changed overall rating'; end if;
 if exists(select 1 from public.episode_ratings) then raise exception 'Season created episode rating'; end if;
 begin
  perform public.save_season_rating(current_setting('mytake.season_entry')::uuid,1,8.85);
  raise exception 'Precision allowed';
 exception when check_violation then null; end;
 begin
  perform public.save_season_rating(current_setting('mytake.season_entry')::uuid,1,10.1);
  raise exception 'Range allowed';
 exception when check_violation then null; end;
 begin
  perform public.save_season_rating(current_setting('mytake.season_entry')::uuid,-1,8);
  raise exception 'Invalid season allowed';
 exception when check_violation then null; end;
 begin
  perform public.save_season_rating(current_setting('mytake.season_movie')::uuid,1,8);
  raise exception 'Movie season allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.season_ratings values(current_setting('mytake.season_movie')::uuid,1,8);
  raise exception 'Direct movie season allowed';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.season_other'),'role','authenticated')::text,true);
do $$ declare affected integer; begin
 if exists(select 1 from public.season_ratings) then raise exception 'Cross-account read'; end if;
 update public.season_ratings set rating=1; get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Cross-account edit'; end if;
 delete from public.season_ratings; get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Cross-account delete'; end if;
 begin
  perform public.save_season_rating(current_setting('mytake.season_entry')::uuid,1,1);
  raise exception 'Cross-account save';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.season_owner'),'role','authenticated')::text,true);
select public.save_season_rating(current_setting('mytake.season_entry')::uuid,1,9.9);
do $$ begin
 if (select season_number from public.season_ratings order by rating desc,season_number asc limit 1)<>1 then raise exception 'Edit did not change top season'; end if;
end $$;
select public.save_season_rating(current_setting('mytake.season_entry')::uuid,1,null);
select public.save_season_rating(current_setting('mytake.season_entry')::uuid,1,null);
do $$ begin
 if exists(select 1 from public.season_ratings where season_number=1) then raise exception 'Clear failed'; end if;
end $$;
delete from public.media_snapshots where id=current_setting('mytake.season_entry')::uuid;
do $$ begin
 if exists(select 1 from public.season_ratings) then raise exception 'Show cascade failed'; end if;
end $$;
select public.save_library_entry(current_setting('mytake.season_entry')::uuid,999070,'tv','Account cascade fixture','',null,null,'completed');
select public.save_season_rating(current_setting('mytake.season_entry')::uuid,1,8);
reset role;
delete from auth.users where id=current_setting('mytake.season_owner')::uuid;
do $$ begin
 if exists(select 1 from public.season_ratings where entry_id=current_setting('mytake.season_entry')::uuid) then raise exception 'Account cascade failed'; end if;
end $$;
set local role anon;
do $$ begin
 begin
  perform * from public.season_ratings;
  raise exception 'Anonymous read';
 exception when insufficient_privilege then null; end;
 begin
  perform public.save_season_rating(current_setting('mytake.season_entry')::uuid,1,8);
  raise exception 'Anonymous write';
 exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'Season privacy, score limits, independence, top ordering, edit, clear, retries and cascades passed' as result;
