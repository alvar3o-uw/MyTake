-- Run after all schema files. This file never applies the migration itself.
-- Claude's live runner strips only this file's outer begin/rollback lines.
begin;
select set_config('mytake.cap_owner', gen_random_uuid()::text, true);
select set_config('mytake.cap_other', gen_random_uuid()::text, true);
select set_config('mytake.cap_entry', gen_random_uuid()::text, true);
select set_config('mytake.cap_second', gen_random_uuid()::text, true);
insert into auth.users(id) values
 (current_setting('mytake.cap_owner')::uuid), (current_setting('mytake.cap_other')::uuid);

-- These temporary helpers disappear with the rollback; no production objects change.
create function pg_temp.cap_state() returns jsonb language sql security invoker as $$
 select jsonb_build_array(
  (select jsonb_agg(to_jsonb(t) order by id) from public.media_snapshots t),
  (select jsonb_agg(to_jsonb(t) order by id) from public.library_entries t),
  (select jsonb_agg(to_jsonb(t) order by id) from public.watchlist_entries t),
  (select jsonb_agg(to_jsonb(t) order by entry_id, episode_id) from public.episode_ratings t),
  (select jsonb_agg(to_jsonb(t) order by entry_id, season_number) from public.season_ratings t),
  (select jsonb_agg(to_jsonb(t) order by entry_id, episode_id) from public.episode_reviews t),
  (select jsonb_agg(to_jsonb(t) order by entry_id) from public.episode_favourites t)
 );
$$;
create function pg_temp.cap_reject(label text, statement text, expected_code text, expected_message text default null)
returns void language plpgsql security invoker as $$
declare before_state jsonb := pg_temp.cap_state(); actual_code text; actual_message text;
begin
 begin
  execute statement;
 exception when others then
  get stacked diagnostics actual_code = returned_sqlstate, actual_message = message_text;
 end;
 if actual_code is distinct from expected_code then
  raise exception '%: expected %, got % (%)', label, expected_code, coalesce(actual_code, 'success'), actual_message;
 end if;
 if expected_message is not null and actual_message is distinct from expected_message then
  raise exception '%: expected message %, got %', label, expected_message, actual_message;
 end if;
 if pg_temp.cap_state() is distinct from before_state then
  raise exception '%: refusal changed stored data', label;
 end if;
end;
$$;
create function pg_temp.cap_assert(ok boolean, label text) returns void language plpgsql as $$
begin
 if ok is distinct from true then raise exception '%', label; end if;
end;
$$;
-- New functions grant nothing by default (supabase/default-privileges.sql).
grant execute on function pg_temp.cap_state(), pg_temp.cap_reject(text,text,text,text), pg_temp.cap_assert(boolean,text) to authenticated;

-- 1: 500 library + 499 watchlist; the next watchlist title is the 1,000th.
select set_config('request.jwt.claims', '{}', true);
insert into public.media_snapshots(id,user_id,tmdb_id,media_type,title,collection)
 select gen_random_uuid(),current_setting('mytake.cap_owner')::uuid,n,'tv','x',
 case when n <= 500 then 'library' else 'watchlist' end from generate_series(1,999) n;
insert into public.library_entries(id,user_id,media_id,media_type,viewing_status)
 select id,user_id,id,media_type,'completed' from public.media_snapshots
 where user_id=current_setting('mytake.cap_owner')::uuid and collection='library';
insert into public.watchlist_entries(id,user_id,media_id,media_type)
 select id,user_id,id,media_type from public.media_snapshots
 where user_id=current_setting('mytake.cap_owner')::uuid and collection='watchlist';
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.cap_owner'),'role','authenticated')::text,true);
select public.save_watchlist_entry(current_setting('mytake.cap_second')::uuid,1000,'tv','x','',null);
select pg_temp.cap_assert((select count(*)=1000 from public.media_snapshots),'1: 1,000th combined title saves');
select pg_temp.cap_reject('1: 1,001st combined title refused',
 $$select public.save_library_entry(gen_random_uuid(),1001,'tv','x','',null,null,'completed')$$,'MTLIM','titles');
