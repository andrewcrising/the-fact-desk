-- The Fact Desk Supabase security hardening.
--
-- Run this immediately after supabase/schema.sql and before configuring the
-- application with production Supabase credentials.
--
-- The MVP accesses these tables only from server-side code using the Supabase
-- service role. Enabling RLS with no anon/authenticated policies keeps the
-- public Data API closed while preserving service-role access.

alter table public.sources enable row level security;
alter table public.feed_items enable row level security;
alter table public.stories enable row level security;
alter table public.story_sources enable row level security;
alter table public.editorial_selections enable row level security;
alter table public.subscribers enable row level security;
alter table public.automation_runs enable row level security;
alter table public.story_automation_events enable row level security;

-- Do not add permissive anon/authenticated policies unless a future feature
-- explicitly requires direct browser access. Public reads should continue to
-- flow through the Next.js server layer, which returns only editorially
-- published data.
