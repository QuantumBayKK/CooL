-- 0003 The Commons: proposals with versions and a server-enforced lifecycle, threaded comments,
-- followers, a reusable poll engine (single, multi, yes/no/abstain, ranked choice, interest),
-- eligibility snapshots, one ballot per voter, server-side tallying, decision records, notifications.
-- Down: drop the tables and functions created here (no earlier object depends on them).

-- ── Notifications (used by every later feature) ──────────────────────────────
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (char_length(kind) <= 40),
  title text not null check (char_length(title) <= 200),
  href text check (href is null or href ~ '^/community(/|$)'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_unread on public.notifications (user_id, created_at desc) where read_at is null;
alter table public.notifications enable row level security;
drop policy if exists "notifications: own" on public.notifications;
create policy "notifications: own" on public.notifications for select using (user_id = auth.uid());
drop policy if exists "notifications: mark read" on public.notifications;
create policy "notifications: mark read" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke insert, update, delete on public.notifications from anon, authenticated;
grant select, update (read_at) on public.notifications to authenticated;

create or replace function public.notify(p_user uuid, p_kind text, p_title text, p_href text) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, title, href) values (p_user, p_kind, left(p_title, 200), p_href);
$$;
revoke all on function public.notify(uuid, text, text, text) from public, anon, authenticated;

-- ── Helpers ───────────────────────────────────────────────────────────────────
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and onboarded_at is not null and guidelines_accepted_at is not null);
$$;
grant execute on function public.is_member() to anon, authenticated;

-- ── Proposals ─────────────────────────────────────────────────────────────────
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 4 and 80),
  summary text not null check (char_length(summary) between 20 and 280),
  category text not null check (category in ('ai', 'security', 'devtools', 'infrastructure', 'privacy', 'data', 'education', 'research', 'design', 'documentation', 'hardware', 'other')),
  project_type text not null check (project_type in ('library', 'application', 'research', 'tool', 'framework', 'dataset', 'documentation', 'other')),
  seeks_team boolean not null default true,
  beginner_friendly boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'discussion', 'revision_requested', 'voting_scheduled', 'voting_open',
    'passed', 'not_passed', 'withdrawn', 'incubation', 'recruiting', 'approved_to_launch', 'active', 'completed', 'paused', 'archived')),
  current_version int not null default 1,
  duplicate_of uuid references public.proposals (id) on delete set null,
  active_poll uuid,
  comment_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists proposals_status on public.proposals (status, updated_at desc);
create index if not exists proposals_search on public.proposals using gin (to_tsvector('english', title || ' ' || summary));
alter table public.proposals enable row level security;
drop policy if exists "proposals: public unless draft" on public.proposals;
create policy "proposals: public unless draft" on public.proposals for select
  using (status <> 'draft' or author_id = auth.uid() or public.has_capability('moderate'));
revoke insert, update, delete on public.proposals from anon, authenticated;
grant select on public.proposals to anon, authenticated;

-- Every §13 field lives in an immutable version row; the proposal points at the current one.
create table if not exists public.proposal_versions (
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  version int not null,
  fields jsonb not null check (pg_column_size(fields) < 32768),
  material boolean not null default false,
  change_note text check (change_note is null or char_length(change_note) <= 300),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (proposal_id, version)
);
alter table public.proposal_versions enable row level security;
drop policy if exists "versions: as proposal" on public.proposal_versions;
create policy "versions: as proposal" on public.proposal_versions for select
  using (exists (select 1 from public.proposals p where p.id = proposal_id));
revoke insert, update, delete on public.proposal_versions from anon, authenticated;
grant select on public.proposal_versions to anon, authenticated;

create table if not exists public.proposal_status_history (
  id bigint generated always as identity primary key,
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_id uuid references public.profiles (id) on delete set null,
  reason text check (reason is null or char_length(reason) <= 500),
  at timestamptz not null default now()
);
alter table public.proposal_status_history enable row level security;
drop policy if exists "history: as proposal" on public.proposal_status_history;
create policy "history: as proposal" on public.proposal_status_history for select
  using (exists (select 1 from public.proposals p where p.id = proposal_id));
revoke insert, update, delete on public.proposal_status_history from anon, authenticated;
grant select on public.proposal_status_history to anon, authenticated;

create table if not exists public.proposal_followers (
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (proposal_id, user_id)
);
alter table public.proposal_followers enable row level security;
drop policy if exists "followers: own" on public.proposal_followers;
create policy "followers: own" on public.proposal_followers for select using (user_id = auth.uid());
drop policy if exists "followers: follow" on public.proposal_followers;
create policy "followers: follow" on public.proposal_followers for insert with check (user_id = auth.uid() and public.is_member());
drop policy if exists "followers: unfollow" on public.proposal_followers;
create policy "followers: unfollow" on public.proposal_followers for delete using (user_id = auth.uid());
revoke update on public.proposal_followers from anon, authenticated;
grant select, insert, delete on public.proposal_followers to authenticated;

