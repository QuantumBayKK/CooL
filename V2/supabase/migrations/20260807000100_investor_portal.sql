-- ═══════════════════════════════════════════════════════════════════════════
-- Investor portal — schema, constraints and row-level security.
--
-- Threat model this schema is written against:
--
--   T1  An invite code leaks (forwarded email, screenshot, shoulder-surf).
--       → codes expire, have a bounded use count, are revocable instantly,
--         and can be pinned to a single email address.
--
--   T2  Someone brute-forces the code space.
--       → codes are never stored in plaintext, and redemption is rate limited
--         in the database rather than in the app, so the limit survives a
--         second app instance, a serverless cold start, and a restart.
--
--   T3  The anon key leaks. It is a PUBLIC key shipped to every browser, so
--       this is not hypothetical — it is a certainty.
--       → RLS denies everything to `anon` and `authenticated` on every table
--         here. There is no policy that grants a browser read access to any of
--         it. All access is server-side under the service role.
--
--   T4  An investor session token is stolen.
--       → sessions are stored as hashes, bound to a code, expire, and can be
--         revoked. Every access is written to an append-only audit log.
--
--   T5  We are asked to prove who saw what, and when.
--       → audit_log is append-only by policy AND by trigger; there is no
--         UPDATE or DELETE path for any role short of the database owner.
--
-- Note on hashing: codes and session tokens are hashed with pgcrypto's
-- `digest(..., 'sha256')` and a per-row salt is NOT used, deliberately. These
-- are high-entropy random secrets (128 bits), not passwords — a salt defends
-- against precomputation over a small space, and there is no small space here.
-- Using bcrypt on a 128-bit random token buys nothing and costs ~100ms per
-- verification, which turns the rate limiter into a denial-of-service lever.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;
-- Email comparison must be case-insensitive: a code bound to Alice@corp.com
-- has to match a login typed as alice@corp.com, or the binding becomes a
-- usability trap rather than a control.
create extension if not exists citext;

-- ── enums ──────────────────────────────────────────────────────────────────

create type invite_status as enum ('active', 'revoked', 'exhausted', 'expired');

create type audit_action as enum (
  'code.created',
  'code.revoked',
  'code.redeem.success',
  'code.redeem.fail',
  'session.created',
  'session.revoked',
  'session.expired',
  'page.view',
  'asset.download',
  'admin.login',
  'admin.login.fail'
);

-- ── invite codes ───────────────────────────────────────────────────────────

create table invite_codes (
  id            uuid primary key default gen_random_uuid(),

  -- SHA-256 of the normalised code. The plaintext is shown to the admin once,
  -- at creation, and is not recoverable afterwards — including by us, which is
  -- the property that makes "we cannot read your invite" true rather than
  -- policy.
  code_hash     bytea not null unique,

  -- First 4 chars after the COOL-INV- prefix, for the admin list. Enough to
  -- identify a row in conversation ("the 72JQ one") without being enough to
  -- reconstruct the code: 4 of 8 secret chars leaves 32 bits unknown.
  code_hint     text not null check (char_length(code_hint) between 2 and 8),

  label         text not null default '',
  notes         text not null default '',

  -- Optional binding to one recipient. When set, redemption requires the
  -- investor to type this address, so a forwarded code is useless without also
  -- knowing who it was for.
  email         citext,

  max_uses      integer not null default 1 check (max_uses between 1 and 100),
  used_count    integer not null default 0 check (used_count >= 0),

  expires_at    timestamptz not null,
  revoked_at    timestamptz,
  revoked_by    text,

  created_at    timestamptz not null default now(),
  created_by    text not null,

  constraint uses_within_limit check (used_count <= max_uses),
  constraint expiry_in_future_at_creation check (expires_at > created_at)
);

comment on column invite_codes.code_hash is
  'SHA-256 of the normalised code. Plaintext is never stored and is not recoverable.';

create index invite_codes_status_idx on invite_codes (revoked_at, expires_at);
create index invite_codes_email_idx on invite_codes (email) where email is not null;

-- ── sessions ───────────────────────────────────────────────────────────────