select pg_temp.cap_reject('1: watchlist cannot bypass combined title cap',
 $$select public.save_watchlist_entry(gen_random_uuid(),1001,'tv','x','',null)$$,'MTLIM','titles');

-- 8: all five limits are private to an account (the other account starts empty).
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.cap_other'),'role','authenticated')::text,true);
select public.save_library_entry(current_setting('mytake.cap_entry')::uuid,1,'tv','x','',null,null,'completed');
select pg_temp.cap_assert((select count(*)=1 from public.media_snapshots),'8: first title of second account unaffected');
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.cap_owner'),'role','authenticated')::text,true);
-- 2: leave room for one, then try inserting two directly; neither may survive.
delete from public.media_snapshots where id=current_setting('mytake.cap_second')::uuid;
select pg_temp.cap_reject('2: bulk snapshot insert refused atomically',
 $$insert into public.media_snapshots(id,user_id,tmdb_id,media_type,title)
 select gen_random_uuid(),auth.uid(),n,'tv','x' from generate_series(1001,1002) n$$,'MTLIM','titles');
reset role;
select set_config('request.jwt.claims','{}',true);
delete from public.media_snapshots where user_id=current_setting('mytake.cap_owner')::uuid;
insert into public.media_snapshots(id,user_id,tmdb_id,media_type,title)
 values(current_setting('mytake.cap_second')::uuid,current_setting('mytake.cap_owner')::uuid,1,'tv','x');
insert into public.library_entries(id,user_id,media_id,media_type,viewing_status)
 values(current_setting('mytake.cap_second')::uuid,current_setting('mytake.cap_owner')::uuid,current_setting('mytake.cap_second')::uuid,'tv','completed');

-- 3, 4, 5: bulk seed to one below each row cap without a signed-in user.
insert into public.episode_ratings(entry_id,episode_id,season_number,episode_number,rating)
 select current_setting('mytake.cap_second')::uuid,n,1,n,5 from generate_series(1,9999) n;
insert into public.season_ratings(entry_id,season_number,rating)
 select current_setting('mytake.cap_second')::uuid,n,5 from generate_series(1,999) n;
insert into public.episode_reviews(entry_id,episode_id,season_number,episode_number,review)
 select current_setting('mytake.cap_second')::uuid,n,1,n,'x' from generate_series(1,1999) n;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.cap_owner'),'role','authenticated')::text,true);
select public.save_episode_rating(current_setting('mytake.cap_second')::uuid,10000,1,10000,5);
select pg_temp.cap_assert((select count(*)=10000 from public.episode_ratings),'3: 10,000th episode rating saves');
select pg_temp.cap_reject('3: 10,001st episode rating refused',
 $$select public.save_episode_rating(current_setting('mytake.cap_second')::uuid,10001,1,10001,5)$$,'MTLIM','episode_ratings');
select public.save_episode_rating(current_setting('mytake.cap_second')::uuid,1,1,1,9);
select pg_temp.cap_assert((select rating=9 from public.episode_ratings where episode_id=1),'3: existing score changes at cap');
select public.save_season_rating(current_setting('mytake.cap_second')::uuid,1000,5);
select pg_temp.cap_assert((select count(*)=1000 from public.season_ratings),'4: 1,000th season rating saves');
select pg_temp.cap_reject('4: 1,001st season rating refused',
 $$select public.save_season_rating(current_setting('mytake.cap_second')::uuid,1001,5)$$,'MTLIM','season_ratings');
