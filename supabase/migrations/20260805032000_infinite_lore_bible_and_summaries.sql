-- Migration: Infinite Lore Bible and Chain-of-Summaries Architecture
-- Supports the Ruang Aksara Infinite Scribe ecosystem (Web Studio & Pocket Bot)

create table public.lore_bibles (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references public.novels(id) on delete cascade,
  category text not null default 'character',
  name text not null,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lore_category_check check (category in ('character', 'location', 'faction', 'magic_system', 'item', 'rule', 'other')),
  constraint lore_name_length check (char_length(btrim(name)) between 1 and 150),
  constraint lore_summary_length check (char_length(btrim(summary)) between 1 and 4000)
);

create table public.chapter_summaries (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references public.novels(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete set null,
  chapter_number integer not null,
  summary text not null,
  key_events text[] not null default '{}',
  character_developments jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint summary_number_positive check (chapter_number > 0),
  constraint summary_text_length check (char_length(btrim(summary)) between 1 and 5000),
  constraint summaries_novel_number_key unique (novel_id, chapter_number)
);

create table public.generation_logs (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid references public.novels(id) on delete cascade,
  source text not null default 'web_studio',
  prompt_input text not null,
  generated_output text,
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  constraint generation_source_check check (source in ('web_studio', 'telegram_bot', 'discord_bot', 'cli')),
  constraint generation_status_check check (status in ('pending', 'completed', 'failed'))
);

-- Indexes for lightning-fast retrieval during AI context construction
create index lore_bibles_novel_category_idx on public.lore_bibles (novel_id, category);
create index lore_bibles_tags_idx on public.lore_bibles using gin (tags);
create index chapter_summaries_novel_number_idx on public.chapter_summaries (novel_id, chapter_number desc);
create index generation_logs_novel_created_idx on public.generation_logs (novel_id, created_at desc);

-- Attach standard set_updated_at triggers
create trigger lore_bibles_set_updated_at before update on public.lore_bibles
  for each row execute function private.set_updated_at();
create trigger chapter_summaries_set_updated_at before update on public.chapter_summaries
  for each row execute function private.set_updated_at();

-- RLS & Security setup: restricted to authenticated admins
alter table public.lore_bibles enable row level security;
alter table public.chapter_summaries enable row level security;
alter table public.generation_logs enable row level security;

revoke all on table public.lore_bibles from anon, authenticated;
revoke all on table public.chapter_summaries from anon, authenticated;
revoke all on table public.generation_logs from anon, authenticated;

grant select, insert, update, delete on table public.lore_bibles to authenticated;
grant select, insert, update, delete on table public.chapter_summaries to authenticated;
grant select, insert, update, delete on table public.generation_logs to authenticated;

-- Policies: Only admin roles can read or alter lore bibles and memory structures
create policy lore_bibles_admin_all on public.lore_bibles
  for all to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy chapter_summaries_admin_all on public.chapter_summaries
  for all to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy generation_logs_admin_all on public.generation_logs
  for all to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- RPC for 1-Click Instant Publishing without code deployment
create or replace function public.publish_chapter_on_demand(target_chapter_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  updated_row json;
begin
  if (((select auth.jwt()) -> 'app_metadata' ->> 'role') is distinct from 'admin') then
    raise exception 'Unauthorized: Only admins can publish chapters.';
  end if;

  update public.chapters
  set status = 'published',
      published_at = coalesce(published_at, now())
  where id = target_chapter_id
  returning to_json(chapters.*) into updated_row;

  if updated_row is null then
    raise exception 'Chapter not found or failed to update.';
  end if;

  return updated_row;
end;
$$;

revoke execute on function public.publish_chapter_on_demand(uuid) from public, anon, authenticated;
grant execute on function public.publish_chapter_on_demand(uuid) to authenticated;
