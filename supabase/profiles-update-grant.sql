-- Owners may change only their username; the profile id stays fixed.
revoke update on public.profiles from authenticated;
grant update (username) on public.profiles to authenticated;