select public.save_episode_review(current_setting('mytake.cap_second')::uuid,2000,1,2000,'x');
select pg_temp.cap_assert((select count(*)=2000 from public.episode_reviews),'5: 2,000th episode review saves');
select pg_temp.cap_reject('5: 2,001st episode review refused',
 $$select public.save_episode_review(current_setting('mytake.cap_second')::uuid,2001,1,2001,'x')$$,'MTLIM','episode_reviews');
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.cap_other'),'role','authenticated')::text,true);
select public.save_episode_rating(current_setting('mytake.cap_entry')::uuid,1,1,1,5);
select public.save_season_rating(current_setting('mytake.cap_entry')::uuid,1,5);
select public.save_episode_review(current_setting('mytake.cap_entry')::uuid,1,1,1,'x');
select pg_temp.cap_assert((select count(*)=1 from public.episode_ratings) and (select count(*)=1 from public.season_ratings)
 and (select count(*)=1 from public.episode_reviews),'8: second account unaffected by all three row caps');
reset role;
select set_config('request.jwt.claims','{}',true);
delete from public.media_snapshots where user_id=current_setting('mytake.cap_owner')::uuid;

-- 6: independent boundary cases, every counted field, including both insert/update paths.
-- 100 reviews of 9,999 bytes + 100 one-byte titles = exactly 1 MB.
-- Each case resets the owner fixture with auth.uid() null; no global data is touched.
create function pg_temp.cap_text_seed(padding integer) returns void language plpgsql as $$
begin
 delete from public.media_snapshots where user_id=current_setting('mytake.cap_owner')::uuid;
 insert into public.media_snapshots(id,user_id,tmdb_id,media_type,title)
 select case when n=1 then current_setting('mytake.cap_second')::uuid else gen_random_uuid() end,
 current_setting('mytake.cap_owner')::uuid,n,'tv','x' from generate_series(1,100) n;
 insert into public.library_entries(id,user_id,media_id,media_type,viewing_status,review)
 select id,user_id,id,media_type,'completed',repeat('x',9999)
 from public.media_snapshots where user_id=current_setting('mytake.cap_owner')::uuid;
 update public.library_entries set review=repeat('x',9999-padding) where id=current_setting('mytake.cap_second')::uuid;
end;
$$;
-- The fixture function is called only by the runner's original role with an empty JWT.
select pg_temp.cap_text_seed(2);
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.cap_owner'),'role','authenticated')::text,true);
-- 2 bytes of UTF-8, not one character; no library child needed for direct snapshot writes.
insert into public.media_snapshots(id,user_id,tmdb_id,media_type,title)
 values(gen_random_uuid(),auth.uid(),101,'tv','é');
select pg_temp.cap_assert((select sum(octet_length(title)) from public.media_snapshots)=102,'6 title: multibyte exact boundary saves');
select pg_temp.cap_reject('6 title: one byte over refused',
 $$insert into public.media_snapshots(id,user_id,tmdb_id,media_type,title) values(gen_random_uuid(),auth.uid(),102,'tv','x')$$,'MTLIM','text');
-- 8: owner at 1 MB cannot stop the second account saving text.
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.cap_other'),'role','authenticated')::text,true);
update public.library_entries set review='Second account text' where id=current_setting('mytake.cap_entry')::uuid;
select pg_temp.cap_assert((select review='Second account text' from public.library_entries where id=current_setting('mytake.cap_entry')::uuid),'8: second account text unaffected');
reset role;
select set_config('request.jwt.claims','{}',true);
select pg_temp.cap_text_seed(2);
-- Replace one library child with a watchlist child to test the library INSERT trigger via move.
delete from public.library_entries where id=current_setting('mytake.cap_second')::uuid;
update public.media_snapshots set collection='watchlist' where id=current_setting('mytake.cap_second')::uuid;
insert into public.watchlist_entries(id,user_id,media_id,media_type)
 values(current_setting('mytake.cap_second')::uuid,current_setting('mytake.cap_owner')::uuid,current_setting('mytake.cap_second')::uuid,'tv');
-- Restore the removed review bytes on another row (9,999-2) using episode reviews.
insert into public.episode_reviews(entry_id,episode_id,season_number,episode_number,review)
 select id,1,1,1,repeat('x',9997) from public.library_entries
 where user_id=current_setting('mytake.cap_owner')::uuid limit 1;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.cap_owner'),'role','authenticated')::text,true);
