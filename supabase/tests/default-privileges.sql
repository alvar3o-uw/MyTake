-- Run as postgres, the role that applies MyTake's schema files.
-- Fails if anon has any table, column, sequence or function privilege in public,
-- or CREATE on the schema (schema and type USAGE are not checked), or if tables,
-- sequences and functions created here as postgres grant anything to anon or
-- authenticated by default.
begin;

-- Existing objects: nothing in public is open to anon.
do $$
declare found text;
begin
  select string_agg(item, ', ' order by item) into found from (
    select format('%s (relation)', c.oid::regclass) as item
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r','p','v','m','f')
      and (has_table_privilege('anon', c.oid, 'select,insert,update,delete,truncate,references,trigger,maintain')
           or has_any_column_privilege('anon', c.oid, 'select,insert,update,references'))
    union all
    select format('%s (sequence)', c.oid::regclass)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'S'
      and case when c.relkind = 'S' then has_sequence_privilege('anon', c.oid, 'usage,select,update') end
    union all
    select format('%s (function)', p.oid::regprocedure)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')
    union all
    select 'schema public (create)' where has_schema_privilege('anon', 'public', 'create')
  ) granted;
  if found is not null then raise exception 'Granted to anon: %', found; end if;
end $$;

-- New objects: temporary probes, removed by the rollback.
create table public.mytake_default_probe (id integer generated always as identity primary key, note text);
create sequence public.mytake_default_probe_seq;
create function public.mytake_default_probe_fn() returns integer language sql as 'select 1';

do $$
declare found text;
begin
  select string_agg(item, ', ' order by item) into found from (
    select format('%s on new table', r) as item from unnest(array['anon','authenticated']) r
    where has_table_privilege(r, 'public.mytake_default_probe', 'select,insert,update,delete,truncate,references,trigger,maintain')
       or has_any_column_privilege(r, 'public.mytake_default_probe', 'select,insert,update,references')
    union all
    select format('%s on new sequence', r) from unnest(array['anon','authenticated']) r
    where has_sequence_privilege(r, 'public.mytake_default_probe_seq', 'usage,select,update')
       or has_sequence_privilege(r, pg_get_serial_sequence('public.mytake_default_probe', 'id'), 'usage,select,update')
    union all
    select format('%s on new function', r) from unnest(array['anon','authenticated']) r
    where has_function_privilege(r, 'public.mytake_default_probe_fn()', 'execute')
  ) granted;
  if found is not null then raise exception 'Granted by default: %', found; end if;
end $$;

select 'Passed: nothing in public granted to anon; new tables, sequences and functions grant nothing to anon or authenticated. Probes rolled back.' as result;
rollback;
