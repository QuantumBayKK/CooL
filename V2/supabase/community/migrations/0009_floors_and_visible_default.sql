-- 0009 Floors: the office opens identical floors (hq:1, hq:2, ...) when one fills up; members move
-- between them by elevator. Only members who finished joining may use any floor's private channel.
-- Owner decision (31 Oct 2026): members are visible in the office by default; anyone can switch to
-- invisible in their profile.
-- Down: restore the 0006 policies and set the default back to 'invisible'.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'realtime') and to_regclass('realtime.messages') is not null then
    execute 'drop policy if exists "hq: members receive" on realtime.messages';
    execute 'drop policy if exists "hq: members send" on realtime.messages';
    execute $p$create policy "hq: members receive" on realtime.messages for select to authenticated
      using (realtime.topic() ~ '^hq:[1-9][0-9]?$' and public.is_member())$p$;
    execute $p$create policy "hq: members send" on realtime.messages for insert to authenticated
      with check (realtime.topic() ~ '^hq:[1-9][0-9]?$' and public.is_member())$p$;
  end if;
end $$;

alter table public.profile_privacy alter column presence set default 'online';
-- Applied while only the founders' accounts exist, none of whom had chosen a presence setting.
update public.profile_privacy set presence = 'online' where presence = 'invisible';