-- A failed move must also roll back collection and watchlist deletion.
select pg_temp.cap_reject('6 progress insert: one byte over refused and move rolled back',
 $$select public.move_watchlist_to_library(current_setting('mytake.cap_second')::uuid,null,'in_progress',1,1,1,'éx')$$,'MTLIM','text');
select public.move_watchlist_to_library(current_setting('mytake.cap_second')::uuid,null,'in_progress',1,1,1,'é');
select pg_temp.cap_assert((select episode_name='é' from public.library_entries where id=current_setting('mytake.cap_second')::uuid),'6 progress insert: exact byte boundary saves');
select pg_temp.cap_reject('6 progress update: one byte over refused',
 $$update public.library_entries set episode_name='éx' where id=current_setting('mytake.cap_second')::uuid$$,'MTLIM','text');
update public.library_entries set episode_name='' where id=current_setting('mytake.cap_second')::uuid;
update public.library_entries set episode_name='é' where id=current_setting('mytake.cap_second')::uuid;
select pg_temp.cap_assert((select episode_name='é' from public.library_entries where id=current_setting('mytake.cap_second')::uuid),'6 progress update: empty counts zero and exact boundary saves');
reset role;
select set_config('request.jwt.claims','{}',true);
select pg_temp.cap_text_seed(2);
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.cap_owner'),'role','authenticated')::text,true);
update public.library_entries set review=repeat('x',9999) where id=current_setting('mytake.cap_second')::uuid;
select pg_temp.cap_assert((select octet_length(review)=9999 and episode_name is null from public.library_entries where id=current_setting('mytake.cap_second')::uuid),'6 title review: exact boundary saves and null name counts zero');
select pg_temp.cap_reject('6 title review: one byte over refused',
 $$update public.library_entries set review=repeat('x',10000) where id=current_setting('mytake.cap_second')::uuid$$,'MTLIM','text');
reset role;
select set_config('request.jwt.claims','{}',true);
select pg_temp.cap_text_seed(2);
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.cap_owner'),'role','authenticated')::text,true);
select public.save_episode_review(current_setting('mytake.cap_second')::uuid,1,1,1,'é');
select pg_temp.cap_assert((select review='é' from public.episode_reviews where episode_id=1),'6 episode review insert: exact byte boundary saves');
select pg_temp.cap_reject('6 episode review insert: one byte over refused',
 $$select public.save_episode_review(current_setting('mytake.cap_second')::uuid,2,1,2,'x')$$,'MTLIM','text');
select pg_temp.cap_reject('6 episode review upsert: one byte over refused',
 $$select public.save_episode_review(current_setting('mytake.cap_second')::uuid,1,1,1,'éx')$$,'MTLIM','text');
select public.save_episode_review(current_setting('mytake.cap_second')::uuid,1,1,1,'x');
select public.save_episode_review(current_setting('mytake.cap_second')::uuid,1,1,1,'é');
select pg_temp.cap_assert((select review='é' from public.episode_reviews where episode_id=1),'6 episode review upsert: exact byte boundary saves');

-- 7: exceed every cap with auth.uid() null, as if the caps had been lowered.
reset role;
select set_config('request.jwt.claims','{}',true);
select pg_temp.cap_text_seed(0);
insert into public.media_snapshots(id,user_id,tmdb_id,media_type,title)
 select gen_random_uuid(),current_setting('mytake.cap_owner')::uuid,n,'tv','x' from generate_series(101,1001) n;
insert into public.episode_ratings(entry_id,episode_id,season_number,episode_number,rating)
 select current_setting('mytake.cap_second')::uuid,n,1,n,5 from generate_series(1,10001) n;
insert into public.season_ratings(entry_id,season_number,rating)
 select current_setting('mytake.cap_second')::uuid,n,5 from generate_series(1,1001) n;
