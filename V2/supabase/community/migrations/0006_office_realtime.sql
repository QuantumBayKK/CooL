-- 0006 Live office: only signed-in members who finished joining may use the private "hq" channel.
-- Supabase Realtime checks these policies on realtime.messages for private channels. Visitors and
-- unfinished accounts can neither see who is in the office nor send movement. Skipped where the
-- realtime schema does not exist (local test databases).
-- Down: drop the two policies.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'realtime') and to_regclass('realtime.messages') is not null then
    execute 'drop policy if exists "hq: members receive" on realtime.messages';
    execute 'drop policy if exists "hq: members send" on realtime.messages';
    execute $p$create policy "hq: members receive" on realtime.messages for select to authenticated
      using (realtime.topic() = 'hq' and public.is_member())$p$;
    execute $p$create policy "hq: members send" on realtime.messages for insert to authenticated
      with check (realtime.topic() = 'hq' and public.is_member())$p$;
  end if;
end $$;

update public.feature_flags set note = 'See and meet other members in the office (Supabase Realtime, private channel).' where key = 'world.multiplayer';
