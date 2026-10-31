-- 0004 Visitors could not read proposal comments: the view joined `profiles`, which anonymous
-- users have no privilege on, so the whole query failed. Author names already come from
-- comment_authors() (privacy-safe), so the view no longer touches profiles.
-- Down: restore the 0003 definition (not recommended).

drop view if exists public.proposal_comments_public;
create view public.proposal_comments_public with (security_invoker = true) as
  select c.id, c.proposal_id, c.parent_id, c.created_at, c.edited_at,
         case when c.deleted_at is not null then '[deleted]' when c.hidden_reason is not null then '[removed by a moderator]' else c.body end as body,
         c.deleted_at is not null or c.hidden_reason is not null as removed,
         case when c.deleted_at is null then c.author_id end as author_id
    from public.proposal_comments c;
grant select on public.proposal_comments_public to anon, authenticated;
