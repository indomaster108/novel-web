-- Initial Ruang Aksara schema.
-- Apply through the Supabase migration workflow; do not edit after production use.

create schema if not exists private;
revoke all on schema private from public;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null or char_length(btrim(display_name)) between 1 and 80
  ),
  constraint profiles_avatar_url_length check (
    avatar_url is null or char_length(avatar_url) <= 2048
  )
);

create table public.novels (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  author_name text not null,
  synopsis text,
  cover_url text,
  genres text[] not null default '{}',
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint novels_title_length check (char_length(btrim(title)) between 1 and 200),
  constraint novels_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 200),
  constraint novels_author_length check (char_length(btrim(author_name)) between 1 and 120),
  constraint novels_synopsis_length check (synopsis is null or char_length(synopsis) <= 5000),
  constraint novels_cover_url_length check (cover_url is null or char_length(cover_url) <= 2048),
  constraint novels_genres_count check (cardinality(genres) <= 12),
  constraint novels_status_check check (status in ('draft', 'published')),
  constraint novels_publish_state check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null)
  )
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references public.novels(id) on delete cascade,
  chapter_number integer not null,
  title text not null,
  slug text not null,
  content text not null,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chapters_number_positive check (chapter_number > 0),
  constraint chapters_title_length check (char_length(btrim(title)) between 1 and 200),
  constraint chapters_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 200),
  constraint chapters_content_length check (char_length(btrim(content)) between 1 and 1000000),
  constraint chapters_status_check check (status in ('draft', 'published')),
  constraint chapters_publish_state check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null)
  ),
  constraint chapters_novel_number_key unique (novel_id, chapter_number),
  constraint chapters_novel_slug_key unique (novel_id, slug),
  constraint chapters_novel_id_id_key unique (novel_id, id)
);

create table public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  novel_id uuid not null references public.novels(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, novel_id)
);

create table public.reading_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  novel_id uuid not null references public.novels(id) on delete cascade,
  chapter_id uuid not null,
  progress_percent integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, novel_id),
  constraint reading_progress_percent_check check (progress_percent between 0 and 100),
  constraint reading_progress_chapter_novel_fkey
    foreign key (novel_id, chapter_id)
    references public.chapters(novel_id, id)
    on delete cascade
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  body text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_body_length check (char_length(btrim(body)) between 1 and 2000),
  constraint comments_status_check check (status in ('pending', 'approved', 'rejected'))
);

-- Foreign-key, public listing, moderation, and RLS predicate indexes.
create index bookmarks_novel_id_idx on public.bookmarks (novel_id);
create index reading_progress_novel_chapter_idx on public.reading_progress (novel_id, chapter_id);
create index chapters_novel_id_idx on public.chapters (novel_id);
create index chapters_published_list_idx on public.chapters (novel_id, chapter_number)
  where status = 'published';
create index novels_published_at_idx on public.novels (published_at desc)
  where status = 'published';
create index comments_user_id_idx on public.comments (user_id);
create index comments_approved_chapter_idx on public.comments (chapter_id, created_at)
  where status = 'approved';
create index comments_pending_created_idx on public.comments (created_at)
  where status = 'pending';

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger novels_set_updated_at before update on public.novels
  for each row execute function private.set_updated_at();
create trigger chapters_set_updated_at before update on public.chapters
  for each row execute function private.set_updated_at();
create trigger reading_progress_set_updated_at before update on public.reading_progress
  for each row execute function private.set_updated_at();
create trigger comments_set_updated_at before update on public.comments
  for each row execute function private.set_updated_at();

-- Trigger runs with elevated rights only to create the profile paired with auth.users.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), 80)
  );
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.novels enable row level security;
alter table public.chapters enable row level security;
alter table public.bookmarks enable row level security;
alter table public.reading_progress enable row level security;
alter table public.comments enable row level security;

-- Data API privileges are deliberately narrower than table-owner privileges.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.novels from anon, authenticated;
revoke all on table public.chapters from anon, authenticated;
revoke all on table public.bookmarks from anon, authenticated;
revoke all on table public.reading_progress from anon, authenticated;
revoke all on table public.comments from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on table public.novels, public.chapters, public.comments to anon;
grant select, insert, update, delete on table public.novels, public.chapters to authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, delete on table public.bookmarks to authenticated;
grant select, insert, update, delete on table public.reading_progress to authenticated;
grant select, insert, update, delete on table public.comments to authenticated;

-- Profiles: private by default; each authenticated user owns exactly one row.
create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Public content: only published rows. Admin role comes only from app_metadata.
create policy novels_select_published on public.novels
  for select to anon, authenticated
  using (status = 'published');

create policy novels_admin_select_all on public.novels
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy novels_admin_insert on public.novels
  for insert to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy novels_admin_update on public.novels
  for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy novels_admin_delete on public.novels
  for delete to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy chapters_select_published on public.chapters
  for select to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1 from public.novels
      where novels.id = chapters.novel_id and novels.status = 'published'
    )
  );

create policy chapters_admin_select_all on public.chapters
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy chapters_admin_insert on public.chapters
  for insert to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy chapters_admin_update on public.chapters
  for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy chapters_admin_delete on public.chapters
  for delete to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- Private user data: ownership is enforced for every operation.
create policy bookmarks_select_own on public.bookmarks
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy bookmarks_insert_own_published on public.bookmarks
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.novels
      where novels.id = bookmarks.novel_id and novels.status = 'published'
    )
  );

create policy bookmarks_delete_own on public.bookmarks
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy reading_progress_select_own on public.reading_progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy reading_progress_insert_own_published on public.reading_progress
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.chapters
      join public.novels on novels.id = chapters.novel_id
      where chapters.id = reading_progress.chapter_id
        and chapters.novel_id = reading_progress.novel_id
        and chapters.status = 'published'
        and novels.status = 'published'
    )
  );

create policy reading_progress_update_own_published on public.reading_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.chapters
      join public.novels on novels.id = chapters.novel_id
      where chapters.id = reading_progress.chapter_id
        and chapters.novel_id = reading_progress.novel_id
        and chapters.status = 'published'
        and novels.status = 'published'
    )
  );

create policy reading_progress_delete_own on public.reading_progress
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Comments: approved content is public; authors can see pending/rejected rows they own.
create policy comments_select_approved on public.comments
  for select to anon, authenticated
  using (status = 'approved');

create policy comments_select_own on public.comments
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy comments_insert_own_pending on public.comments
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
    and exists (
      select 1 from public.chapters
      join public.novels on novels.id = chapters.novel_id
      where chapters.id = comments.chapter_id
        and chapters.status = 'published'
        and novels.status = 'published'
    )
  );

create policy comments_admin_select_all on public.comments
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy comments_admin_update on public.comments
  for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy comments_admin_delete on public.comments
  for delete to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- Public cover delivery with tightly restricted admin-only mutations.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'covers',
  'covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy covers_admin_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'covers'
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy covers_admin_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'covers'
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy covers_admin_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'covers'
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    bucket_id = 'covers'
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy covers_admin_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'covers'
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );
