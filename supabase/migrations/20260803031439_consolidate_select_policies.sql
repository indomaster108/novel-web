-- Consolidate authenticated SELECT policies flagged by the performance advisor.
-- Anon and authenticated roles remain explicitly separated.

drop policy novels_select_published on public.novels;
drop policy novels_admin_select_all on public.novels;

create policy novels_anon_select_published on public.novels
  for select to anon
  using (status = 'published');

create policy novels_authenticated_select_allowed on public.novels
  for select to authenticated
  using (
    status = 'published'
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy chapters_select_published on public.chapters;
drop policy chapters_admin_select_all on public.chapters;

create policy chapters_anon_select_published on public.chapters
  for select to anon
  using (
    status = 'published'
    and exists (
      select 1 from public.novels
      where novels.id = chapters.novel_id and novels.status = 'published'
    )
  );

create policy chapters_authenticated_select_allowed on public.chapters
  for select to authenticated
  using (
    (
      status = 'published'
      and exists (
        select 1 from public.novels
        where novels.id = chapters.novel_id and novels.status = 'published'
      )
    )
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy comments_select_approved on public.comments;
drop policy comments_select_own on public.comments;
drop policy comments_admin_select_all on public.comments;

create policy comments_anon_select_approved on public.comments
  for select to anon
  using (status = 'approved');

create policy comments_authenticated_select_allowed on public.comments
  for select to authenticated
  using (
    status = 'approved'
    or (select auth.uid()) = user_id
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );
