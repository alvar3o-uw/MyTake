begin;
select set_config('mytake.fav_owner',gen_random_uuid()::text,true);
select set_config('mytake.fav_other',gen_random_uuid()::text,true);
select set_config('mytake.fav_entry',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('mytake.fav_owner')::uuid),(current_setting('mytake.fav_other')::uuid);
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.fav_owner'),'role','authenticated')::text,true);
select public.save_library_entry(current_setting('mytake.fav_entry')::uuid,999080,'tv','Favourite fixture','',null,null,'completed');
do $$ begin
 if (select is_favourite from public.library_entries where id=current_setting('mytake.fav_entry')::uuid) then raise exception 'Default favourite should be false'; end if;
end $$;
update public.library_entries set is_favourite=true where id=current_setting('mytake.fav_entry')::uuid;
update public.library_entries set is_favourite=true where id=current_setting('mytake.fav_entry')::uuid;
do $$ begin
 if not (select is_favourite from public.library_entries where id=current_setting('mytake.fav_entry')::uuid) then raise exception 'Favourite save failed'; end if;
 if (select rating from public.library_entries where id=current_setting('mytake.fav_entry')::uuid) is not null then raise exception 'Favourite created score'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.fav_other'),'role','authenticated')::text,true);
do $$ declare affected integer; begin
 if exists(select 1 from public.library_entries where is_favourite) then raise exception 'Favourite leaked'; end if;
 update public.library_entries set is_favourite=false where id=current_setting('mytake.fav_entry')::uuid;
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Cross-account favourite edit'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('mytake.fav_owner'),'role','authenticated')::text,true);
update public.library_entries set is_favourite=false where id=current_setting('mytake.fav_entry')::uuid;
do $$ begin
 if (select is_favourite from public.library_entries where id=current_setting('mytake.fav_entry')::uuid) then raise exception 'Unfavourite failed'; end if;
end $$;
set local role anon;
do $$ begin
 begin
  update public.library_entries set is_favourite=true;
  raise exception 'Anonymous favourite mutation';
 exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'Title favourite owner access, retry, independence, removal and anonymous checks passed' as result;
