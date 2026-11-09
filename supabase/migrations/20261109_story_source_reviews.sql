-- Additive, service-role-only editorial provenance attestations.
-- Must be applied and verified in a nonproduction database before enabling the route.
create table if not exists public.story_source_reviews (
  story_source_id uuid primary key references public.story_sources(id) on delete cascade,
  attested_url text not null,
  origin_id text not null check (length(btrim(origin_id)) between 1 and 256),
  reviewed_by text not null check (length(btrim(reviewed_by)) between 1 and 256),
  reviewed_at timestamptz not null default now(),
  check (origin_id = btrim(origin_id)),
  check (reviewed_by = btrim(reviewed_by))
);
create index if not exists story_source_reviews_origin_idx on public.story_source_reviews(origin_id);
alter table public.story_source_reviews enable row level security;
revoke all on public.story_source_reviews from public, anon, authenticated;
grant select, insert, update, delete on public.story_source_reviews to service_role;
-- No authenticated/anon policies: only the privileged server role can read or write.
