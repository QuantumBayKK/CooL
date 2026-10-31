-- 0012 Everyone is visible to everyone by default (owner decision, 31 Oct 2026): profiles, bio, skills
-- and time zone are public, and members appear in the office. Anyone can still narrow any field to
-- members only or only themselves, or go invisible; the email address is never shown.
-- Existing rows move only where they still hold the old defaults, so earlier choices are kept.
-- Down: set the defaults back to profile/bio/skills 'members', timezone 'private'.
alter table public.profile_privacy alter column profile set default 'public';
alter table public.profile_privacy alter column bio set default 'public';
alter table public.profile_privacy alter column skills set default 'public';
alter table public.profile_privacy alter column timezone set default 'public';
update public.profile_privacy set profile = 'public' where profile = 'members';
update public.profile_privacy set bio = 'public' where bio = 'members';
update public.profile_privacy set skills = 'public' where skills = 'members';
update public.profile_privacy set timezone = 'public' where timezone = 'private';
