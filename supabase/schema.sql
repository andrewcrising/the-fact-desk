-- The Fact Desk MVP schema.
-- Run this in the Supabase SQL editor, or apply it with your normal migration tool.
-- Server-side code uses SUPABASE_SERVICE_ROLE_KEY; do not expose that key publicly.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  homepage_url text,
  feed_url text unique,
  source_type text not null default 'rss',
  constraint sources_source_type_check
    check (source_type in ('rss', 'manual', 'api', 'wire', 'other')),
  credibility_score numeric,
  political_or_editorial_label text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists sources_set_updated_at on public.sources;
create trigger sources_set_updated_at
before update on public.sources
for each row execute function public.set_updated_at();

create table if not exists public.feed_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  title text not null,
  url text not null,
  canonical_url text not null,
  author text,
  published_at timestamptz,
  summary text,
  raw_payload jsonb,
  status text not null default 'new'
    check (status in ('new', 'reviewed', 'promoted', 'ignored', 'error')),
  dedupe_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feed_items_status_idx on public.feed_items(status);
create index if not exists feed_items_source_idx on public.feed_items(source_id);
create index if not exists feed_items_published_idx on public.feed_items(published_at desc);

drop trigger if exists feed_items_set_updated_at on public.feed_items;
create trigger feed_items_set_updated_at
before update on public.feed_items
for each row execute function public.set_updated_at();

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  what_happened text not null,
  why_it_matters text not null,
  coverage_angle text,
  uncertainty_note text,
  category text not null,
  signal text not null,
  confidence text not null,
  evidence_level text not null default 'Moderate',
  constraint stories_category_check
    check (category in ('Politics', 'Markets', 'Technology', 'World', 'Health', 'Courts', 'Energy', 'Culture')),
  constraint stories_signal_check
    check (signal in ('Top Signal', 'Under-covered', 'Cross-angle', 'Developing')),
  constraint stories_confidence_check
    check (confidence in ('Confirmed', 'Developing', 'Disputed', 'Single-source')),
  constraint stories_evidence_level_check
    check (evidence_level in ('Low', 'Moderate', 'Strong')),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived', 'corrected')),
  homepage_rank integer,
  is_lead boolean not null default false,
  tags jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe for existing MVP databases created before the editorial-alignment fields.
alter table public.stories
  add column if not exists uncertainty_note text;
alter table public.stories
  add column if not exists evidence_level text not null default 'Moderate';

do $$
begin
  alter table public.stories
    add constraint stories_evidence_level_check
    check (evidence_level in ('Low', 'Moderate', 'Strong'));
exception
  when duplicate_object then null;
end $$;

create index if not exists stories_status_idx on public.stories(status);
create index if not exists stories_homepage_idx
  on public.stories(status, is_lead desc, homepage_rank asc, published_at desc);

drop trigger if exists stories_set_updated_at on public.stories;
create trigger stories_set_updated_at
before update on public.stories
for each row execute function public.set_updated_at();

create table if not exists public.story_sources (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete restrict,
  feed_item_id uuid references public.feed_items(id) on delete set null,
  url text not null,
  title text not null,
  source_name text not null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists story_sources_story_idx on public.story_sources(story_id);
create index if not exists story_sources_feed_item_idx on public.story_sources(feed_item_id);
create unique index if not exists story_sources_story_url_idx
  on public.story_sources(story_id, url);

create table if not exists public.editorial_selections (
  id uuid primary key default gen_random_uuid(),
  feed_item_id uuid not null references public.feed_items(id) on delete cascade,
  story_id uuid references public.stories(id) on delete set null,
  selection_reason text not null,
  score numeric,
  status text not null default 'draft_created'
    check (status in ('draft_created', 'attached', 'ignored')),
  created_at timestamptz not null default now()
);

create index if not exists editorial_selections_feed_item_idx
  on public.editorial_selections(feed_item_id);
create unique index if not exists editorial_selections_feed_item_unique_idx
  on public.editorial_selections(feed_item_id);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'active'
    check (status in ('active', 'unsubscribed', 'bounced')),
  created_at timestamptz not null default now()
);

-- Recommended for MVP server-only access:
-- alter table public.sources enable row level security;
-- alter table public.feed_items enable row level security;
-- alter table public.stories enable row level security;
-- alter table public.story_sources enable row level security;
-- alter table public.editorial_selections enable row level security;
-- alter table public.subscribers enable row level security;
