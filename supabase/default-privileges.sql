-- New tables, sequences and functions that postgres creates in public grant
-- nothing to anon or authenticated; each schema file grants what it needs.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;
-- PostgreSQL also lets everyone (PUBLIC) run new functions. A schema-level rule
-- can't remove that, so this one covers functions postgres creates in any schema.
alter default privileges for role postgres revoke execute on functions from public;