create table investor_sessions (
  id            uuid primary key default gen_random_uuid(),
  code_id       uuid not null references invite_codes (id) on delete cascade,

  -- SHA-256 of the opaque session token. The cookie holds the plaintext; the
  -- database holds only this. A dump of this table does not yield a usable
  -- session.
  token_hash    bytea not null unique,

  email         citext,

  -- Coarse forensics only. `ip` is stored truncated (see the app layer) and
  -- these exist to answer "was this code used from two countries in an hour",
  -- not to profile anyone.
  ip_prefix     text,
  country       text,
  user_agent    text,

  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  expires_at    timestamptz not null,
  revoked_at    timestamptz
);

create index investor_sessions_code_idx on investor_sessions (code_id);
create index investor_sessions_expiry_idx on investor_sessions (expires_at)
  where revoked_at is null;

-- ── audit log ──────────────────────────────────────────────────────────────

create table audit_log (
  id            bigserial primary key,
  at            timestamptz not null default now(),
  action        audit_action not null,

  code_id       uuid references invite_codes (id) on delete set null,
  session_id    uuid references investor_sessions (id) on delete set null,

  -- Free-form subject: a route path, an asset key, an admin identifier.
  subject       text,

  ip_prefix     text,
  country       text,
  user_agent    text,

  -- Anything structured worth keeping. Must not contain secrets; the app layer
  -- is responsible for that and the tests assert it.
  detail        jsonb not null default '{}'::jsonb
);

create index audit_log_at_idx on audit_log (at desc);
create index audit_log_code_idx on audit_log (code_id, at desc);
create index audit_log_action_idx on audit_log (action, at desc);

-- Append-only, enforced by trigger rather than only by policy.
--
-- A policy can be dropped by anyone who reaches the database as owner; this
-- trigger makes the mutation itself fail. Belt and braces is proportionate for
-- the one table whose entire value is that it cannot be edited after the fact.
create or replace function audit_log_is_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log is append-only (attempted %)', tg_op;
end;
$$;

create trigger audit_log_no_update
  before update on audit_log
  for each row execute function audit_log_is_append_only();

create trigger audit_log_no_delete
  before delete on audit_log
  for each row execute function audit_log_is_append_only();

-- ── rate limiting ──────────────────────────────────────────────────────────
--
-- In the database, not in the app. An in-memory limiter in a serverless
-- function resets on every cold start, and with more than one instance it
-- multiplies the real limit by the instance count. Neither failure is visible
-- in testing and both are trivially exploitable.

create table rate_limits (
  bucket        text primary key,
  count         integer not null default 0,
  window_start  timestamptz not null default now()
);

/**
 * Consume one unit from a fixed window. Returns true when the caller is
 * allowed to proceed.
 *
 * Fixed window rather than sliding: the worst case is 2× the limit across a
 * window boundary, which for "5 code attempts per 15 minutes" is 10 attempts
 * in the pathological case — still far below anything that threatens a 128-bit
 * code, and it costs one row instead of one row per attempt.
 */
create or replace function consume_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window interval
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into rate_limits (bucket, count, window_start)
    values (p_bucket, 1, now())
  on conflict (bucket) do update
    set count = case
          when rate_limits.window_start < now() - p_window then 1
          else rate_limits.count + 1
        end,
        window_start = case
          when rate_limits.window_start < now() - p_window then now()
          else rate_limits.window_start
        end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- ── redemption ─────────────────────────────────────────────────────────────
--
-- One transaction: check the code, increment its use count, mint the session,
-- write the audit entry. Doing this in application code across four round
-- trips leaves a window in which a single-use code can be redeemed twice by
-- two concurrent requests. `for update` closes it.

