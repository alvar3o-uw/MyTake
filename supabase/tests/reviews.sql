begin;
select set_config('mytake.review_owner',gen_random_uuid()::text,true);
select set_config('mytake.review_other',gen_random_uuid()::text,true);
select set_config('mytake.review_entry',gen_random_uuid()::text,true);
select set_config('mytake.review_movie',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('mytake.review_owner')::uuid),(current_setting('mytake.review_other')::uuid);
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.review_owner'),'role','authenticated')::text,true);
select public.save_library_entry(current_setting('mytake.review_entry')::uuid,999060,'tv','Review fixture','',null,null,'completed');
select public.save_library_entry(current_setting('mytake.review_movie')::uuid,999061,'movie','Review movie','',null,0,'completed');
update public.library_entries set review=E'My take\nA second paragraph' where id=current_setting('mytake.review_entry')::uuid;
update public.library_entries set review='Movie review' where id=current_setting('mytake.review_movie')::uuid;
select public.save_episode_review(current_setting('mytake.review_entry')::uuid,9990601,0,1,'Special review');
select public.save_episode_review(current_setting('mytake.review_entry')::uuid,9990601,0,1,'Updated review');
do $$ begin
 if (select review from public.library_entries where id=current_setting('mytake.review_movie')::uuid)<>'Movie review' then raise exception 'Movie review missing'; end if;
 if (select rating from public.library_entries where id=current_setting('mytake.review_movie')::uuid)<>0 then raise exception 'Review changed zero score'; end if;
 if (select count(*) from public.episode_reviews)<>1 then raise exception 'Episode review duplicated'; end if;
 if (select review from public.episode_reviews)<>'Updated review' then raise exception 'Episode review update failed'; end if;
 if exists(select 1 from public.episode_ratings where entry_id=current_setting('mytake.review_entry')::uuid) then raise exception 'Review created score'; end if;
 begin
  update public.library_entries set review=repeat('x',10001) where id=current_setting('mytake.review_entry')::uuid;
  raise exception 'Long media review allowed';
 exception when check_violation then null; end;
 begin
  perform public.save_episode_review(current_setting('mytake.review_entry')::uuid,9990602,1,2,repeat('x',10001));
  raise exception 'Long episode review allowed';
 exception when check_violation then null; end;
 begin
  perform public.save_episode_review(current_setting('mytake.review_entry')::uuid,9990602,1,2,'   ');
  raise exception 'Blank episode review allowed';
 exception when check_violation then null; end;
 begin
  perform public.save_episode_review(current_setting('mytake.review_movie')::uuid,9990602,1,2,'Invalid movie episode');
  raise exception 'Movie episode review allowed';
 exception when insufficient_privilege then null; end;
 begin
  update public.episode_reviews set entry_id=current_setting('mytake.review_movie')::uuid;
  raise exception 'Episode review identity editable';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.review_other'),'role','authenticated')::text,true);
do $$ declare affected integer; begin
 if exists(select 1 from public.episode_reviews) then raise exception 'Cross-account review leak'; end if;
 if exists(select 1 from public.library_entries where review is not null) then raise exception 'Cross-account media review leak'; end if;
 update public.library_entries set review='Tampered'; get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Cross-account media review edit'; end if;
 update public.episode_reviews set review='Tampered'; get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Cross-account episode review edit'; end if;
 delete from public.episode_reviews; get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Cross-account episode review delete'; end if;
 begin
  perform public.save_episode_review(current_setting('mytake.review_entry')::uuid,9990601,0,1,'Tampered');
  raise exception 'Cross-account episode review write';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.review_owner'),'role','authenticated')::text,true);
select public.save_episode_review(current_setting('mytake.review_entry')::uuid,9990601,0,1,null);
select public.save_episode_review(current_setting('mytake.review_entry')::uuid,9990601,0,1,null);
update public.library_entries set review=null where id=current_setting('mytake.review_entry')::uuid;
do $$ begin
 if exists(select 1 from public.episode_reviews) then raise exception 'Episode review clear failed'; end if;
 if exists(select 1 from public.library_entries where id=current_setting('mytake.review_entry')::uuid and review is not null) then raise exception 'Media review clear failed'; end if;
end $$;
select public.save_episode_review(current_setting('mytake.review_entry')::uuid,9990601,0,1,'Cascade fixture');
delete from public.media_snapshots where id=current_setting('mytake.review_entry')::uuid;
do $$ begin
 if exists(select 1 from public.episode_reviews) then raise exception 'Show deletion left episode reviews'; end if;
end $$;
set local role anon;
do $$ begin
 begin
  perform * from public.episode_reviews;
  raise exception 'Anonymous episode review read';
 exception when insufficient_privilege then null; end;
 begin
  perform public.save_episode_review(current_setting('mytake.review_entry')::uuid,9990601,0,1,'Anonymous');
  raise exception 'Anonymous episode review write';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
delete from auth.users where id=current_setting('mytake.review_owner')::uuid;
do $$ begin
 if exists(select 1 from public.library_entries where id=current_setting('mytake.review_movie')::uuid) then raise exception 'Account cleanup failed'; end if;
end $$;
rollback;
select 'Private media and episode review save, edit, clear, limits, independence, ownership and cascade checks passed' as result;
