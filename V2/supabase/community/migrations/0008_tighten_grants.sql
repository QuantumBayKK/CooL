-- 0008 Defence in depth, from the security audit of 31 Oct 2026.
-- Row-level security already blocked every one of these, but the privileges themselves came from
-- Supabase's default grants and should not exist: least privilege is enforced twice.
-- Down: not needed (re-granting would only widen access).

-- Internal tables: no client writes at all.
revoke insert, update, delete on public.admins, public.proposal_transitions from anon, authenticated;
revoke insert, update, delete on public.proposal_comments_public from anon, authenticated;

-- Visitors never write anything.
revoke insert, update, delete on public.contribution_requests, public.proposal_followers, public.profile_privacy, public.profiles from anon;

-- Members update only the privacy choices, never the owner or timestamps.
revoke update on public.profile_privacy from authenticated;
grant update (profile, bio, skills, timezone, presence, show_last_active, dm_policy) on public.profile_privacy to authenticated;

-- Member-only functions: not callable by visitors at all (each already refused them).
-- has_capability() and is_owner() stay callable: access rules evaluate them for visitors too (they return false).
do $$
declare f text;
begin
  foreach f in array array[
    'add_comment(uuid,uuid,text)', 'can_message(uuid)', 'can_message_handle(text)', 'cast_ballot(uuid,uuid[])',
    'create_poll(text,uuid,text,text,text,boolean,text,jsonb,timestamptz,integer,text,boolean,text,integer,text,integer)',
    'create_proposal(text,text,text,text,boolean,boolean,jsonb,boolean)', 'delete_comment(uuid)', 'edit_comment(uuid,text)',
    'edit_proposal(uuid,text,text,jsonb,boolean,text)', 'hide_comment(uuid,text)', 'i_blocked(text)', 'invalidate_poll(uuid,text)',
    'list_conversations()', 'mark_duplicate(uuid,uuid,text)', 'my_ballot(uuid)', 'open_thread(text)', 'send_message(text,text)',
    'set_block(text,boolean)', 'set_team_email(text,text)', 'submit_proposal(uuid)', 'transition_proposal(uuid,text,text)',
    'unread_messages()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
