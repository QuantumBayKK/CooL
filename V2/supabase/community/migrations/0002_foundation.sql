-- 0002 Foundation: handles and profile fields, per-field privacy, capabilities, feature flags,
-- rate limits, guideline acceptance, self-serve export and deletion.
-- Down: drop the objects created here; profile columns added here can be dropped without data loss
-- elsewhere (nothing else references them).

-- ── Owner and capabilities ────────────────────────────────────────────────────
-- Owner keeps the verified-Google rule from 0001 (is_admin). Other powers are capabilities.
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$ select public.is_admin() $$;

create table if not exists public.capabilities (
  user_id uuid not null references auth.users (id) on delete cascade,
  capability text not null check (capability in ('moderate', 'create_events', 'create_projects')),
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, capability)
);
alter table public.capabilities enable row level security;
drop policy if exists "capabilities: read own or owner" on public.capabilities;
create policy "capabilities: read own or owner" on public.capabilities
  for select using (user_id = auth.uid() or public.is_owner());
revoke insert, update, delete on public.capabilities from anon, authenticated;
grant select on public.capabilities to authenticated;

create or replace function public.has_capability(p_cap text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_owner() or exists (
    select 1 from public.capabilities c where c.user_id = auth.uid() and c.capability = p_cap);
$$;

-- The audit log records more kinds of action from now on.
alter table public.admin_audit drop constraint if exists admin_audit_action_check;
alter table public.admin_audit add constraint admin_audit_action_check check (action in (
  'approve', 'reject', 'grant', 'revoke', 'capability_grant', 'capability_revoke', 'flag', 'account_delete'));

create or replace function public.set_capability(p_target uuid, p_cap text, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_on then
    insert into public.capabilities (user_id, capability, granted_by) values (p_target, p_cap, auth.uid())
    on conflict do nothing;
  else
    delete from public.capabilities where user_id = p_target and capability = p_cap;
  end if;
  perform public.audit(case when p_on then 'capability_grant' else 'capability_revoke' end, p_target, null, p_cap);
end $$;

-- ── Profile fields ────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists handle text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists timezone text;
alter table public.profiles add column if not exists skills text[] not null default '{}';
alter table public.profiles add column if not exists guidelines_accepted_at timestamptz;
alter table public.profiles drop constraint if exists profiles_handle_format;
alter table public.profiles add constraint profiles_handle_format check (handle is null or handle ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$');
alter table public.profiles drop constraint if exists profiles_bio_len;
alter table public.profiles add constraint profiles_bio_len check (bio is null or char_length(bio) <= 280);
alter table public.profiles drop constraint if exists profiles_tz_len;
alter table public.profiles add constraint profiles_tz_len check (timezone is null or char_length(timezone) <= 64);
alter table public.profiles drop constraint if exists profiles_skills_ok;
alter table public.profiles add constraint profiles_skills_ok check (
  cardinality(skills) <= 20 and array_position(skills, null) is null);
create unique index if not exists profiles_handle_unique on public.profiles (handle);

grant update (full_name, avatar, saved_issues, show_in_directory, handle, bio, timezone, skills) on public.profiles to authenticated;

-- A readable, unique handle from the name or email, e.g. "ada-lovelace" or "ada-lovelace-3f2a".
create or replace function public.make_handle(p_seed text, p_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare base text; candidate text;
begin
  base := trim(both '-' from regexp_replace(lower(coalesce(p_seed, '')), '[^a-z0-9]+', '-', 'g'));
  base := left(base, 22);
  if char_length(base) < 3 then base := 'member'; end if;
  base := trim(both '-' from base);
  candidate := base;
  if exists (select 1 from public.profiles where handle = candidate and id <> p_id) then
    candidate := base || '-' || substr(replace(p_id::text, '-', ''), 1, 4);
  end if;
  while exists (select 1 from public.profiles where handle = candidate and id <> p_id) loop
    candidate := base || '-' || substr(md5(random()::text), 1, 6);
  end loop;
  return candidate;
end $$;
revoke all on function public.make_handle(text, uuid) from public, anon, authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_name text := left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 80);
begin
  insert into public.profiles (id, email, full_name, avatar_url, handle)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    v_name,
    nullif(coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'), ''),
    public.make_handle(coalesce(nullif(v_name, ''), split_part(coalesce(new.email, ''), '@', 1)), new.id)
  )
  on conflict (id) do nothing;
  insert into public.profile_privacy (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

-- Validates profile edits the column grants allow.
create or replace function public.check_profile_edit() returns trigger
language plpgsql as $$
begin
  if new.bio is not null then new.bio := nullif(trim(new.bio), ''); end if;
  if new.handle is distinct from old.handle and new.handle is null then
    raise exception 'handle is required' using errcode = '22023';
  end if;
  new.skills := array(select distinct left(trim(s), 32) from unnest(new.skills) s where trim(s) <> '');
  return new;
end $$;
drop trigger if exists profiles_check_edit on public.profiles;
create trigger profiles_check_edit before update on public.profiles
  for each row execute function public.check_profile_edit();

-- ── Privacy ───────────────────────────────────────────────────────────────────
-- Private by default: a profile is visible to members only, details are private until shared,
-- presence is invisible and last-active is hidden.
create table if not exists public.profile_privacy (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  profile text not null default 'members' check (profile in ('public', 'members', 'private')),
  bio text not null default 'members' check (bio in ('public', 'members', 'private')),
  skills text not null default 'members' check (skills in ('public', 'members', 'private')),
  timezone text not null default 'private' check (timezone in ('public', 'members', 'private')),
  presence text not null default 'invisible' check (presence in ('invisible', 'online', 'room', 'project', 'availability')),
  show_last_active boolean not null default false,
  dm_policy text not null default 'shared_project' check (dm_policy in ('anyone', 'shared_project', 'nobody')),
  updated_at timestamptz not null default now()
);
alter table public.profile_privacy enable row level security;
drop policy if exists "privacy: read own" on public.profile_privacy;
create policy "privacy: read own" on public.profile_privacy for select using (user_id = auth.uid());
drop policy if exists "privacy: update own" on public.profile_privacy;
create policy "privacy: update own" on public.profile_privacy for update using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke insert, delete on public.profile_privacy from anon, authenticated;
grant select, update (profile, bio, skills, timezone, presence, show_last_active, dm_policy) on public.profile_privacy to authenticated;
drop trigger if exists privacy_touch on public.profile_privacy;
create trigger privacy_touch before update on public.profile_privacy
  for each row execute function public.touch_updated_at();

-- Backfill handles and privacy rows for existing accounts.
update public.profiles p set handle = public.make_handle(coalesce(nullif(p.full_name, ''), split_part(p.email, '@', 1)), p.id)
 where p.handle is null;
insert into public.profile_privacy (user_id) select id from public.profiles on conflict do nothing;

-- What one viewer may see of another member's profile. Anonymous viewers get public fields only.
create or replace function public.get_profile(p_handle text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p public.profiles; v public.profile_privacy; viewer_is_member boolean; self boolean;
  can_see boolean;
begin
  select * into p from public.profiles where handle = lower(p_handle) and onboarded_at is not null;
  if p.id is null then return null; end if;
  select * into v from public.profile_privacy where user_id = p.id;
  -- coalesce: for visitors auth.uid() is null, and a null here would skip the privacy check below.
  self := coalesce(auth.uid() = p.id, false);
  viewer_is_member := exists (select 1 from public.profiles m where m.id = auth.uid() and m.onboarded_at is not null);
  can_see := self or v.profile = 'public' or (v.profile = 'members' and viewer_is_member);
  if can_see is not true then return null; end if;
  return jsonb_strip_nulls(jsonb_build_object(
    'handle', p.handle,
    'name', p.full_name,
    'avatar_url', p.avatar_url,
    'avatar', p.avatar,
    'role', p.role,
    'joined_at', p.onboarded_at,
    'bio', case when self or v.bio = 'public' or (v.bio = 'members' and viewer_is_member) then p.bio end,
    'skills', case when self or v.skills = 'public' or (v.skills = 'members' and viewer_is_member) then to_jsonb(p.skills) end,
    'timezone', case when self or v.timezone = 'public' or (v.timezone = 'members' and viewer_is_member) then p.timezone end,
    'self', self
  ));
end $$;
revoke all on function public.get_profile(text) from public;
grant execute on function public.get_profile(text) to anon, authenticated;

-- Public directory of profiles whose owners chose 'public' (visitors) or 'members' (signed-in members).
create or replace function public.list_profiles(p_limit int default 200) returns table (
  handle text, name text, avatar_url text, avatar jsonb, role text, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.handle, p.full_name, p.avatar_url, p.avatar, p.role, p.onboarded_at
    from public.profiles p join public.profile_privacy v on v.user_id = p.id
   where p.onboarded_at is not null and p.handle is not null
     and (v.profile = 'public'
          or (v.profile = 'members' and exists (select 1 from public.profiles me where me.id = auth.uid() and me.onboarded_at is not null)))
   order by p.onboarded_at desc
   limit least(greatest(p_limit, 1), 500);
$$;
revoke all on function public.list_profiles(int) from public;
grant execute on function public.list_profiles(int) to anon, authenticated;

-- ── Guidelines ────────────────────────────────────────────────────────────────
create or replace function public.accept_guidelines() returns void
language sql security definer set search_path = public as $$
  update public.profiles set guidelines_accepted_at = coalesce(guidelines_accepted_at, now()) where id = auth.uid();
$$;
revoke all on function public.accept_guidelines() from public, anon;
grant execute on function public.accept_guidelines() to authenticated;

-- ── Feature flags ─────────────────────────────────────────────────────────────
create table if not exists public.feature_flags (
  key text primary key check (key ~ '^[a-z0-9_.]{2,48}$'),
  enabled boolean not null default false,
  note text check (note is null or char_length(note) <= 200),
  updated_at timestamptz not null default now()
);
alter table public.feature_flags enable row level security;
drop policy if exists "flags: readable" on public.feature_flags;
create policy "flags: readable" on public.feature_flags for select using (true);
revoke insert, update, delete on public.feature_flags from anon, authenticated;
grant select on public.feature_flags to anon, authenticated;
insert into public.feature_flags (key, enabled, note) values
  ('world', true, 'The pixel office'),
  ('world.multiplayer', false, 'Phase 3: realtime rooms'),
  ('commons', false, 'Phase 5: proposals and voting'),
  ('calendar', false, 'Phase 6: scheduling and meetings'),
  ('messaging', false, 'Phase 7: chat and direct messages')
on conflict (key) do nothing;

create or replace function public.set_flag(p_key text, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'not allowed' using errcode = '42501'; end if;
  update public.feature_flags set enabled = p_on, updated_at = now() where key = p_key;
  if not found then raise exception 'no such flag' using errcode = 'P0002'; end if;
  perform public.audit('flag', null, null, p_key || '=' || p_on::text);
end $$;

-- ── Rate limits ───────────────────────────────────────────────────────────────
-- Fixed-window counters. Returns true when the call is allowed. Called by other functions only.
create table if not exists public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

create or replace function public.rate_limit_hit(p_key text, p_window_seconds int, p_max int) returns boolean
language plpgsql security definer set search_path = public as $$
declare w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n int;
begin
  insert into public.rate_limits (key, window_start, hits) values (p_key, w, 1)
  on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into n;
  delete from public.rate_limits where window_start < now() - interval '1 day';
  return n <= p_max;
end $$;
revoke all on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;

-- ── Your data ─────────────────────────────────────────────────────────────────
create or replace function public.export_my_data() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'privacy', (select to_jsonb(v) - 'user_id' from public.profile_privacy v where v.user_id = auth.uid()),
    'capabilities', coalesce((select jsonb_agg(c.capability) from public.capabilities c where c.user_id = auth.uid()), '[]'::jsonb),
    'contribution_requests', coalesce((select jsonb_agg(to_jsonb(r) - 'reviewed_by') from public.contribution_requests r where r.user_id = auth.uid()), '[]'::jsonb)
  );
$$;
revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

-- Deletes the caller's account and everything that cascades from it. The caller must type DELETE.
create or replace function public.delete_my_account(p_confirm text) returns void
language plpgsql security definer set search_path = public, auth as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  if p_confirm is distinct from 'DELETE' then raise exception 'type DELETE to confirm' using errcode = '22023'; end if;
  if public.is_owner() then raise exception 'owners cannot delete themselves here' using errcode = '42501'; end if;
  perform public.audit('account_delete', me, null, null);
  delete from auth.users where id = me;
end $$;
revoke all on function public.delete_my_account(text) from public, anon;
grant execute on function public.delete_my_account(text) to authenticated;

grant execute on function public.has_capability(text) to authenticated;
grant execute on function public.is_owner() to authenticated;
revoke all on function public.set_capability(uuid, text, boolean) from public, anon;
grant execute on function public.set_capability(uuid, text, boolean) to authenticated;
revoke all on function public.set_flag(text, boolean) from public, anon;
grant execute on function public.set_flag(text, boolean) to authenticated;
