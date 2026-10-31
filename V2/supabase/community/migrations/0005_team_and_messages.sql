-- 0005 Team desks in the office, and direct messages.
-- team_seats: the founders who always have a desk in the office. Emails stay private; list_team()
-- exposes only public fields and whether they can be messaged yet (i.e. they have joined).
-- Direct messages: one conversation per pair, server-checked permission, blocks, rate limits.
-- Down: drop the tables and functions created here.

-- ── Team desks ────────────────────────────────────────────────────────────────
create table if not exists public.team_seats (
  handle text primary key check (handle ~ '^[a-z0-9-]{2,30}$'),
  email text not null unique check (email = lower(email)),
  name text not null check (char_length(name) <= 80),
  role text not null check (char_length(role) <= 80),
  linkedin text check (linkedin is null or linkedin ~ '^https://www\.linkedin\.com/'),
  avatar jsonb,
  seat int not null unique check (seat between 1 and 20)
);
alter table public.team_seats enable row level security;
revoke all on public.team_seats from anon, authenticated;

insert into public.team_seats (handle, email, name, role, linkedin, avatar, seat) values
  ('kailosh', 'kailoshkalimuthu@gmail.com', 'Kailosh', 'System architecture and development',
   'https://www.linkedin.com/in/kailoshkalimuthu/',
   '{"skin":"brown","hair":"curly","hairColor":"#1c1a1d","cloth":"tee","clothColor":"#3a3f4a","accent":"#f4f1ea","pants":"#2a2a30","facial":"stubble","brow":"flat","mouth":"smile","glasses":false,"blush":false,"lashes":false,"heavy":false}', 1),
  ('keni', 'pranauvshrinaath@northwindcipher.com', 'Keni', 'System design',
   'https://www.linkedin.com/in/pranauvshrinaath/',
   '{"skin":"tan","hair":"messy","hairColor":"#1c1a1d","cloth":"hoodie","clothColor":"#2a2a30","accent":"#f4f1ea","pants":"#363846","facial":"","brow":"soft","mouth":"smile","glasses":true,"blush":false,"lashes":false,"heavy":false}', 2)
on conflict (handle) do nothing;

-- The team member's profile, when they have joined with the seat's email.
create or replace function public.team_profile(p_handle text) returns uuid
language sql stable security definer set search_path = public as $$
  select p.id from public.team_seats t join public.profiles p on p.email = t.email
   where t.handle = p_handle and p.onboarded_at is not null;
$$;
revoke all on function public.team_profile(text) from public, anon, authenticated;

create or replace function public.list_team() returns table (
  handle text, name text, role text, linkedin text, avatar jsonb, seat int, member_handle text, joined boolean)
language sql stable security definer set search_path = public as $$
  select t.handle, t.name, t.role, t.linkedin, coalesce(p.avatar, t.avatar), t.seat, p.handle, p.id is not null
    from public.team_seats t left join public.profiles p on p.email = t.email and p.onboarded_at is not null
   order by t.seat;
$$;
grant execute on function public.list_team() to anon, authenticated;

-- Owners point a seat at a real account (for example once a founder signs up).
create or replace function public.set_team_email(p_handle text, p_email text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'not allowed' using errcode = '42501'; end if;
  update public.team_seats set email = lower(trim(p_email)) where handle = p_handle;
  if not found then raise exception 'no such seat' using errcode = 'P0002'; end if;
end $$;
grant execute on function public.set_team_email(text, text) to authenticated;

-- ── Direct messages ───────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  a uuid not null references public.profiles (id) on delete cascade,
  b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (a < b),
  unique (a, b)
);
create index if not exists conversations_a on public.conversations (a, last_message_at desc);
create index if not exists conversations_b on public.conversations (b, last_message_at desc);
alter table public.conversations enable row level security;
drop policy if exists "conversations: participants" on public.conversations;
create policy "conversations: participants" on public.conversations for select using (auth.uid() in (a, b));
revoke insert, update, delete on public.conversations from anon, authenticated;
grant select on public.conversations to authenticated;

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_by_conversation on public.messages (conversation_id, id desc);
alter table public.messages enable row level security;
drop policy if exists "messages: participants" on public.messages;
create policy "messages: participants" on public.messages for select
  using (exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.a, c.b)));
revoke insert, update, delete on public.messages from anon, authenticated;
grant select on public.messages to authenticated;

create table if not exists public.conversation_reads (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_id bigint not null default 0,
  primary key (conversation_id, user_id)
);
alter table public.conversation_reads enable row level security;
revoke all on public.conversation_reads from anon, authenticated;

create table if not exists public.blocks (
  blocker uuid not null references public.profiles (id) on delete cascade,
  blocked uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);
alter table public.blocks enable row level security;
drop policy if exists "blocks: own" on public.blocks;
create policy "blocks: own" on public.blocks for select using (blocker = auth.uid());
revoke insert, update, delete on public.blocks from anon, authenticated;
grant select on public.blocks to authenticated;

-- Who may message whom. Everyone may message the team; the team may message anyone who hasn't
-- chosen "nobody"; otherwise the recipient's choice decides. Replies are always allowed once the
-- other person has written to you. Blocks win over everything.
create or replace function public.can_message(p_to uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); policy text; to_team boolean; me_team boolean;
begin
  if me is null or p_to is null or me = p_to or not public.is_member() then return false; end if;
  if not exists (select 1 from public.profiles where id = p_to and onboarded_at is not null) then return false; end if;
  if exists (select 1 from public.blocks where (blocker = p_to and blocked = me) or (blocker = me and blocked = p_to)) then return false; end if;
  select dm_policy into policy from public.profile_privacy where user_id = p_to;
  to_team := exists (select 1 from public.team_seats t join public.profiles p on p.email = t.email where p.id = p_to);
  me_team := exists (select 1 from public.team_seats t join public.profiles p on p.email = t.email where p.id = me);
  if to_team then return true; end if;
  if coalesce(policy, 'shared_project') = 'nobody' then return false; end if;
  if me_team or policy = 'anyone' then return true; end if;
  return exists (select 1 from public.messages m join public.conversations c on c.id = m.conversation_id
                  where c.a = least(me, p_to) and c.b = greatest(me, p_to) and m.sender_id = p_to);
