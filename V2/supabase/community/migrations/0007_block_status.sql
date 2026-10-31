-- 0007 Whether the caller has blocked a member, by handle (for the inbox's Block / Unblock button).
create or replace function public.i_blocked(p_handle text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks where blocker = auth.uid() and blocked = public.member_id(p_handle));
$$;
grant execute on function public.i_blocked(text) to authenticated;
