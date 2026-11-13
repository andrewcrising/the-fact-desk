-- Run only against a disposable PostgreSQL database with base schema and
-- 20261109_story_source_reviews.sql installed. Never against production.
begin;
do $identity_regression$
declare
  publisher_a uuid := gen_random_uuid();
  publisher_b uuid := gen_random_uuid();
  story_a uuid := gen_random_uuid();
  story_b uuid := gen_random_uuid();
  link_id uuid := gen_random_uuid();
  ok boolean;
begin
  insert into public.sources(id,name) values
    (publisher_a,'Fixture publisher A'),(publisher_b,'Fixture publisher B');
  insert into public.stories(id,slug,title,summary,what_happened,why_it_matters,category,signal,confidence)
    values
    (story_a,'identity-a-'||story_a,'Fixture A','Fixture','Fixture','Fixture','World','Developing','Single-source'),
    (story_b,'identity-b-'||story_b,'Fixture B','Fixture','Fixture','Fixture','World','Developing','Single-source');
  insert into public.story_sources(id,story_id,source_id,url,title,source_name)
    values(link_id,story_a,publisher_a,'https://example.org/identity','Fixture','Fixture publisher A');
  select public.attest_story_source_origin(story_a,link_id,'https://example.org/identity','origin-A','reviewer-A') into ok;
  if not ok then raise exception 'Initial review rejected'; end if;
  -- No-op identity update preserves an existing review.
  update public.story_sources set story_id=story_a,source_id=publisher_a where id=link_id;
  if not exists(select 1 from public.story_source_reviews where story_source_id=link_id) then
    raise exception 'No-op identity update revoked attestation';
  end if;
  -- Reassignment of publisher with the URL unchanged MUST revoke the review.
  update public.story_sources set source_id=publisher_b where id=link_id;
  if exists(select 1 from public.story_source_reviews where story_source_id=link_id) then
    raise exception 'Publisher reassignment retained prior origin attestation';
  end if;
  select public.attest_story_source_origin(story_a,link_id,'https://example.org/identity','origin-B','reviewer-B') into ok;
  if not ok then raise exception 'Review after publisher reassignment rejected'; end if;
  -- Reassignment of story with the URL unchanged MUST also revoke the review.
  update public.story_sources set story_id=story_b where id=link_id;
  if exists(select 1 from public.story_source_reviews where story_source_id=link_id) then
    raise exception 'Story reassignment retained prior origin attestation';
  end if;
  -- The old story ID cannot re-attest a reassigned source.
  select public.attest_story_source_origin(story_a,link_id,'https://example.org/identity','origin-A','reviewer-A') into ok;
  if ok then raise exception 'Old story successfully re-attested reassigned source'; end if;
  select public.attest_story_source_origin(story_b,link_id,'https://example.org/identity','origin-B','reviewer-B') into ok;
  if not ok then raise exception 'New story review rejected'; end if;
  -- Reverting to the original publisher/story (ABA) must not resurrect an old review.
  update public.story_sources set story_id=story_a,source_id=publisher_a where id=link_id;
  if exists(select 1 from public.story_source_reviews where story_source_id=link_id) then
    raise exception 'ABA identity restoration resurrected attestation';
  end if;
end $identity_regression$;
rollback;
