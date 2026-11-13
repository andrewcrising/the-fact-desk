-- Additive upgrade for databases that already applied 20261109_story_source_reviews.sql.
-- Preserves existing provenance table, grants, and attestation RPC.
-- Must first be tested on a disposable database with the authentic base schema.
create or replace function public.invalidate_changed_source_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.url is distinct from new.url
     or old.story_id is distinct from new.story_id
     or old.source_id is distinct from new.source_id then
    delete from public.story_source_reviews
      where story_source_id = old.id;
  end if;
  return new;
end;
$$;
revoke all on function public.invalidate_changed_source_review() from public, anon, authenticated;
drop trigger if exists story_sources_invalidate_review_on_url_change on public.story_sources;
create trigger story_sources_invalidate_review_on_url_change
  after update of url, story_id, source_id on public.story_sources
  for each row execute function public.invalidate_changed_source_review();