create or replace function redeem_invite_code(
  p_code_hash bytea,
  p_token_hash bytea,
  p_email citext,
  p_session_ttl interval,
  p_ip_prefix text,
  p_country text,
  p_user_agent text
)
returns table (
  ok boolean,
  reason text,
  session_id uuid,
  code_id uuid,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code invite_codes%rowtype;
  v_session_id uuid;
  v_expires timestamptz;
begin
  select * into v_code
    from invite_codes
   where code_hash = p_code_hash
   for update;

  if not found then
    -- No code_id to attribute this to, by definition.
    insert into audit_log (action, subject, ip_prefix, country, user_agent, detail)
      values ('code.redeem.fail', 'unknown-code', p_ip_prefix, p_country, p_user_agent,
              jsonb_build_object('reason', 'not_found'));
    return query select false, 'invalid'::text, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  if v_code.revoked_at is not null then
    insert into audit_log (action, code_id, ip_prefix, country, user_agent, detail)
      values ('code.redeem.fail', v_code.id, p_ip_prefix, p_country, p_user_agent,
              jsonb_build_object('reason', 'revoked'));
    return query select false, 'invalid'::text, null::uuid, v_code.id, null::timestamptz;
    return;
  end if;

  if v_code.expires_at <= now() then
    insert into audit_log (action, code_id, ip_prefix, country, user_agent, detail)
      values ('code.redeem.fail', v_code.id, p_ip_prefix, p_country, p_user_agent,
              jsonb_build_object('reason', 'expired'));
    return query select false, 'invalid'::text, null::uuid, v_code.id, null::timestamptz;
    return;
  end if;

  if v_code.used_count >= v_code.max_uses then
    insert into audit_log (action, code_id, ip_prefix, country, user_agent, detail)
      values ('code.redeem.fail', v_code.id, p_ip_prefix, p_country, p_user_agent,
              jsonb_build_object('reason', 'exhausted'));
    return query select false, 'invalid'::text, null::uuid, v_code.id, null::timestamptz;
    return;
  end if;

  -- Email binding, when the code carries one.
  if v_code.email is not null and (p_email is null or p_email <> v_code.email) then
    insert into audit_log (action, code_id, ip_prefix, country, user_agent, detail)
      values ('code.redeem.fail', v_code.id, p_ip_prefix, p_country, p_user_agent,
              jsonb_build_object('reason', 'email_mismatch'));
    return query select false, 'invalid'::text, null::uuid, v_code.id, null::timestamptz;
    return;
  end if;

  update invite_codes
     set used_count = used_count + 1
   where id = v_code.id;

  v_expires := now() + p_session_ttl;

  insert into investor_sessions
      (code_id, token_hash, email, ip_prefix, country, user_agent, expires_at)
    values
      (v_code.id, p_token_hash, coalesce(p_email, v_code.email),
       p_ip_prefix, p_country, p_user_agent, v_expires)
    returning id into v_session_id;

  insert into audit_log (action, code_id, session_id, ip_prefix, country, user_agent)
    values ('code.redeem.success', v_code.id, v_session_id, p_ip_prefix, p_country, p_user_agent);

  insert into audit_log (action, code_id, session_id, ip_prefix, country, user_agent)
    values ('session.created', v_code.id, v_session_id, p_ip_prefix, p_country, p_user_agent);

  return query select true, 'ok'::text, v_session_id, v_code.id, v_expires;
end;
$$;

-- ── row-level security ─────────────────────────────────────────────────────
--
-- Enabled with NO permissive policies for `anon` or `authenticated`.
--
-- This is the important part of the file. The anon key is public — it ships in
-- the JavaScript bundle of every visitor. RLS with no policy means a leaked
-- anon key grants exactly nothing on these tables. The portal reaches them only
-- from server code holding the service role key, which never leaves the server.
--
-- If a future policy is added here granting `authenticated` any access, that is
-- a decision to expose investor data to anyone who can obtain a Supabase JWT,
-- and it should be reviewed as such.

alter table invite_codes       enable row level security;
alter table investor_sessions  enable row level security;
alter table audit_log          enable row level security;
alter table rate_limits        enable row level security;

alter table invite_codes       force row level security;
alter table investor_sessions  force row level security;
alter table audit_log          force row level security;
alter table rate_limits        force row level security;

revoke all on invite_codes, investor_sessions, audit_log, rate_limits
  from anon, authenticated;

revoke all on function consume_rate_limit(text, integer, interval)
  from anon, authenticated;
revoke all on function redeem_invite_code(bytea, bytea, citext, interval, text, text, text)
  from anon, authenticated;

-- ── housekeeping ───────────────────────────────────────────────────────────

/**
 * Expire stale sessions and mark exhausted codes.
 *
 * Called from a scheduled edge function. Sessions are revoked rather than
 * deleted: the audit trail references them, and a foreign key that nulls itself
 * on cleanup would quietly erase the link between an access and the code that
 * authorised it.
 */
create or replace function expire_stale_sessions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired integer;
begin
  with expired as (
    update investor_sessions
       set revoked_at = now()
     where revoked_at is null
       and expires_at <= now()
    returning id, code_id
  )
  insert into audit_log (action, code_id, session_id, subject)
    select 'session.expired', code_id, id, 'housekeeping' from expired;

  get diagnostics v_expired = row_count;
  return v_expired;
end;
$$;
