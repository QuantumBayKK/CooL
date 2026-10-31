-- 0010 Assigned desks: the desks in the Quiet work area can be claimed, one per member, and
-- decorated with up to three badges and a small pixel drawing on the monitor.
-- Down: drop the table and functions.

create table if not exists public.desks (
  id text primary key check (id ~ '^q[1-9]$'),
  owner uuid unique references public.profiles (id) on delete set null,
  badges text[] not null default '{}' check (cardinality(badges) <= 3 and badges <@ array['star', 'heart', 'bolt', 'leaf', 'code', 'coffee', 'flag', 'music']),
  -- 10 x 6 pixels, one palette index (0-7) per pixel, row by row; '0' is the dark screen.
  screen text not null default '' check (screen ~ '^([0-7]{60})?$'),
  updated_at timestamptz not null default now()
);
alter table public.desks enable row level security;
revoke all on public.desks from anon, authenticated;
insert into public.desks (id) values ('q1'), ('q2'), ('q3'), ('q4'), ('q5') on conflict do nothing;

-- Desks as the office shows them: owner's first name and handle only.
create or replace function public.list_desks() returns table (id text, owner_handle text, owner_name text, badges text[], screen text)
language sql stable security definer set search_path = public as $$
  select d.id, p.handle, split_part(p.full_name, ' ', 1), d.badges, d.screen
    from public.desks d left join public.profiles p on p.id = d.owner order by d.id;
$$;
revoke all on function public.list_desks() from public, anon;
grant execute on function public.list_desks() to authenticated;

create or replace function public.claim_desk(p_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_member() then raise exception 'finish joining first' using errcode = '42501'; end if;
  if not exists (select 1 from public.desks where id = p_id) then raise exception 'no such desk' using errcode = 'P0002'; end if;
  update public.desks set owner = null, badges = '{}', screen = '', updated_at = now() where owner = auth.uid() and id <> p_id;
  update public.desks set owner = auth.uid(), updated_at = now() where id = p_id and owner is null;
  if not found and not exists (select 1 from public.desks where id = p_id and owner = auth.uid()) then
    raise exception 'that desk is taken' using errcode = '22023';
  end if;
end $$;
revoke all on function public.claim_desk(text) from public, anon;
grant execute on function public.claim_desk(text) to authenticated;

create or replace function public.release_desk() returns void
language sql security definer set search_path = public as $$
  update public.desks set owner = null, badges = '{}', screen = '', updated_at = now() where owner = auth.uid();
$$;
revoke all on function public.release_desk() from public, anon;
grant execute on function public.release_desk() to authenticated;

create or replace function public.decorate_desk(p_badges text[], p_screen text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.desks set badges = coalesce(p_badges, '{}'), screen = coalesce(p_screen, ''), updated_at = now() where owner = auth.uid();
  if not found then raise exception 'claim a desk first' using errcode = '22023'; end if;
end $$;
revoke all on function public.decorate_desk(text[], text) from public, anon;
grant execute on function public.decorate_desk(text[], text) to authenticated;