end $$;
grant execute on function public.can_message(uuid) to authenticated;

create or replace function public.member_id(p_handle text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles where handle = lower(p_handle) and onboarded_at is not null;
$$;
revoke all on function public.member_id(text) from public, anon, authenticated;

create or replace function public.can_message_handle(p_handle text) returns boolean
language sql stable security definer set search_path = public as $$ select public.can_message(public.member_id(p_handle)) $$;
grant execute on function public.can_message_handle(text) to authenticated;

create or replace function public.send_message(p_handle text, p_body text) returns bigint
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); target uuid := public.member_id(p_handle); conv uuid; mid bigint; me_handle text; me_name text;
begin
  if target is null then raise exception 'no such member' using errcode = 'P0002'; end if;
  if char_length(trim(coalesce(p_body, ''))) not between 1 and 2000 then raise exception 'messages are 1 to 2000 characters' using errcode = '22023'; end if;
  if not public.can_message(target) then raise exception 'you can''t message this member' using errcode = '42501'; end if;
  if not public.rate_limit_hit('dm:min:' || me, 60, 20) or not public.rate_limit_hit('dm:day:' || me, 86400, 300) then
    raise exception 'slow down a little' using errcode = '54000';
  end if;
  insert into public.conversations (a, b) values (least(me, target), greatest(me, target))
    on conflict (a, b) do update set last_message_at = now() returning id into conv;
  insert into public.messages (conversation_id, sender_id, body) values (conv, me, trim(p_body)) returning id into mid;
  insert into public.conversation_reads (conversation_id, user_id, last_read_id) values (conv, me, mid)
    on conflict (conversation_id, user_id) do update set last_read_id = excluded.last_read_id;
  select handle, full_name into me_handle, me_name from public.profiles where id = me;
  -- one unread notification per conversation is enough
  if not exists (select 1 from public.notifications where user_id = target and kind = 'message' and read_at is null and href = '/community/inbox?with=' || me_handle) then
    perform public.notify(target, 'message', 'New message from ' || me_name, '/community/inbox?with=' || me_handle);
  end if;
  return mid;
end $$;
grant execute on function public.send_message(text, text) to authenticated;

-- The caller's conversations with the other person's public details, newest first.
create or replace function public.list_conversations() returns table (
  handle text, name text, avatar_url text, last_body text, last_from_me boolean, last_at timestamptz, unread int)
language sql stable security definer set search_path = public as $$
  select o.handle, o.full_name, o.avatar_url, m.body, m.sender_id = auth.uid(), c.last_message_at,
         (select count(*)::int from public.messages x where x.conversation_id = c.id and x.sender_id <> auth.uid()
            and x.id > coalesce((select r.last_read_id from public.conversation_reads r where r.conversation_id = c.id and r.user_id = auth.uid()), 0))
    from public.conversations c
    join public.profiles o on o.id = case when c.a = auth.uid() then c.b else c.a end
    left join lateral (select body, sender_id from public.messages where conversation_id = c.id order by id desc limit 1) m on true
   where auth.uid() in (c.a, c.b)
   order by c.last_message_at desc
   limit 100;
$$;
grant execute on function public.list_conversations() to authenticated;

-- The latest messages with one member; marks them read.
create or replace function public.open_thread(p_handle text) returns table (id bigint, mine boolean, body text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); other uuid := public.member_id(p_handle); conv uuid; top bigint;
begin
  if me is null or other is null then return; end if;
  select c.id into conv from public.conversations c where c.a = least(me, other) and c.b = greatest(me, other);
  if conv is null then return; end if;
  select max(m.id) into top from public.messages m where m.conversation_id = conv;
  insert into public.conversation_reads (conversation_id, user_id, last_read_id) values (conv, me, coalesce(top, 0))
    on conflict (conversation_id, user_id) do update set last_read_id = greatest(public.conversation_reads.last_read_id, excluded.last_read_id);
  update public.notifications set read_at = now() where user_id = me and kind = 'message' and read_at is null and href = '/community/inbox?with=' || p_handle;
  return query select x.id, x.mine, x.body, x.created_at from (
    select m.id, m.sender_id = me as mine, m.body, m.created_at from public.messages m where m.conversation_id = conv order by m.id desc limit 200) x
    order by x.id;
end $$;
grant execute on function public.open_thread(text) to authenticated;

create or replace function public.unread_messages() returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum(unread), 0)::int from public.list_conversations();
$$;
grant execute on function public.unread_messages() to authenticated;

create or replace function public.set_block(p_handle text, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
declare other uuid := public.member_id(p_handle);
begin
  if auth.uid() is null or other is null or other = auth.uid() then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_on then insert into public.blocks (blocker, blocked) values (auth.uid(), other) on conflict do nothing;
  else delete from public.blocks where blocker = auth.uid() and blocked = other; end if;
end $$;
grant execute on function public.set_block(text, boolean) to authenticated;

update public.feature_flags set note = 'Direct messages (built). Chat rooms come with multiplayer.' where key = 'messaging';
