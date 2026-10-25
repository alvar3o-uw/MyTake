-- A personal preference, independent of score; existing owner UPDATE RLS still applies.
alter table public.library_entries add column is_favourite boolean not null default false;
grant update(is_favourite) on public.library_entries to authenticated;