insert into public.episode_reviews(entry_id,episode_id,season_number,episode_number,review)
 select current_setting('mytake.cap_second')::uuid,n,1,n,'xx' from generate_series(1,2001) n;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.cap_owner'),'role','authenticated')::text,true);
update public.episode_ratings set rating=9 where episode_id=1;
update public.season_ratings set rating=9 where season_number=1;
update public.library_entries set rating=9 where id=current_setting('mytake.cap_second')::uuid;
select public.save_episode_review(current_setting('mytake.cap_second')::uuid,1,1,1,'yy');
update public.library_entries set review=repeat('y',9999) where id=current_setting('mytake.cap_second')::uuid;
select pg_temp.cap_assert((select rating=9 and review=repeat('y',9999) from public.library_entries where id=current_setting('mytake.cap_second')::uuid)
 and (select rating=9 from public.episode_ratings where episode_id=1)
 and (select rating=9 from public.season_ratings where season_number=1)
 and (select review='yy' from public.episode_reviews where episode_id=1),'7: neutral scores and same-byte edits work above caps');
-- Same statement: one row grows and another shrinks; reject only net growth.
update public.episode_reviews set review=case episode_id when 1 then 'yyy' else 'x' end where episode_id in (1,2);
select pg_temp.cap_assert((select review='yyy' from public.episode_reviews where episode_id=1)
 and (select review='x' from public.episode_reviews where episode_id=2),'7: bulk update with zero net text growth works');
update public.library_entries set review=repeat('y',9998) where id=current_setting('mytake.cap_second')::uuid;
select public.save_episode_review(current_setting('mytake.cap_second')::uuid,1,1,1,'y');
select pg_temp.cap_assert((select octet_length(review)=9998 from public.library_entries where id=current_setting('mytake.cap_second')::uuid)
 and (select review='y' from public.episode_reviews where episode_id=1),'7: reviews shorten while over caps');
select pg_temp.cap_reject('7: title growth above cap refused',
 $$insert into public.media_snapshots(id,user_id,tmdb_id,media_type,title) values(gen_random_uuid(),auth.uid(),1002,'tv','x')$$,'MTLIM','titles');
select pg_temp.cap_reject('7: episode rating growth above cap refused',
 $$select public.save_episode_rating(current_setting('mytake.cap_second')::uuid,10002,1,10002,5)$$,'MTLIM','episode_ratings');
select pg_temp.cap_reject('7: season rating growth above cap refused',
 $$select public.save_season_rating(current_setting('mytake.cap_second')::uuid,1002,5)$$,'MTLIM','season_ratings');
select pg_temp.cap_reject('7: episode review growth above cap refused',
 $$select public.save_episode_review(current_setting('mytake.cap_second')::uuid,2002,1,2002,'x')$$,'MTLIM','episode_reviews');
select pg_temp.cap_reject('7: title review growth above text cap refused',
 $$update public.library_entries set review=repeat('y',9999) where id=current_setting('mytake.cap_second')::uuid$$,'MTLIM','text');
select pg_temp.cap_reject('7: episode review text growth above cap refused',
 $$select public.save_episode_review(current_setting('mytake.cap_second')::uuid,1,1,1,'yy')$$,'MTLIM','text');
delete from public.media_snapshots where user_id=auth.uid() and tmdb_id=1001;
delete from public.episode_ratings where episode_id=10001;
delete from public.season_ratings where season_number=1001;
delete from public.episode_reviews where episode_id=2001;
select pg_temp.cap_assert((select count(*)=1000 from public.media_snapshots)
 and (select count(*)=10000 from public.episode_ratings)
 and (select count(*)=1000 from public.season_ratings)
 and (select count(*)=2000 from public.episode_reviews),'7: deleting above every row cap works');

-- 7a: at the review row cap, update upserts must not be mistaken for inserts.
reset role;
select set_config('request.jwt.claims','{}',true);
select pg_temp.cap_text_seed(4000);
insert into public.episode_reviews(entry_id,episode_id,season_number,episode_number,review)
 select current_setting('mytake.cap_second')::uuid,n,1,n,'xx' from generate_series(1,2000) n;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.cap_owner'),'role','authenticated')::text,true);
