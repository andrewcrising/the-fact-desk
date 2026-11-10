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

-- A row lock serializes reviewer attestations with source edits/deletions.
-- The caller must supply the exact URL reviewed; stale reviews fail.
create or replace function public.attest_story_source_origin(
  p_story_id uuid, p_source_id uuid, p_expected_url text,
  p_origin_id text, p_reviewer_id text
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_url text;
begin
  if nullif(btrim(p_origin_id), '') is null
     or length(p_origin_id) > 256 or p_origin_id <> btrim(p_origin_id)
     or nullif(btrim(p_reviewer_id), '') is null
     or length(p_reviewer_id) > 256 or p_reviewer_id <> btrim(p_reviewer_id)
     or p_expected_url is null then
    raise exception 'Invalid attestation';
  end if;
  select s.url into v_url from public.story_sources s
    where s.id = p_source_id and s.story_id = p_story_id for update;
  if not found or v_url is distinct from p_expected_url then
    return false;
  end if;
  insert into public.story_source_reviews
    (story_source_id, attested_url, origin_id, reviewed_by, reviewed_at)
    values (p_source_id, v_url, p_origin_id, p_reviewer_id, now())
    on conflict (story_source_id) do update
      set attested_url = excluded.attested_url,
          origin_id = excluded.origin_id,
          reviewed_by = excluded.reviewed_by,
          reviewed_at = excluded.reviewed_at;
  return true;
end;
$$;
revoke all on function public.attest_story_source_origin(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.attest_story_source_origin(uuid,uuid,text,text,text) to service_role;
