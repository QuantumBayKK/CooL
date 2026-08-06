-- ═══════════════════════════════════════════════════════════════════════════
-- Data room — private storage and the download ledger.
--
-- The bucket is private. Files are reached only through short-lived signed URLs
-- minted server-side after a session check, so the URL in the browser cannot be
-- forwarded usefully and cannot be guessed.
--
-- Signed-URL TTL is 60 seconds. That is short enough that a leaked URL in a
-- referrer header or a chat paste is dead before it is useful, and long enough
-- for the browser to start the transfer — the download itself continues past
-- expiry because the signature is checked once, at request time.
-- ═══════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit)
values ('data-room', 'data-room', false, 209715200)  -- 200 MB
on conflict (id) do update set public = false;

-- No storage policies for anon or authenticated.
--
-- Same reasoning as the portal tables: the anon key is public. Every read of
-- this bucket goes through a server route that has already validated a session
-- and written an audit entry. A policy here granting `authenticated` read would
-- hand the whole data room to anyone able to mint a Supabase JWT.
revoke all on storage.objects from anon, authenticated;

-- ── the catalogue ──────────────────────────────────────────────────────────
--
-- Kept in a table rather than read from the bucket listing, because a listing
-- exposes every key to anyone who can list, and because a document needs
-- metadata a filename cannot carry: whether it is currently offered, what it
-- is, and whether it is sensitive enough to require a re-check.

create table data_room_assets (
  id           uuid primary key default gen_random_uuid(),
  -- Object key inside the `data-room` bucket.
  storage_key  text not null unique,
  title        text not null,
  description  text not null default '',
  category     text not null default 'general',
  content_type text not null default 'application/pdf',
  size_bytes   bigint,
  -- Ordering in the UI. Explicit, so a new upload does not reshuffle the room.
  sort_order   integer not null default 100,
  -- Soft withdrawal. A removed document stays referenced by the audit trail.
  available    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index data_room_assets_order_idx on data_room_assets (sort_order, title)
  where available;

alter table data_room_assets enable row level security;
alter table data_room_assets force row level security;
revoke all on data_room_assets from anon, authenticated;