create table if not exists public.proposal_comments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  parent_id uuid references public.proposal_comments (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 4000),
  edited_at timestamptz,
  deleted_at timestamptz,
  hidden_reason text,
  created_at timestamptz not null default now()
);
create index if not exists comments_by_proposal on public.proposal_comments (proposal_id, created_at);
alter table public.proposal_comments enable row level security;
drop policy if exists "comments: as proposal" on public.proposal_comments;
create policy "comments: as proposal" on public.proposal_comments for select
  using (exists (select 1 from public.proposals p where p.id = proposal_id));
revoke insert, update, delete on public.proposal_comments from anon, authenticated;
grant select on public.proposal_comments to anon, authenticated;

-- Comments read through this view: removed and hidden comments keep their place in the thread but lose their text.
create or replace view public.proposal_comments_public with (security_invoker = true) as
  select c.id, c.proposal_id, c.parent_id, c.created_at, c.edited_at,
         case when c.deleted_at is not null then '[deleted]' when c.hidden_reason is not null then '[removed by a moderator]' else c.body end as body,
         c.deleted_at is not null or c.hidden_reason is not null as removed,
         case when c.deleted_at is null then c.author_id end as author_id,
         pr.full_name as author_name, pr.handle as author_handle, pr.avatar_url as author_avatar
    from public.proposal_comments c left join public.profiles pr on pr.id = c.author_id and c.deleted_at is null;
grant select on public.proposal_comments_public to anon, authenticated;
-- profiles' own RLS would hide author names from visitors; the view exposes only name, handle and photo.
create or replace function public.comment_authors(p_proposal uuid) returns table (id uuid, name text, handle text, avatar_url text)
language sql stable security definer set search_path = public as $$
  select distinct p.id, p.full_name, p.handle, p.avatar_url
    from public.proposal_comments c join public.profiles p on p.id = c.author_id
   where c.proposal_id = p_proposal and c.deleted_at is null
  union
  select p.id, p.full_name, p.handle, p.avatar_url from public.proposals x join public.profiles p on p.id = x.author_id where x.id = p_proposal and x.status <> 'draft';
$$;
grant execute on function public.comment_authors(uuid) to anon, authenticated;

-- ── Lifecycle ─────────────────────────────────────────────────────────────────
-- Allowed transitions and who may make them: author (A), moderator (M), owner (O), system (S: poll close).
create table if not exists public.proposal_transitions (
  from_status text not null, to_status text not null, actors text not null,
  primary key (from_status, to_status)
);
alter table public.proposal_transitions enable row level security;
drop policy if exists "transitions: readable" on public.proposal_transitions;
create policy "transitions: readable" on public.proposal_transitions for select using (true);
grant select on public.proposal_transitions to anon, authenticated;
delete from public.proposal_transitions;
insert into public.proposal_transitions values
  ('draft', 'submitted', 'A'), ('submitted', 'discussion', 'S'),
  ('discussion', 'revision_requested', 'MO'), ('revision_requested', 'discussion', 'A'),
  ('discussion', 'voting_scheduled', 'MO'), ('voting_scheduled', 'voting_open', 'S'), ('discussion', 'voting_open', 'MO'),
  ('voting_open', 'discussion', 'S'),
  ('voting_open', 'passed', 'S'), ('voting_open', 'not_passed', 'S'),
  ('passed', 'incubation', 'O'), ('incubation', 'recruiting', 'O'), ('recruiting', 'approved_to_launch', 'O'),
  ('approved_to_launch', 'active', 'O'), ('active', 'completed', 'O'), ('active', 'paused', 'O'), ('paused', 'active', 'O'),
  ('draft', 'withdrawn', 'A'), ('submitted', 'withdrawn', 'A'), ('discussion', 'withdrawn', 'A'), ('revision_requested', 'withdrawn', 'A'), ('voting_scheduled', 'withdrawn', 'A'),
  ('discussion', 'archived', 'MO'), ('revision_requested', 'archived', 'MO'), ('not_passed', 'archived', 'MO'), ('withdrawn', 'archived', 'MO'),
  ('completed', 'archived', 'O'), ('paused', 'archived', 'O');

