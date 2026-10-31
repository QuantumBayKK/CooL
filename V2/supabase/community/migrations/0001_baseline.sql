-- Northwind Cipher community: Google sign-in, public browsing, admin-approved contributors.
--
-- Run once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query -> paste -> Run).
-- Safe to run again: every statement is idempotent.
--
-- Workflow
--   1. Anyone can browse the site. Signing in with Google creates a `profiles` row (role 'member').
--   2. complete_onboarding() records who they are: name, whether they have tried CooL, why they joined.
--      Onboarded members can see the member directory (list_members()).
--   3. A member who wants to contribute sends a `contribution_requests` row with evidence of their work.
--   3. Only admins (emails in `admins`) can see every request and approve or reject it,
--      through review_request(). Approving sets the member's role to 'contributor'.
--
-- Every rule lives here, in row-level security and SECURITY DEFINER functions, so it holds even if
-- someone calls the API directly with the public anon key.

-- ── Admins ────────────────────────────────────────────────────────────────────
-- Matched on the verified email of the signed-in Google account. No policies: clients can neither
-- read nor change this table. Change admins here, in the SQL editor, only.
create table if not exists public.admins (
  email text primary key check (email = lower(email))
);
alter table public.admins enable row level security;
insert into public.admins (email) values
  ('pranauvshrinaath@northwindcipher.com'),
  ('kailoshkalimuthu@gmail.com')
on conflict do nothing;
delete from public.admins where email = 'kailoshkalimuthu@northwindcipher.com';

-- An admin must be signed in through Google with that email. A matching email alone is not enough:
-- an email + password account registered under an admin's address never counts, even if confirmed.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from public.admins a
      join auth.users u on lower(u.email) = a.email
      join auth.identities i on i.user_id = u.id and i.provider = 'google'
     where u.id = auth.uid()
       and u.email_confirmed_at is not null
       and lower(i.identity_data ->> 'email') = a.email
       and coalesce((i.identity_data ->> 'email_verified')::boolean, false)
  );
$$;

-- ── Admin audit log ───────────────────────────────────────────────────────────
-- Every admin action is recorded here by the functions below. Admins can read it; nobody can change it.
create table if not exists public.admin_audit (
  id bigint generated always as identity primary key,
  actor uuid references auth.users (id) on delete set null,
  actor_email text not null,
  action text not null check (action in ('approve', 'reject', 'grant', 'revoke')),
  target_user uuid,
  request_id uuid,
  note text,
  created_at timestamptz not null default now()
);
alter table public.admin_audit enable row level security;
drop policy if exists "audit: admins read" on public.admin_audit;
create policy "audit: admins read" on public.admin_audit for select using (public.is_admin());
revoke insert, update, delete on public.admin_audit from anon, authenticated;
grant select on public.admin_audit to authenticated;

create or replace function public.audit(p_action text, p_target uuid, p_request uuid, p_note text) returns void
language sql security definer set search_path = public as $$
  insert into public.admin_audit (actor, actor_email, action, target_user, request_id, note)
  select auth.uid(), coalesce(u.email, ''), p_action, p_target, p_request, p_note from auth.users u where u.id = auth.uid();
$$;
revoke all on function public.audit(text, uuid, uuid, text) from public, anon, authenticated;

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '' check (char_length(full_name) <= 80),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https://'),
  role text not null default 'member' check (role in ('member', 'contributor')),
  avatar jsonb check (avatar is null or pg_column_size(avatar) < 2048),
  saved_issues text[] not null default '{}' check (cardinality(saved_issues) <= 100),
  onboarded_at timestamptz,
  tried_cool text check (tried_cool in ('used', 'read', 'not_yet')),
  cool_usage text check (cool_usage is null or char_length(cool_usage) <= 500),
  join_reason text check (join_reason is null or char_length(join_reason) <= 1000),
  show_in_directory boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Columns added after the first version of this file (no-ops on a fresh project).
alter table public.profiles add column if not exists onboarded_at timestamptz;
alter table public.profiles add column if not exists tried_cool text check (tried_cool in ('used', 'read', 'not_yet'));
alter table public.profiles add column if not exists cool_usage text check (cool_usage is null or char_length(cool_usage) <= 500);
alter table public.profiles add column if not exists join_reason text check (join_reason is null or char_length(join_reason) <= 1000);
alter table public.profiles add column if not exists show_in_directory boolean not null default false;
alter table public.profiles enable row level security;

drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Members may change only these columns. Role, email, onboarding answers and timestamps are
-- server-controlled (answers go through complete_onboarding(), which validates them).
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, avatar, saved_issues, show_in_directory) on public.profiles to authenticated;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- A profile is created for every new sign-in, from what Google shares (name, email, picture).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 80),
    nullif(coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'), '')
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts that signed in before this file was run get their profile now.
insert into public.profiles (id, email, full_name, avatar_url)
select u.id, lower(coalesce(u.email, '')),
       left(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''), 80),
       nullif(coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'), '')
from auth.users u
on conflict (id) do nothing;

-- ── Onboarding ────────────────────────────────────────────────────────────────
-- The welcome steps after first sign-in. Can be called again to update the answers.
create or replace function public.complete_onboarding(
  p_name text, p_tried text, p_usage text, p_reason text, p_directory boolean
) returns public.profiles
language plpgsql security definer set search_path = public as $$
declare p public.profiles;
begin
  if auth.uid() is null then raise exception 'sign in first' using errcode = '42501'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 80 then raise exception 'name must be 2 to 80 characters' using errcode = '22023'; end if;
  if p_tried not in ('used', 'read', 'not_yet') then raise exception 'invalid answer' using errcode = '22023'; end if;
  if char_length(trim(coalesce(p_reason, ''))) not between 20 and 1000 then raise exception 'reason must be 20 to 1000 characters' using errcode = '22023'; end if;
  if char_length(coalesce(p_usage, '')) > 500 then raise exception 'usage is too long' using errcode = '22023'; end if;
  update public.profiles
     set full_name = trim(p_name), tried_cool = p_tried,
         cool_usage = nullif(trim(coalesce(p_usage, '')), ''), join_reason = trim(p_reason),
         show_in_directory = coalesce(p_directory, false), onboarded_at = coalesce(onboarded_at, now())
   where id = auth.uid() returning * into p;
  return p;
end $$;

-- Member directory: only onboarded members can look, and only members who opted in are listed.
-- Emails are never exposed here.
create or replace function public.list_members()
returns table (id uuid, full_name text, avatar_url text, role text, tried_cool text, join_reason text, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.avatar_url, p.role, p.tried_cool, p.join_reason, p.onboarded_at
    from public.profiles p
   where p.onboarded_at is not null and p.show_in_directory
     and exists (select 1 from public.profiles me where me.id = auth.uid() and me.onboarded_at is not null)
   order by (p.role = 'contributor') desc, p.onboarded_at desc
   limit 500;
$$;

-- ── Contribution requests ─────────────────────────────────────────────────────
-- Evidence: 1 to 5 https links to work the applicant has done (pull requests, repositories, projects).
create or replace function public.evidence_ok(links text[]) returns boolean
language sql immutable as $$
  select cardinality(links) between 1 and 5
     and not exists (select 1 from unnest(links) l where l !~ '^https://[^[:space:]]{4,}$' or char_length(l) > 308);
$$;

create table if not exists public.contribution_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  interest text not null check (interest in ('code', 'docs', 'tools', 'other')),
  message text not null check (char_length(message) between 20 and 1500),
  github text not null check (github ~ '^[A-Za-z0-9-]{1,39}$'),
  evidence text[] not null check (public.evidence_ok(evidence)),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text check (review_note is null or char_length(review_note) <= 500),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists contribution_requests_one_pending
  on public.contribution_requests (user_id) where status = 'pending';
create index if not exists contribution_requests_status on public.contribution_requests (status, created_at desc);
alter table public.contribution_requests enable row level security;

drop policy if exists "requests: read own or admin" on public.contribution_requests;
create policy "requests: read own or admin" on public.contribution_requests
  for select using (user_id = auth.uid() or public.is_admin());

-- A member files a fresh, pending request for themselves only, and only while not yet a contributor.
drop policy if exists "requests: create own" on public.contribution_requests;
create policy "requests: create own" on public.contribution_requests
  for insert with check (
    user_id = auth.uid()
    and status = 'pending' and review_note is null and reviewed_by is null and reviewed_at is null
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'member' and p.onboarded_at is not null)
  );
-- No update or delete policies: decisions only go through review_request().
revoke update, delete on public.contribution_requests from anon, authenticated;
grant select, insert on public.contribution_requests to authenticated;

-- ── Admin actions ─────────────────────────────────────────────────────────────
create or replace function public.review_request(request_id uuid, decision text, note text default null)
returns public.contribution_requests
language plpgsql security definer set search_path = public as $$
declare r public.contribution_requests;
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  if decision not in ('approved', 'rejected') then raise exception 'invalid decision' using errcode = '22023'; end if;
  update public.contribution_requests
     set status = decision, review_note = nullif(left(trim(coalesce(note, '')), 500), ''),
         reviewed_by = auth.uid(), reviewed_at = now()
   where id = request_id and status = 'pending'
  returning * into r;
  if r.id is null then raise exception 'request is not pending' using errcode = 'P0002'; end if;
  if decision = 'approved' then
    update public.profiles set role = 'contributor' where id = r.user_id;
  end if;
  perform public.audit(case when decision = 'approved' then 'approve' else 'reject' end, r.user_id, r.id, r.review_note);
  return r;
end $$;

create or replace function public.set_contributor(target uuid, allowed boolean)
returns public.profiles
language plpgsql security definer set search_path = public as $$
declare p public.profiles;
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  update public.profiles set role = case when allowed then 'contributor' else 'member' end
   where id = target returning * into p;
  if p.id is null then raise exception 'no such member' using errcode = 'P0002'; end if;
  perform public.audit(case when allowed then 'grant' else 'revoke' end, p.id, null, null);
  return p;
end $$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.complete_onboarding(text, text, text, text, boolean) from public, anon;
revoke all on function public.list_members() from public, anon;
grant execute on function public.complete_onboarding(text, text, text, text, boolean) to authenticated;
grant execute on function public.list_members() to authenticated;
revoke all on function public.review_request(uuid, text, text) from public, anon;
revoke all on function public.set_contributor(uuid, boolean) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.review_request(uuid, text, text) to authenticated;
grant execute on function public.set_contributor(uuid, boolean) to authenticated;
