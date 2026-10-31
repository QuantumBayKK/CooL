-- 0014 Meetings for the whole community (owner decision, 31 Oct 2026). A member shares a Google Meet
-- link and every member sees it, on every office floor and every community page, and gets a
-- notification, until the host ends it or three hours pass. Only meet.google.com codes are stored.
-- The table is reachable only through the functions below.
-- Down: drop the functions and the table.

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  host uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  link text not null check (link ~ '^https://meet\.google\.com/[a-z]{3}-[a-z]{4}-[a-z]{3}$'),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null default now() + interval '3 hours',
  ended_at timestamptz
);
create index if not exists meetings_live on public.meetings (ends_at) where ended_at is null;
alter table public.meetings enable row level security;
revoke all on public.meetings from anon, authenticated;

-- Start (or replace) your meeting and tell everyone. Returns its id.
create or replace function public.start_meeting(p_title text, p_link text) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); code text; t text; id uuid; host_name text;
begin
  if not public.is_member() then raise exception 'members only' using errcode = '42501'; end if;
  code := substring(lower(trim(coalesce(p_link, ''))) from '(?:^|meet\.google\.com/)([a-z]{3}-[a-z]{4}-[a-z]{3})(?:$|[^a-z-])');
  if code is null then raise exception 'that is not a Google Meet link' using errcode = '22023'; end if;
  t := nullif(trim(coalesce(p_title, '')), '');
  if t is not null and char_length(t) > 80 then raise exception 'title is too long' using errcode = '22023'; end if;
  if not public.rate_limit_hit('meet:' || me, 3600, 10) then raise exception 'too many meetings; try again later' using errcode = 'P0001'; end if;
  select split_part(full_name, ' ', 1) into host_name from public.profiles where profiles.id = me;
  update public.meetings set ended_at = now() where host = me and ended_at is null;
  insert into public.meetings (host, title, link) values (me, coalesce(t, host_name || '''s meeting'), 'https://meet.google.com/' || code)
  returning meetings.id into id;
  -- Everyone else who has joined hears about it, except people who blocked the host.
  insert into public.notifications (user_id, kind, title, href)
  select p.id, 'meeting', left(host_name || ' started a Google Meet: ' || coalesce(t, 'join in'), 200), '/community'
    from public.profiles p
   where p.id <> me and p.onboarded_at is not null and p.guidelines_accepted_at is not null
     and not exists (select 1 from public.blocks b where b.blocker = p.id and b.blocked = me);
  return id;
end $$;
revoke all on function public.start_meeting(text, text) from public, anon;
grant execute on function public.start_meeting(text, text) to authenticated;

create or replace function public.end_meeting() returns void
language sql security definer set search_path = public as $$
  update public.meetings set ended_at = now() where host = auth.uid() and ended_at is null;
$$;
revoke all on function public.end_meeting() from public, anon;
grant execute on function public.end_meeting() to authenticated;

-- Live meetings, for members only (visitors get nothing).
create or replace function public.list_meetings() returns table (
  id uuid, title text, link text, host_name text, host_handle text, started_at timestamptz, mine boolean)
language sql stable security definer set search_path = public as $$
  select m.id, m.title, m.link, split_part(p.full_name, ' ', 1), p.handle, m.started_at, m.host = auth.uid()
    from public.meetings m join public.profiles p on p.id = m.host
   where public.is_member() and m.ended_at is null and m.ends_at > now()
   order by m.started_at desc
   limit 20;
$$;
revoke all on function public.list_meetings() from public, anon;
grant execute on function public.list_meetings() to authenticated;
