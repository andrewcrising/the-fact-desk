-- The Fact Desk Supabase security hardening.
--
-- Run this immediately after supabase/schema.sql and before configuring the
-- application with production Supabase credentials.
--
-- The MVP accesses these tables only from server-side code using the Supabase
-- service role. New Supabase projects no longer guarantee automatic Data API
-- grants, so service_role access is granted explicitly while browser-facing
-- anon/authenticated access is revoked.

alter table public.sources enable row level security;
alter table public.feed_items enable row level security;
alter table public.stories enable row level security;
alter table public.story_sources enable row level security;
alter table public.editorial_selections enable row level security;
alter table public.subscribers enable row level security;
alter table public.automation_runs enable row level security;
alter table public.story_automation_events enable row level security;

revoke all on table
  public.sources,
  public.feed_items,
  public.stories,
  public.story_sources,
  public.editorial_selections,
  public.subscribers,
  public.automation_runs,
  public.story_automation_events
from anon, authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on table
  public.sources,
  public.feed_items,
  public.stories,
  public.story_sources,
  public.editorial_selections,
  public.subscribers,
  public.automation_runs,
  public.story_automation_events
to service_role;

-- set_updated_at is used only by database triggers. Keep direct execution out
-- of browser roles and make service-role execution explicit for clarity.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
grant execute on function public.set_updated_at() to service_role;

-- Do not add permissive anon/authenticated policies unless a future feature
-- explicitly requires direct browser access. Public reads should continue to
-- flow through the Next.js server layer, which returns only editorially
-- published data.
