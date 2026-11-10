-- Execute only in a disposable PostgreSQL test database with the base schema
-- and the review migration installed. All changes roll back.
begin;
-- Verify least-privilege grants without connecting as production roles.
do $privileges$
begin
  if has_table_privilege('anon', 'public.story_source_reviews', 'SELECT')
     or has_table_privilege('authenticated', 'public.story_source_reviews', 'INSERT')
     or has_function_privilege('anon', 'public.attest_story_source_origin(uuid,uuid,text,text,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.attest_story_source_origin(uuid,uuid,text,text,text)', 'EXECUTE') then
    raise exception 'Unprivileged provenance access granted';
  end if;
  if not has_function_privilege('service_role', 'public.attest_story_source_origin(uuid,uuid,text,text,text)', 'EXECUTE') then
    raise exception 'Service role cannot execute attestation RPC';
  end if;
end $privileges$;
do $
declare
  v_source uuid := gen_random_uuid();
  v_story uuid := gen_random_uuid();
  v_link uuid := gen_random_uuid();
  v_ok boolean;
  v_origin text;
begin
  insert into public.sources(id,name) values (v_source,'Fixture publisher');
  insert into public.stories(id,slug,title,summary,what_happened,why_it_matters,category,signal,confidence)
    values(v_story,'review-fixture-'||v_story,'Fixture','Fixture','Fixture','Fixture','World','Developing','Single-source');
  insert into public.story_sources(id,story_id,source_id,url,title,source_name)
    values(v_link,v_story,v_source,'https://example.org/original','Fixture','Fixture publisher');
  select public.attest_story_source_origin(v_story,v_link,'https://example.org/stale','origin-A','reviewer-A') into v_ok;
  if v_ok then raise exception 'Stale URL accepted'; end if;
  select public.attest_story_source_origin(v_story,v_link,'https://example.org/original','origin-A','reviewer-A') into v_ok;
  if not v_ok then raise exception 'Valid review rejected'; end if;
  -- A no-op URL update must not discard a valid attestation.
  update public.story_sources set url='https://example.org/original' where id=v_link;
  if not exists (select 1 from public.story_source_reviews where story_source_id=v_link and origin_id='origin-A') then
    raise exception 'No-op URL update incorrectly revoked attestation';
  end if;
  update public.story_sources set url='https://example.org/replaced' where id=v_link;
  select origin_id into v_origin from public.story_source_reviews
    where story_source_id=v_link and attested_url=(select url from public.story_sources where id=v_link);
  if v_origin is not null then raise exception 'Replaced URL retained verified origin'; end if;
  if exists (select 1 from public.story_source_reviews where story_source_id=v_link) then
    raise exception 'URL replacement failed to revoke prior attestation';
  end if;
  update public.story_sources set url='https://example.org/original' where id=v_link;
  if exists (select 1 from public.story_source_reviews where story_source_id=v_link) then
    raise exception 'ABA URL restoration resurrected old attestation';
  end if;
  update public.story_sources set url='https://example.org/replaced' where id=v_link;
  select public.attest_story_source_origin(v_story,v_link,'https://example.org/original','origin-B','reviewer-B') into v_ok;
  if v_ok then raise exception 'Concurrent/stale reviewer URL accepted'; end if;
  select public.attest_story_source_origin(v_story,v_link,'https://example.org/replaced','origin-B','reviewer-B') into v_ok;
  if not v_ok then raise exception 'New URL review rejected'; end if;
  delete from public.story_sources where id=v_link;
  if exists(select 1 from public.story_source_reviews where story_source_id=v_link) then
    raise exception 'Deleted source retained review';
  end if;
end $$;
rollback;