create or replace function public.move_proposal(p_id uuid, p_to text, p_reason text, p_system boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare p public.proposals; who text; allowed text;
begin
  select * into p from public.proposals where id = p_id for update;
  if p.id is null then raise exception 'no such proposal' using errcode = 'P0002'; end if;
  select actors into allowed from public.proposal_transitions where from_status = p.status and to_status = p_to;
  if allowed is null then raise exception 'cannot move from % to %', p.status, p_to using errcode = '22023'; end if;
  who := case when p_system then 'S' else '' end
      || case when p.author_id = auth.uid() then 'A' else '' end
      || case when public.has_capability('moderate') then 'M' else '' end
      || case when public.is_owner() then 'O' else '' end;
  if not exists (select 1 from regexp_split_to_table(allowed, '') a where position(a in who) > 0) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.proposals set status = p_to, updated_at = now() where id = p_id;
  insert into public.proposal_status_history (proposal_id, from_status, to_status, actor_id, reason)
    values (p_id, p.status, p_to, case when p_system then null else auth.uid() end, nullif(left(trim(coalesce(p_reason, '')), 500), ''));
  -- Followers and the author hear about every change.
  insert into public.notifications (user_id, kind, title, href)
    select distinct u, 'proposal.status', format('"%s" is now %s', p.title, replace(p_to, '_', ' ')), '/community/proposals/' || p_id
      from (select p.author_id u union select user_id from public.proposal_followers where proposal_id = p_id) x
     where u is distinct from auth.uid();
end $$;
revoke all on function public.move_proposal(uuid, text, text, boolean) from public, anon, authenticated;

-- Public entry point: members and staff move proposals; the system flag is never accepted from clients.
create or replace function public.transition_proposal(p_id uuid, p_to text, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_to in ('revision_requested', 'archived') and char_length(trim(coalesce(p_reason, ''))) < 5 then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  perform public.move_proposal(p_id, p_to, p_reason, false);
end $$;
grant execute on function public.transition_proposal(uuid, text, text) to authenticated;

-- Validates the §13 fields. Long-form fields are optional except problem and solution.
create or replace function public.proposal_fields_ok(f jsonb) returns boolean
language sql immutable as $$
  select jsonb_typeof(f) = 'object'
     and char_length(coalesce(f ->> 'problem', '')) between 20 and 4000
     and char_length(coalesce(f ->> 'solution', '')) between 20 and 4000
     and not exists (select 1 from jsonb_each(f) e where e.key not in (
       'problem', 'audience', 'solution', 'why', 'scope_mvp', 'out_of_scope', 'stack', 'roles_needed', 'suggested_lead',
       'repo_url', 'license', 'considerations', 'milestones', 'risks', 'tags')
       or (e.key <> 'tags' and (jsonb_typeof(e.value) <> 'string' or char_length(e.value #>> '{}') > 4000)))
     and (f -> 'tags' is null or (jsonb_typeof(f -> 'tags') = 'array' and jsonb_array_length(f -> 'tags') <= 8))
     and (coalesce(f ->> 'repo_url', '') = '' or (f ->> 'repo_url') ~ '^https://[^[:space:]]{4,}$');
$$;

create or replace function public.create_proposal(p_title text, p_summary text, p_category text, p_type text,
  p_seeks_team boolean, p_beginner boolean, p_fields jsonb, p_submit boolean) returns uuid
language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if not public.is_member() then raise exception 'finish joining first' using errcode = '42501'; end if;
  if not public.rate_limit_hit('proposal:' || auth.uid(), 86400, 3) then raise exception 'you can create 3 proposals a day' using errcode = '54000'; end if;
  if not public.proposal_fields_ok(p_fields) then raise exception 'check the proposal fields' using errcode = '22023'; end if;
  insert into public.proposals (author_id, title, summary, category, project_type, seeks_team, beginner_friendly)
    values (auth.uid(), trim(p_title), trim(p_summary), p_category, p_type, coalesce(p_seeks_team, true), coalesce(p_beginner, false))
    returning id into new_id;
  insert into public.proposal_versions (proposal_id, version, fields, created_by) values (new_id, 1, p_fields, auth.uid());
  insert into public.proposal_followers (proposal_id, user_id) values (new_id, auth.uid());
  insert into public.proposal_status_history (proposal_id, from_status, to_status, actor_id) values (new_id, null, 'draft', auth.uid());
  if p_submit then perform public.submit_proposal(new_id); end if;
  return new_id;
end $$;
grant execute on function public.create_proposal(text, text, text, text, boolean, boolean, jsonb, boolean) to authenticated;

create or replace function public.submit_proposal(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.move_proposal(p_id, 'submitted', null, false);
  perform public.move_proposal(p_id, 'discussion', 'Open for discussion', true);
end $$;
grant execute on function public.submit_proposal(uuid) to authenticated;

-- Authors edit in draft, discussion or revision. A material edit during an open vote invalidates
-- the vote with a public record and returns the proposal to discussion.
create or replace function public.edit_proposal(p_id uuid, p_title text, p_summary text, p_fields jsonb, p_material boolean, p_note text)
returns int language plpgsql security definer set search_path = public as $$
declare p public.proposals; v int;
begin
  select * into p from public.proposals where id = p_id for update;
  if p.id is null or p.author_id <> auth.uid() then raise exception 'not allowed' using errcode = '42501'; end if;
  if p.status not in ('draft', 'discussion', 'revision_requested', 'voting_scheduled', 'voting_open') then
    raise exception 'this proposal can no longer be edited' using errcode = '22023';
  end if;
  if not public.proposal_fields_ok(p_fields) then raise exception 'check the proposal fields' using errcode = '22023'; end if;
  if p.status = 'voting_open' and not coalesce(p_material, false) then
    raise exception 'during a vote only material edits are allowed, and they restart the vote' using errcode = '22023';
  end if;
  v := p.current_version + 1;
  insert into public.proposal_versions (proposal_id, version, fields, material, change_note, created_by)
    values (p_id, v, p_fields, coalesce(p_material, false), nullif(left(trim(coalesce(p_note, '')), 300), ''), auth.uid());
  update public.proposals set title = trim(p_title), summary = trim(p_summary), current_version = v, updated_at = now() where id = p_id;
  if p.status = 'voting_open' and p.active_poll is not null then
    perform public.invalidate_poll_internal(p.active_poll, 'The proposal changed materially during the vote (version ' || v || '). The vote restarts after discussion.');
    perform public.move_proposal(p_id, 'discussion', 'Material edit during voting', true);
  end if;
  return v;
end $$;
grant execute on function public.edit_proposal(uuid, text, text, jsonb, boolean, text) to authenticated;

create or replace function public.mark_duplicate(p_id uuid, p_of uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_capability('moderate') then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_id = p_of or not exists (select 1 from public.proposals where id = p_of) then raise exception 'invalid duplicate' using errcode = '22023'; end if;
  update public.proposals set duplicate_of = p_of where id = p_id;
  perform public.move_proposal(p_id, 'archived', coalesce(nullif(trim(p_reason), ''), 'Duplicate'), false);
end $$;
grant execute on function public.mark_duplicate(uuid, uuid, text) to authenticated;

-- ── Comments ──────────────────────────────────────────────────────────────────
create or replace function public.add_comment(p_proposal uuid, p_parent uuid, p_body text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid; p public.proposals;
begin
  if not public.is_member() then raise exception 'finish joining first' using errcode = '42501'; end if;
  select * into p from public.proposals where id = p_proposal;
  if p.id is null or p.status = 'draft' then raise exception 'no such proposal' using errcode = 'P0002'; end if;
  if p.status in ('archived', 'withdrawn') then raise exception 'comments are closed' using errcode = '22023'; end if;
  if char_length(trim(coalesce(p_body, ''))) not between 1 and 4000 then raise exception 'comments are 1 to 4000 characters' using errcode = '22023'; end if;
  if p_parent is not null and not exists (select 1 from public.proposal_comments where id = p_parent and proposal_id = p_proposal) then
    raise exception 'invalid reply' using errcode = '22023';
  end if;
  if not public.rate_limit_hit('comment:' || auth.uid(), 60, 5) then raise exception 'slow down a little' using errcode = '54000'; end if;
  insert into public.proposal_comments (proposal_id, parent_id, author_id, body) values (p_proposal, p_parent, auth.uid(), trim(p_body)) returning id into cid;
  update public.proposals set comment_count = comment_count + 1, updated_at = now() where id = p_proposal;
  insert into public.notifications (user_id, kind, title, href)
    select distinct u, 'proposal.comment', format('New comment on "%s"', p.title), '/community/proposals/' || p_proposal || '#c-' || cid
      from (select p.author_id u union select user_id from public.proposal_followers where proposal_id = p_proposal
            union select author_id from public.proposal_comments where id = p_parent) x
     where u is not null and u <> auth.uid();
  return cid;
end $$;
grant execute on function public.add_comment(uuid, uuid, text) to authenticated;

create or replace function public.edit_comment(p_id uuid, p_body text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if char_length(trim(coalesce(p_body, ''))) not between 1 and 4000 then raise exception 'comments are 1 to 4000 characters' using errcode = '22023'; end if;
  update public.proposal_comments set body = trim(p_body), edited_at = now()
   where id = p_id and author_id = auth.uid() and deleted_at is null and hidden_reason is null;
  if not found then raise exception 'not allowed' using errcode = '42501'; end if;
end $$;
grant execute on function public.edit_comment(uuid, text) to authenticated;

create or replace function public.delete_comment(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.proposal_comments set deleted_at = now() where id = p_id and author_id = auth.uid() and deleted_at is null;
  if not found then raise exception 'not allowed' using errcode = '42501'; end if;
end $$;
grant execute on function public.delete_comment(uuid) to authenticated;

create or replace function public.hide_comment(p_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_capability('moderate') then raise exception 'not allowed' using errcode = '42501'; end if;
  if char_length(trim(coalesce(p_reason, ''))) < 5 then raise exception 'a reason is required' using errcode = '22023'; end if;
  update public.proposal_comments set hidden_reason = left(trim(p_reason), 300) where id = p_id;
  perform public.audit('flag', null, null, 'comment hidden: ' || p_id || ' — ' || left(trim(p_reason), 200));
end $$;
grant execute on function public.hide_comment(uuid, text) to authenticated;

-- ── Polls ─────────────────────────────────────────────────────────────────────
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('proposal', 'community')),
  subject_id uuid,
  question text not null check (char_length(question) between 5 and 200),
  context text check (context is null or char_length(context) <= 2000),
  kind text not null check (kind in ('single', 'multi', 'yes_no_abstain', 'ranked', 'interest')),
  binding boolean not null,
  eligibility text not null check (eligibility in ('members', 'contributors', 'followers')),
  min_account_days int not null default 7 check (min_account_days between 0 and 365),
  max_choices int check (max_choices is null or max_choices between 1 and 20),
  opens_at timestamptz not null default now(),
  closes_at timestamptz not null,
  quorum int not null default 0 check (quorum >= 0),
  pass_rule text check (pass_rule in ('simple_majority', 'two_thirds', 'plurality')),
  vote_change boolean not null default true,
  visibility text not null default 'anonymous' check (visibility in ('anonymous', 'public')),
  decision_owner text not null default 'Northwind Cipher team' check (char_length(decision_owner) <= 80),
  next_action text check (next_action is null or char_length(next_action) <= 300),
  status text not null default 'open' check (status in ('scheduled', 'open', 'closed', 'invalidated')),
  invalidated_reason text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (closes_at > opens_at)
);
create index if not exists polls_active on public.polls (status, closes_at);
alter table public.polls enable row level security;
drop policy if exists "polls: public" on public.polls;
create policy "polls: public" on public.polls for select using (true);
revoke insert, update, delete on public.polls from anon, authenticated;
grant select on public.polls to anon, authenticated;

alter table public.proposals drop constraint if exists proposals_active_poll_fk;
alter table public.proposals add constraint proposals_active_poll_fk foreign key (active_poll) references public.polls (id) on delete set null;

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  position int not null,
  label text not null check (char_length(label) between 1 and 120),
  description text check (description is null or char_length(description) <= 300),
  unique (poll_id, position)
);
alter table public.poll_options enable row level security;
drop policy if exists "options: public" on public.poll_options;
create policy "options: public" on public.poll_options for select using (true);
revoke insert, update, delete on public.poll_options from anon, authenticated;
grant select on public.poll_options to anon, authenticated;

-- Who may vote, frozen when the poll opens: accounts created later cannot join a running vote.
create table if not exists public.poll_eligibility (
  poll_id uuid not null references public.polls (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (poll_id, user_id)
);
alter table public.poll_eligibility enable row level security;
drop policy if exists "eligibility: own" on public.poll_eligibility;
create policy "eligibility: own" on public.poll_eligibility for select using (user_id = auth.uid());
revoke insert, update, delete on public.poll_eligibility from anon, authenticated;
grant select on public.poll_eligibility to authenticated;

create table if not exists public.ballots (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (poll_id, voter_id)
);
create table if not exists public.ballot_choices (
  ballot_id uuid not null references public.ballots (id) on delete cascade,
  option_id uuid not null references public.poll_options (id) on delete cascade,
  rank int check (rank is null or rank between 1 and 20),
  primary key (ballot_id, option_id)
);
-- Ballots and choices are never readable directly. Voters see their own ballot through my_ballot();
-- totals come from poll_results. No policy means no access for anon/authenticated.
alter table public.ballots enable row level security;
alter table public.ballot_choices enable row level security;
revoke all on public.ballots, public.ballot_choices from anon, authenticated;

create table if not exists public.poll_results (
  poll_id uuid primary key references public.polls (id) on delete cascade,
  eligible int not null,
  turnout int not null,
  quorum_met boolean not null,
  outcome text not null,
  winner uuid references public.poll_options (id) on delete set null,
  tallies jsonb not null,
  rounds jsonb,
  closed_at timestamptz not null default now()
);
alter table public.poll_results enable row level security;
drop policy if exists "results: public" on public.poll_results;
create policy "results: public" on public.poll_results for select using (true);
revoke insert, update, delete on public.poll_results from anon, authenticated;
grant select on public.poll_results to anon, authenticated;

create table if not exists public.poll_audit (
  id bigint generated always as identity primary key,
  poll_id uuid not null references public.polls (id) on delete cascade,
  action text not null check (action in ('opened', 'closed', 'invalidated')),
  actor_id uuid references public.profiles (id) on delete set null,
  note text,
  at timestamptz not null default now()
);
alter table public.poll_audit enable row level security;
drop policy if exists "poll audit: public" on public.poll_audit;
create policy "poll audit: public" on public.poll_audit for select using (true);
revoke insert, update, delete on public.poll_audit from anon, authenticated;
grant select on public.poll_audit to anon, authenticated;

create or replace function public.snapshot_eligibility(p_poll uuid) returns void
language plpgsql security definer set search_path = public as $$
declare pl public.polls;
begin
  select * into pl from public.polls where id = p_poll;
  insert into public.poll_eligibility (poll_id, user_id)
  select pl.id, p.id from public.profiles p
   where p.onboarded_at is not null and p.guidelines_accepted_at is not null
     and p.created_at <= pl.opens_at - make_interval(days => pl.min_account_days)
     and (pl.eligibility = 'members'
          or (pl.eligibility = 'contributors' and p.role = 'contributor')
          or (pl.eligibility = 'followers' and exists (select 1 from public.proposal_followers f where f.proposal_id = pl.subject_id and f.user_id = p.id)))
  on conflict do nothing;
end $$;
revoke all on function public.snapshot_eligibility(uuid) from public, anon, authenticated;

-- Owners open community polls; owners and moderators open a proposal's binding yes/no/abstain vote.
create or replace function public.create_poll(p_subject_type text, p_subject uuid, p_question text, p_context text, p_kind text,
  p_binding boolean, p_eligibility text, p_options jsonb, p_closes_at timestamptz, p_quorum int, p_pass_rule text,
  p_vote_change boolean, p_visibility text, p_max_choices int, p_next_action text, p_min_account_days int default 7) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid; o jsonb; i int := 0; pr public.proposals;
begin
  if p_subject_type = 'community' and not public.is_owner() then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_subject_type = 'proposal' then
    if not public.has_capability('moderate') then raise exception 'not allowed' using errcode = '42501'; end if;
    select * into pr from public.proposals where id = p_subject for update;
    if pr.status <> 'discussion' then raise exception 'only proposals in discussion can go to a vote' using errcode = '22023'; end if;
    if p_kind <> 'yes_no_abstain' or not p_binding then raise exception 'proposal votes are binding yes / no / abstain' using errcode = '22023'; end if;
  end if;
  if p_closes_at < now() + interval '1 hour' or p_closes_at > now() + interval '60 days' then
    raise exception 'close between 1 hour and 60 days from now' using errcode = '22023';
  end if;
  if p_kind = 'yes_no_abstain' then
    p_options := '[{"label":"Yes"},{"label":"No"},{"label":"Abstain","description":"Counts toward quorum, not toward the result."}]'::jsonb;
  end if;
  if jsonb_typeof(p_options) <> 'array' or jsonb_array_length(p_options) not between 2 and 20 then
    raise exception 'between 2 and 20 options' using errcode = '22023';
  end if;
  if p_binding and p_pass_rule is null then raise exception 'binding polls need a pass rule' using errcode = '22023'; end if;
  insert into public.polls (subject_type, subject_id, question, context, kind, binding, eligibility, max_choices, closes_at, quorum,
    pass_rule, vote_change, visibility, next_action, created_by, min_account_days)
  values (p_subject_type, p_subject, trim(p_question), nullif(trim(coalesce(p_context, '')), ''), p_kind, p_binding, p_eligibility,
    case when p_kind = 'multi' then coalesce(p_max_choices, 2) end, p_closes_at, greatest(coalesce(p_quorum, 0), 0),
    p_pass_rule, coalesce(p_vote_change, true), coalesce(p_visibility, 'anonymous'), nullif(trim(coalesce(p_next_action, '')), ''), auth.uid(),
    coalesce(p_min_account_days, 7))
  returning id into pid;
  for o in select * from jsonb_array_elements(p_options) loop
    i := i + 1;
    insert into public.poll_options (poll_id, position, label, description) values (pid, i, trim(o ->> 'label'), nullif(trim(coalesce(o ->> 'description', '')), ''));
  end loop;
  perform public.snapshot_eligibility(pid);
  insert into public.poll_audit (poll_id, action, actor_id, note) values (pid, 'opened', auth.uid(), null);
  if p_subject_type = 'proposal' then
    update public.proposals set active_poll = pid where id = p_subject;
    perform public.move_proposal(p_subject, 'voting_open', 'Vote opened', false);
  end if;
  insert into public.notifications (user_id, kind, title, href)
    select e.user_id, 'poll.opened', 'Vote open: ' || left(trim(p_question), 150), '/community/polls/' || pid
      from public.poll_eligibility e where e.poll_id = pid and e.user_id <> auth.uid();
  return pid;
end $$;
grant execute on function public.create_poll(text, uuid, text, text, text, boolean, text, jsonb, timestamptz, int, text, boolean, text, int, text, int) to authenticated;

-- One ballot per eligible voter, enforced by the unique constraint and a row lock.
-- p_choices: an array of option ids, in preference order for ranked polls.
create or replace function public.cast_ballot(p_poll uuid, p_choices uuid[]) returns void
language plpgsql security definer set search_path = public as $$
declare pl public.polls; b uuid; n int := coalesce(array_length(p_choices, 1), 0); i int;
begin
  select * into pl from public.polls where id = p_poll for share;
  if pl.id is null then raise exception 'no such poll' using errcode = 'P0002'; end if;
  if pl.status <> 'open' or now() < pl.opens_at or now() >= pl.closes_at then raise exception 'this vote is not open' using errcode = '22023'; end if;
  if not exists (select 1 from public.poll_eligibility where poll_id = p_poll and user_id = auth.uid()) then
    raise exception 'you are not eligible for this vote' using errcode = '42501';
  end if;
  if not public.rate_limit_hit('ballot:' || auth.uid(), 60, 10) then raise exception 'slow down a little' using errcode = '54000'; end if;
  if n = 0 then raise exception 'choose an option' using errcode = '22023'; end if;
  if (select count(distinct x) from unnest(p_choices) x) <> n then raise exception 'duplicate choices' using errcode = '22023'; end if;
  if exists (select 1 from unnest(p_choices) x where not exists (select 1 from public.poll_options o where o.id = x and o.poll_id = p_poll)) then
    raise exception 'unknown option' using errcode = '22023';
  end if;
  if pl.kind in ('single', 'yes_no_abstain') and n <> 1 then raise exception 'choose exactly one option' using errcode = '22023'; end if;
  if pl.kind = 'multi' and n > pl.max_choices then raise exception 'choose at most % options', pl.max_choices using errcode = '22023'; end if;

  select id into b from public.ballots where poll_id = p_poll and voter_id = auth.uid() for update;
  if b is not null then
    if not pl.vote_change then raise exception 'votes in this poll cannot be changed' using errcode = '22023'; end if;
    delete from public.ballot_choices where ballot_id = b;
    update public.ballots set updated_at = now() where id = b;
  else
    insert into public.ballots (poll_id, voter_id) values (p_poll, auth.uid()) returning id into b;
  end if;
  for i in 1 .. n loop
    insert into public.ballot_choices (ballot_id, option_id, rank) values (b, p_choices[i], case when pl.kind = 'ranked' then i end);
  end loop;
end $$;
grant execute on function public.cast_ballot(uuid, uuid[]) to authenticated;

create or replace function public.my_ballot(p_poll uuid) returns uuid[]
language sql stable security definer set search_path = public as $$
  select array_agg(c.option_id order by c.rank nulls last, c.option_id)
    from public.ballots b join public.ballot_choices c on c.ballot_id = b.id
   where b.poll_id = p_poll and b.voter_id = auth.uid();
$$;
grant execute on function public.my_ballot(uuid) to authenticated;

-- Voter names for public polls only, and only after they close.
create or replace function public.poll_voters(p_poll uuid) returns table (handle text, name text)
language sql stable security definer set search_path = public as $$
  select p.handle, p.full_name from public.ballots b join public.profiles p on p.id = b.voter_id
    join public.polls pl on pl.id = b.poll_id
   where b.poll_id = p_poll and pl.visibility = 'public' and pl.status = 'closed' order by p.full_name;
$$;
grant execute on function public.poll_voters(uuid) to anon, authenticated;

create or replace function public.poll_counts(p_poll uuid) returns table (eligible int, voted int)
language sql stable security definer set search_path = public as $$
  select (select count(*)::int from public.poll_eligibility where poll_id = p_poll),
         (select count(*)::int from public.ballots where poll_id = p_poll);
$$;
grant execute on function public.poll_counts(uuid) to anon, authenticated;

create or replace function public.invalidate_poll_internal(p_poll uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.polls set status = 'invalidated', invalidated_reason = left(p_reason, 500) where id = p_poll and status in ('open', 'scheduled');
  insert into public.poll_audit (poll_id, action, actor_id, note) values (p_poll, 'invalidated', auth.uid(), left(p_reason, 500));
  update public.proposals set active_poll = null where active_poll = p_poll;
end $$;
revoke all on function public.invalidate_poll_internal(uuid, text) from public, anon, authenticated;

-- Owners can void a poll; never edit it. The record and the reason stay public.
create or replace function public.invalidate_poll(p_poll uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare pl public.polls;
begin
  if not public.is_owner() then raise exception 'not allowed' using errcode = '42501'; end if;
  if char_length(trim(coalesce(p_reason, ''))) < 10 then raise exception 'explain why (at least 10 characters)' using errcode = '22023'; end if;
  select * into pl from public.polls where id = p_poll;
  if pl.status not in ('open', 'scheduled') then raise exception 'only open polls can be invalidated' using errcode = '22023'; end if;
  perform public.invalidate_poll_internal(p_poll, trim(p_reason));
  if pl.subject_type = 'proposal' then perform public.move_proposal(pl.subject_id, 'discussion', 'Vote invalidated: ' || trim(p_reason), true); end if;
end $$;
grant execute on function public.invalidate_poll(uuid, text) to authenticated;

-- Tallies a closed poll. Ranked polls use instant-runoff: the option with the fewest first preferences
-- is eliminated each round (ties eliminate the option listed later) until one has a majority of the
-- ballots still in play.
create or replace function public.close_poll(p_poll uuid) returns public.poll_results
language plpgsql security definer set search_path = public as $$
declare pl public.polls; r public.poll_results; elig int; turn int; qmet boolean; tallies jsonb; rounds jsonb := '[]'::jsonb;
  winner uuid; outcome text; yes int; no int; remaining uuid[]; counts jsonb; total int; top_id uuid; top_n int; low_id uuid; round_no int := 0;
begin
  select * into pl from public.polls where id = p_poll for update;
  if pl.id is null then raise exception 'no such poll' using errcode = 'P0002'; end if;
  if pl.status = 'closed' then select * into r from public.poll_results where poll_id = p_poll; return r; end if;
  if pl.status <> 'open' then raise exception 'this poll was invalidated' using errcode = '22023'; end if;
  if now() < pl.closes_at and not public.is_owner() then raise exception 'the vote is still open' using errcode = '22023'; end if;

  select count(*) into elig from public.poll_eligibility where poll_id = p_poll;
  select count(*) into turn from public.ballots where poll_id = p_poll;
  qmet := turn >= pl.quorum;
  select coalesce(jsonb_object_agg(o.id, coalesce(c.n, 0)), '{}'::jsonb) into tallies
    from public.poll_options o
    left join (select bc.option_id, count(*)::int n from public.ballot_choices bc join public.ballots b on b.id = bc.ballot_id
                where b.poll_id = p_poll and (pl.kind <> 'ranked' or bc.rank = 1) group by bc.option_id) c on c.option_id = o.id
   where o.poll_id = p_poll;

  if pl.kind = 'yes_no_abstain' then
    select (tallies ->> o.id::text)::int into yes from public.poll_options o where o.poll_id = p_poll and o.position = 1;
    select (tallies ->> o.id::text)::int into no from public.poll_options o where o.poll_id = p_poll and o.position = 2;
    outcome := case when not qmet then 'quorum_not_met'
      when pl.pass_rule = 'two_thirds' and yes * 3 >= (yes + no) * 2 and yes > 0 then 'passed'
      when coalesce(pl.pass_rule, 'simple_majority') = 'simple_majority' and yes > no then 'passed'
      else 'not_passed' end;
  elsif pl.kind = 'ranked' then
    select array_agg(id order by position) into remaining from public.poll_options where poll_id = p_poll;
    loop
      round_no := round_no + 1;
      -- each ballot counts for its highest-ranked option still in play
      select coalesce(jsonb_object_agg(opt, n), '{}'::jsonb), coalesce(sum(n), 0) into counts, total from (
        select x.opt, count(*)::int n from (
          select distinct on (b.id) b.id, bc.option_id opt
            from public.ballots b join public.ballot_choices bc on bc.ballot_id = b.id
           where b.poll_id = p_poll and bc.option_id = any (remaining)
           order by b.id, bc.rank) x group by x.opt) t;
      rounds := rounds || jsonb_build_array(jsonb_build_object('round', round_no, 'counts', counts));
      select o, coalesce((counts ->> o::text)::int, 0) into top_id, top_n from unnest(remaining) with ordinality u(o, ord)
        order by coalesce((counts ->> o::text)::int, 0) desc, ord asc limit 1;
      exit when total = 0 or top_n * 2 > total or array_length(remaining, 1) = 1;
      select o into low_id from unnest(remaining) with ordinality u(o, ord)
        order by coalesce((counts ->> o::text)::int, 0) asc, ord desc limit 1;
      remaining := array_remove(remaining, low_id);
    end loop;
    winner := case when total > 0 then top_id end;
    outcome := case when not qmet then 'quorum_not_met' when winner is null then 'no_votes' else 'winner' end;
  else
    select o.id into winner from public.poll_options o where o.poll_id = p_poll
      order by (tallies ->> o.id::text)::int desc, o.position asc limit 1;
    if (select count(*) from public.poll_options o where o.poll_id = p_poll
         and (tallies ->> o.id::text)::int = (tallies ->> winner::text)::int) > 1 then winner := null; end if;
    outcome := case when not qmet then 'quorum_not_met' when turn = 0 then 'no_votes' when winner is null then 'tie'
      when pl.kind = 'interest' then 'advisory' else 'winner' end;
  end if;

  insert into public.poll_results (poll_id, eligible, turnout, quorum_met, outcome, winner, tallies, rounds)
    values (p_poll, elig, turn, qmet, outcome, case when outcome in ('winner', 'advisory') then winner end, tallies,
            case when pl.kind = 'ranked' then rounds end)
    returning * into r;
  update public.polls set status = 'closed' where id = p_poll;
  insert into public.poll_audit (poll_id, action, actor_id, note) values (p_poll, 'closed', auth.uid(), outcome);
  if pl.subject_type = 'proposal' then
    update public.proposals set active_poll = null where id = pl.subject_id;
    perform public.move_proposal(pl.subject_id, case when outcome = 'passed' then 'passed' else 'not_passed' end, 'Vote result: ' || replace(outcome, '_', ' '), true);
  end if;
  insert into public.notifications (user_id, kind, title, href)
    select e.user_id, 'poll.closed', 'Result: ' || left(pl.question, 150), '/community/polls/' || p_poll
      from public.poll_eligibility e where e.poll_id = p_poll;
  return r;
end $$;
grant execute on function public.close_poll(uuid) to anon, authenticated;

-- Closes every poll past its closing time. Safe to call from any page load or a scheduled job.
create or replace function public.close_due_polls() returns int
language plpgsql security definer set search_path = public as $$
declare pid uuid; n int := 0;
begin
  for pid in select id from public.polls where status = 'open' and closes_at <= now() order by closes_at limit 20 loop
    perform public.close_poll(pid); n := n + 1;
  end loop;
  return n;
end $$;
grant execute on function public.close_due_polls() to anon, authenticated;

update public.feature_flags set note = 'Phase 5: proposals and voting (built; switch on when ready)' where key = 'commons';
