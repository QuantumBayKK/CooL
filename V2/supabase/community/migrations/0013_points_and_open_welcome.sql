-- 0013 Points for contribution, and a welcome that isn't only about CooL (owner decision, 31 Oct 2026).
-- Points are computed from what members actually did, never stored, so they can't be edited or faked.
-- Votes count only in public polls: anonymous ballots stay unlinkable to a person, even by a points change.
-- "Have you tried CooL?" becomes optional (the community covers any project).
-- Down: restore complete_onboarding, get_profile and list_profiles from 0001/0002; drop points and my_points.

create or replace function public.complete_onboarding(
  p_name text, p_tried text, p_usage text, p_reason text, p_directory boolean
) returns public.profiles
language plpgsql security definer set search_path = public as $$
declare p public.profiles;
begin
  if auth.uid() is null then raise exception 'sign in first' using errcode = '42501'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 80 then raise exception 'name must be 2 to 80 characters' using errcode = '22023'; end if;
  if p_tried is not null and p_tried not in ('used', 'read', 'not_yet') then raise exception 'invalid answer' using errcode = '22023'; end if;
  if char_length(trim(coalesce(p_reason, ''))) not between 10 and 1000 then raise exception 'tell us a little more about what you want to build (10 to 1000 characters)' using errcode = '22023'; end if;
  if char_length(coalesce(p_usage, '')) > 500 then raise exception 'usage is too long' using errcode = '22023'; end if;
  update public.profiles
     set full_name = trim(p_name), tried_cool = coalesce(p_tried, tried_cool),
         cool_usage = coalesce(nullif(trim(coalesce(p_usage, '')), ''), cool_usage), join_reason = trim(p_reason),
         show_in_directory = coalesce(p_directory, false), onboarded_at = coalesce(onboarded_at, now())
   where id = auth.uid() returning * into p;
  return p;
end $$;

-- What a member has earned, part by part. Internal: callers below decide who may see it.
create or replace function public.points_parts(p_user uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'joined',       (select case when onboarded_at is not null and guidelines_accepted_at is not null then 50 else 0 end from public.profiles where id = p_user),
    'character',    (select case when avatar is not null then 20 else 0 end from public.profiles where id = p_user),
    'desk',         (select case when exists (select 1 from public.desks where owner = p_user) then 10 else 0 end),
    'proposals',    (select 40 * count(*) from public.proposals where author_id = p_user and status <> 'draft'),
    'comments',     (select least(5 * count(*), 200) from public.proposal_comments where author_id = p_user and deleted_at is null and hidden_reason is null),
    'votes',        (select 10 * count(*) from public.ballots b join public.polls pl on pl.id = b.poll_id where b.voter_id = p_user and pl.visibility = 'public'),
    'contributions',(select 100 * count(*) from public.contribution_requests where user_id = p_user and status = 'approved')
                    + (select case when role = 'contributor' then 100 else 0 end from public.profiles where id = p_user)
  );
$$;
revoke all on function public.points_parts(uuid) from public, anon, authenticated;

create or replace function public.points_total(p_user uuid) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum(value::int), 0)::int from jsonb_each_text(public.points_parts(p_user));
$$;
revoke all on function public.points_total(uuid) from public, anon, authenticated;

-- Your own points, with the breakdown.
create or replace function public.my_points() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null then null
    else jsonb_build_object('total', public.points_total(auth.uid()), 'parts', public.points_parts(auth.uid())) end;
$$;
revoke all on function public.my_points() from public, anon;
grant execute on function public.my_points() to authenticated;

-- Profiles now carry their total points; everything else is unchanged from 0002.
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
    'points', public.points_total(p.id),
    'bio', case when self or v.bio = 'public' or (v.bio = 'members' and viewer_is_member) then p.bio end,
    'skills', case when self or v.skills = 'public' or (v.skills = 'members' and viewer_is_member) then to_jsonb(p.skills) end,
    'timezone', case when self or v.timezone = 'public' or (v.timezone = 'members' and viewer_is_member) then p.timezone end,
    'self', self
  ));
end $$;
revoke all on function public.get_profile(text) from public;
grant execute on function public.get_profile(text) to anon, authenticated;

drop function if exists public.list_profiles(int);
create function public.list_profiles(p_limit int default 200) returns table (
  handle text, name text, avatar_url text, avatar jsonb, role text, joined_at timestamptz, points int)
language sql stable security definer set search_path = public as $$
  select p.handle, p.full_name, p.avatar_url, p.avatar, p.role, p.onboarded_at, public.points_total(p.id)
    from public.profiles p join public.profile_privacy v on v.user_id = p.id
   where p.onboarded_at is not null and p.handle is not null
     and (v.profile = 'public'
          or (v.profile = 'members' and exists (select 1 from public.profiles me where me.id = auth.uid() and me.onboarded_at is not null)))
   order by p.onboarded_at desc
   limit least(greatest(p_limit, 1), 500);
$$;
revoke all on function public.list_profiles(int) from public;
grant execute on function public.list_profiles(int) to anon, authenticated;