select public.save_episode_review(current_setting('mytake.cap_second')::uuid,1,1,1,'yy');
select public.save_episode_review(current_setting('mytake.cap_second')::uuid,1,1,1,'x');
select public.save_episode_review(current_setting('mytake.cap_second')::uuid,1,1,1,'é');
select pg_temp.cap_assert((select count(*)=2000 from public.episode_reviews)
 and (select review='é' from public.episode_reviews where episode_id=1),'7a: same length, shortening and boundary upserts work at 2,000 reviews');
select pg_temp.cap_reject('7a: growing existing review past 1 MB refused at row cap',
 $$select public.save_episode_review(current_setting('mytake.cap_second')::uuid,1,1,1,'éx')$$,'MTLIM','text');

-- 9: fresh fixture below all caps isolates each CHECK constraint.
reset role;
select set_config('request.jwt.claims','{}',true);
delete from public.media_snapshots where user_id=current_setting('mytake.cap_owner')::uuid;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.cap_owner'),'role','authenticated')::text,true);
select public.save_library_entry(current_setting('mytake.cap_second')::uuid,1,'tv','x','', '/' || repeat('x',199),null,'in_progress',1,99999,99999,'');
select public.save_episode_rating(current_setting('mytake.cap_second')::uuid,1,1,99999,5);
select public.save_episode_review(current_setting('mytake.cap_second')::uuid,1,1,99999,'x');
select public.set_favourite_episode(current_setting('mytake.cap_second')::uuid,1,1,99999);
select pg_temp.cap_assert((select episode_number=99999 and season_number=99999 from public.library_entries)
 and (select episode_number=99999 from public.episode_ratings)
 and (select episode_number=99999 from public.episode_reviews)
 and (select episode_number=99999 from public.episode_favourites)
 and (select length(poster_path)=200 from public.media_snapshots),'9: all 99,999 bounds and 200-character poster accepted');
select pg_temp.cap_reject('9: rating episode 100,000 refused',
 $$select public.save_episode_rating(current_setting('mytake.cap_second')::uuid,2,1,100000,5)$$,'23514');
select pg_temp.cap_reject('9: review episode 100,000 refused',
 $$select public.save_episode_review(current_setting('mytake.cap_second')::uuid,2,1,100000,'x')$$,'23514');
select pg_temp.cap_reject('9: favourite episode 100,000 refused',
 $$select public.set_favourite_episode(current_setting('mytake.cap_second')::uuid,2,1,100000)$$,'23514');
select pg_temp.cap_reject('9: progress episode 100,000 refused',
 $$update public.library_entries set episode_number=100000 where id=current_setting('mytake.cap_second')::uuid$$,'23514');
select pg_temp.cap_reject('9: progress season 100,000 refused',
 $$update public.library_entries set season_number=100000 where id=current_setting('mytake.cap_second')::uuid$$,'23514');
select pg_temp.cap_reject('9: 201-character poster refused',
 $$select public.save_watchlist_entry(gen_random_uuid(),2,'movie','x','', '/' || repeat('x',200))$$,'23514');

-- 10: seed to every cap together, then time separate statements under an explicit 8 s limit.
reset role;
select set_config('request.jwt.claims','{}',true);
select pg_temp.cap_text_seed(2000);
insert into public.media_snapshots(id,user_id,tmdb_id,media_type,title)
 select gen_random_uuid(),current_setting('mytake.cap_owner')::uuid,n,'tv','x' from generate_series(101,1000) n;
-- Remove the extra 900 title bytes from one review for an exact total of 1 MB.
update public.library_entries set review=repeat('x',7099) where id=current_setting('mytake.cap_second')::uuid;
insert into public.episode_ratings(entry_id,episode_id,season_number,episode_number,rating)
 select current_setting('mytake.cap_second')::uuid,n,1,n,5 from generate_series(1,10000) n;
