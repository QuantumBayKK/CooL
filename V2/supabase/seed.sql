-- ═══════════════════════════════════════════════════════════════════════════
-- Local development seed.
--
-- Runs on `supabase db reset`. Local only — never applied to a hosted project,
-- and it must never contain a code that could work anywhere real.
--
-- The seeded code is DEV-ONLY and its plaintext is committed on purpose, so a
-- new contributor can open the portal without first using the admin console.
-- It works exclusively against a local database with this seed applied:
-- production databases never run seed.sql, so this hash exists nowhere else.
--
--   Code: COOL-INV-DEV0-CAFE
--
-- The hash below is sha256('COOL-INV-DEV0-CAFE').
--
-- Note the alphabet: I, L, O and U are excluded from generated codes because
-- they are the characters people confuse when retyping. A seed code containing
-- one is rejected by normalisation before it ever reaches the database.
-- ═══════════════════════════════════════════════════════════════════════════

insert into invite_codes (
  code_hash,
  code_hint,
  label,
  notes,
  max_uses,
  expires_at,
  created_by
) values (
  digest('COOL-INV-DEV0-CAFE', 'sha256'),
  'DEV0',
  'Local development',
  'Seeded by supabase/seed.sql. Local only — this hash exists in no hosted database.',
  100,
  now() + interval '365 days',
  'seed'
)
on conflict (code_hash) do nothing;

-- ── data room catalogue ────────────────────────────────────────────────────
--
-- Rows only, no files. The catalogue is what the room reads, so seeding it
-- proves the page renders, the grouping works and the download path returns a
-- real 404 for a missing object rather than a blank screen.
--
-- Uploading the actual documents is an admin action, deliberately: committing
-- a pitch deck to the repository would put it in every clone.

insert into data_room_assets (storage_key, title, description, category, content_type, sort_order)
values
  ('corporate/certificate-of-incorporation.pdf',
   'Certificate of incorporation',
   'Northwind Cipher Pvt. Ltd.',
   'Corporate', 'application/pdf', 10),

  ('technical/threat-model.pdf',
   'Threat model',
   'Trust boundaries, what is removed from the trust set, and what remains.',
   'Technical', 'application/pdf', 20),

  ('technical/conformance-report.pdf',
   'Conformance report',
   'The 22-check SDK conformance run against the published spec vectors.',
   'Technical', 'application/pdf', 30)
on conflict (storage_key) do nothing;
