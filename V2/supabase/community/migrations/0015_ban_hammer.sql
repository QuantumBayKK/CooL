-- 0015 The ban hammer (owner decision, 31 Oct 2026). Admins can delete a member's account outright;
-- the email goes on a ban list so the same address cannot sign up again until an admin lifts it.
-- Admins cannot ban themselves or another admin. Every ban and unban is in the audit log.
-- Down: drop the trigger, functions and table; restore the 0002 audit actions.

alter table public.admin_audit drop constraint if exists admin_audit_action_check;
alter table public.admin_audit add constraint admin_audit_action_check check (action in (
  'approve', 'reject', 'grant', 'revoke', 'capability_grant', 'capability_revoke', 'flag', 'account_delete', 'ban', 'unban'));

create table if not exists public.banned_emails (
  email text primary key check (email = lower(email) and char_length(email) between 3 and 320),
  reason text check (reason is null or char_length(reason) <= 300),
  banned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.banned_emails enable row level security;
drop policy if exists "bans: admins read" on public.banned_emails;
create policy "bans: admins read" on public.banned_emails for select using (public.is_owner());
revoke all on public.banned_emails from anon, authenticated;
grant select on public.banned_emails to authenticated;

create or replace function public.ban_hammer(p_target uuid, p_reason text) returns void
language plpgsql security definer set search_path = public, auth as $$
declare target_email text;
begin
  if not public.is_owner() then raise exception 'admins only' using errcode = '42501'; end if;
  if p_target = auth.uid() then raise exception 'you cannot ban yourself' using errcode = '42501'; end if;
  select lower(email) into target_email from auth.users where id = p_target;
  if target_email is null then raise exception 'no such account' using errcode = 'P0002'; end if;
  if exists (select 1 from public.admins a where a.email = target_email) then raise exception 'admins cannot be banned' using errcode = '42501'; end if;
  if p_reason is not null and char_length(p_reason) > 300 then raise exception 'reason is too long' using errcode = '22023'; end if;
  insert into public.banned_emails (email, reason, banned_by) values (target_email, nullif(trim(p_reason), ''), auth.uid())
  on conflict (email) do update set reason = excluded.reason, banned_by = excluded.banned_by, created_at = now();
  perform public.audit('ban', p_target, null, left(target_email || coalesce(' · ' || nullif(trim(p_reason), ''), ''), 400));
  delete from auth.users where id = p_target; -- profile, messages, desk and the rest go with it
end $$;
revoke all on function public.ban_hammer(uuid, text) from public, anon;
grant execute on function public.ban_hammer(uuid, text) to authenticated;

create or replace function public.unban_email(p_email text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'admins only' using errcode = '42501'; end if;
  delete from public.banned_emails where email = lower(trim(p_email));
  if found then perform public.audit('unban', null, null, lower(trim(p_email))); end if;
end $$;
revoke all on function public.unban_email(text) from public, anon;
grant execute on function public.unban_email(text) to authenticated;

-- A banned address cannot create a new account.
create or replace function public.refuse_banned_signup() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.banned_emails b where b.email = lower(coalesce(new.email, ''))) then
    raise exception 'this account is not allowed to join' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function public.refuse_banned_signup() from public, anon, authenticated;
drop trigger if exists refuse_banned_signup on auth.users;
create trigger refuse_banned_signup before insert on auth.users
  for each row execute function public.refuse_banned_signup();
