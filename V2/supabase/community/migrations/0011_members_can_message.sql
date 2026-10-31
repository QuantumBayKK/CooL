-- 0011 Members can message each other by default (owner decision, 31 Oct 2026). "Members who share
-- a project" blocked nearly everyone because projects do not have member lists yet. Anyone can
-- still choose "Nobody" or restrict it in their privacy settings; blocks still apply.
-- Down: set the default back to 'shared_project'.
alter table public.profile_privacy alter column dm_policy set default 'anyone';
update public.profile_privacy set dm_policy = 'anyone' where dm_policy = 'shared_project';
