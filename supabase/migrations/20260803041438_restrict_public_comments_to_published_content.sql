-- Approved comments are public only while both their chapter and novel are published.
-- Owners can still see their own moderation state, and admins retain full visibility.

drop policy comments_anon_select_approved on public.comments;
drop policy comments_authenticated_select_allowed on public.comments;

create policy comments_anon_select_approved on public.comments
  for select to anon
  using (
    status = 'approved'
    and exists (
      select 1
      from public.chapters
      join public.novels on novels.id = chapters.novel_id
      where chapters.id = comments.chapter_id
        and chapters.status = 'published'
        and novels.status = 'published'
    )
  );

create policy comments_authenticated_select_allowed on public.comments
  for select to authenticated
  using (
    (
      status = 'approved'
      and exists (
        select 1
        from public.chapters
        join public.novels on novels.id = chapters.novel_id
        where chapters.id = comments.chapter_id
          and chapters.status = 'published'
          and novels.status = 'published'
      )
    )
    or (select auth.uid()) = user_id
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );
