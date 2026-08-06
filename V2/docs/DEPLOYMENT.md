# Deployment

From a clean machine to production, and the things that will bite.

---

## 1 · Provision Supabase

Create a project, then link and push the migrations:

```bash
supabase link --project-ref <your-ref>
supabase db push
```

**Do not run `supabase/seed.sql` against a hosted project.** It inserts a
dev-only invite code whose plaintext is committed to this repository. `db push`
does not run seeds; `db reset` does, and it is a local command.

Verify the schema landed with its security intact:

```bash
SUPABASE_DB_CONTAINER=<n/a>  # hosted: run the checks via the SQL editor instead
```

For a hosted project, paste these into the SQL editor and confirm the results:

```sql
-- Expect: five rows, all t / t
select relname, relrowsecurity, relforcerowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and relkind = 'r';

-- Expect: 0
select count(*) from pg_policies where schemaname = 'public';

-- Expect: ERROR "audit_log is append-only"
update audit_log set subject = 'x' where id = (select min(id) from audit_log);
```

If the policy count is not zero, **stop**. Someone has granted a browser-facing
role access to investor data.

---

## 2 · Create the storage bucket

`20260807000200_data_room.sql` creates `data-room` as private. Confirm:

```sql
select id, public from storage.buckets where id = 'data-room';
-- public must be false
```

Upload documents through the Supabase dashboard, then add a matching row to
`data_room_assets`. The catalogue is a table rather than a bucket listing on
purpose — a listing exposes every key to anyone who can list.

---

## 3 · Environment

Generate two **different** secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Set on the host:

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public by design |
| `SUPABASE_SERVICE_ROLE_KEY` | **Never** `NEXT_PUBLIC_`. Bypasses all RLS |
| `INVESTOR_SESSION_SECRET` | ≥32 chars. Rotating it signs out every investor |
| `ADMIN_SESSION_SECRET` | ≥32 chars, and different from the above |
| `ADMIN_PASSPHRASE` | ≥24 chars |
| `CONTACT_INBOX` | Optional |

Reusing one secret for both sessions means an investor token and an admin token
are forgeable from each other — a data-room leak becomes a full compromise.
The length minimums are enforced at startup, not advised.

---

## 4 · Deploy

The app is a standard Next.js 16 build. Any Node host works; Vercel needs no
configuration beyond the environment variables.

```bash
npm ci
npm run build
npm start          # or the platform's own start
```

`src/lib/supabase/server.ts` imports `server-only` as its first line, so an
accidental import from a client component is a **build** error rather than a
runtime secret leak. If the build fails with that message, do not work around
it — find the client component that reached for the database.

---

## 5 · Post-deploy checks

Run these against the live origin before announcing it.

```bash
ORIGIN=https://your-domain

# Security headers present
curl -sI $ORIGIN | grep -iE "content-security-policy|strict-transport|x-frame"

# Private routes are noindex and uncached
curl -sI $ORIGIN/investor/login | grep -iE "x-robots-tag|cache-control"

# Private routes absent from the sitemap — expect 0
curl -s $ORIGIN/sitemap.xml | grep -ci "investor"

# Unauthenticated private route redirects
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" $ORIGIN/investor/overview
```

Then, in a browser:

1. Sign in to `/admin`, issue a code, and **copy it** — it is shown once.
2. Redeem it in a private window. Confirm you land on the overview.
3. Revoke the code in `/admin/codes`. Confirm the open investor session is
   signed out on its next navigation.
4. Check `/admin/audit` shows `code.created`, `code.redeem.success`,
   `session.created`, `page.view` and `code.revoked`.

Step 3 is the one worth doing properly. Revocation that only stops *new*
redemptions is the failure mode that matters, because you revoke precisely when
a code has leaked and someone is already inside.

---

## 6 · Custom domain and HSTS

`strict-transport-security` is set with `preload` in production. Preload is
**effectively irreversible** for the length of the max-age — do not submit the
domain to the preload list until you are certain every subdomain will serve
HTTPS indefinitely.

---

## Operational notes

### Rotating a secret

Rotating `INVESTOR_SESSION_SECRET` invalidates every live investor session
immediately. That is the intended break-glass control — use it if you believe a
session token has been captured.

### Expiring stale sessions

`expire_stale_sessions()` marks expired sessions revoked and writes an audit
entry. Schedule it with `pg_cron`:

```sql
select cron.schedule('expire-sessions', '*/15 * * * *',
                     $$select expire_stale_sessions()$$);
```

Sessions are revoked rather than deleted, because the audit trail references
them and a cascade would erase the link between an access and the code that
authorised it.

### When a second admin appears

Replace the shared passphrase with Supabase Auth plus an explicit allowlist.
Do **not** solve it by sharing the passphrase: a shared credential cannot be
revoked for one holder and cannot attribute an action to a person, and the audit
log's value depends on both.

### Raising the site's claims

When a readiness gate genuinely closes, edit `CURRENT_GATE` in
`src/content/gates.ts` and tick the items that justify it. CI will reject the
change if the copy claims more than the ticked items support. Do not add a
`claim-exempt` marker to make a build pass — those exist only for copy that
names a capability in order to say we do **not** have it.
