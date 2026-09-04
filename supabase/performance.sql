-- The Fact Desk Supabase performance hardening.
-- Apply after schema.sql. These indexes cover foreign keys flagged by the
-- Supabase performance advisor and are safe to run repeatedly.

create index if not exists editorial_selections_story_idx
  on public.editorial_selections(story_id);

create index if not exists story_sources_source_idx
  on public.story_sources(source_id);