insert into public.season_ratings(entry_id,season_number,rating)
 select current_setting('mytake.cap_second')::uuid,n,5 from generate_series(1,1000) n;
insert into public.episode_reviews(entry_id,episode_id,season_number,episode_number,review)
 select current_setting('mytake.cap_second')::uuid,n,1,n,'x' from generate_series(1,2000) n;
set local statement_timeout = '8s';
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.cap_owner'),'role','authenticated')::text,true);
do $$ declare started timestamptz := clock_timestamp(); begin
 -- A neutral library write succeeds with every cap reached.
 update public.library_entries set rating=8 where id=current_setting('mytake.cap_second')::uuid;
 perform pg_temp.cap_assert((select count(*)=1000 from public.media_snapshots),'10 titles: fixture at cap');
 raise notice '10 titles/library write at caps: % ms', extract(epoch from clock_timestamp()-started)*1000;
end $$;
do $$ declare started timestamptz := clock_timestamp(); begin
 perform public.save_episode_rating(current_setting('mytake.cap_second')::uuid,1,1,1,8);
 raise notice '10 episode_ratings write at caps: % ms', extract(epoch from clock_timestamp()-started)*1000;
end $$;
do $$ declare started timestamptz := clock_timestamp(); begin
 perform public.save_season_rating(current_setting('mytake.cap_second')::uuid,1,8);
 raise notice '10 season_ratings write at caps: % ms', extract(epoch from clock_timestamp()-started)*1000;
end $$;
do $$ declare started timestamptz := clock_timestamp(); begin
 perform public.save_episode_review(current_setting('mytake.cap_second')::uuid,1,1,1,'y');
 raise notice '10 episode_reviews write at caps: % ms', extract(epoch from clock_timestamp()-started)*1000;
end $$;
do $$ declare started timestamptz := clock_timestamp(); total bigint; begin
 select (select sum(octet_length(title)) from public.media_snapshots)
  + (select sum(coalesce(octet_length(review),0)+coalesce(octet_length(episode_name),0)) from public.library_entries)
  + (select sum(octet_length(review)) from public.episode_reviews) into total;
 perform pg_temp.cap_assert(total=1000000,'10 text: fixture at exact byte cap');
 update public.library_entries set review=repeat('y',7099) where id=current_setting('mytake.cap_second')::uuid;
 raise notice '10 text write at caps: % ms', extract(epoch from clock_timestamp()-started)*1000;
end $$;
-- Performance of actual INSERT counts, including bulk input, at the boundary as well.
delete from public.episode_ratings where episode_id=10000;
do $$ declare started timestamptz := clock_timestamp(); begin
 perform public.save_episode_rating(current_setting('mytake.cap_second')::uuid,10000,1,10000,5);
 raise notice '10 episode_ratings boundary insert: % ms', extract(epoch from clock_timestamp()-started)*1000;
end $$;
delete from public.season_ratings where season_number=1000;
do $$ declare started timestamptz := clock_timestamp(); begin
 perform public.save_season_rating(current_setting('mytake.cap_second')::uuid,1000,5);
 raise notice '10 season_ratings boundary insert: % ms', extract(epoch from clock_timestamp()-started)*1000;
end $$;
delete from public.episode_reviews where episode_id=2000;
do $$ declare started timestamptz := clock_timestamp(); begin
 perform public.save_episode_review(current_setting('mytake.cap_second')::uuid,2000,1,2000,'x');
 raise notice '10 episode_reviews boundary insert: % ms', extract(epoch from clock_timestamp()-started)*1000;
end $$;
delete from public.media_snapshots where tmdb_id=1000;
do $$ declare started timestamptz := clock_timestamp(); begin
 insert into public.media_snapshots(id,user_id,tmdb_id,media_type,title) values(gen_random_uuid(),auth.uid(),1000,'tv','x');
 raise notice '10 titles/text boundary insert: % ms', extract(epoch from clock_timestamp()-started)*1000;
end $$;
rollback;
