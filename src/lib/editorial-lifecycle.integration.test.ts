import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { GET as listStoriesRoute, POST as createStoryRoute } from "@/app/api/stories/route";
import {
  GET as storyDetailRoute,
  PATCH as updateStoryRoute,
} from "@/app/api/stories/[id]/route";
import { POST as archiveStoryRoute } from "@/app/api/stories/[id]/archive/route";
import { POST as evidenceAssistRoute } from "@/app/api/stories/[id]/evidence-assist/route";
import { POST as publishStoryRoute } from "@/app/api/stories/[id]/publish/route";
import { POST as promoteFeedItemRoute } from "@/app/api/feed-items/[id]/promote/route";
import { GET as listFeedItemsRoute } from "@/app/api/feed-items/route";
import { GET as ingestRssRoute } from "@/app/api/ingest/rss/route";
import { POST as newsletterSignupRoute } from "@/app/api/newsletter/signup/route";
import { getOrCreateSource, listSources } from "@/lib/source-repository";
import { getFeedItemById } from "@/lib/feed-repository";
import {
  archiveStory,
  getHomepageStories,
  getStoryBySlug,
  listStories,
} from "@/lib/story-repository";
import { resetSupabaseAdminForTests } from "@/lib/supabase";
import { buildDedupeKey } from "@/lib/url";
import type { NextRequest } from "next/server";
import type { PersistedStory } from "@/types/editorial";
import type { EvidenceProfile } from "@/lib/evidence-scoring";

function integrationSkipReason(): string | false {
  if (process.env.RUN_INTEGRATION_TESTS !== "true") {
    return "Set RUN_INTEGRATION_TESTS=true to run Supabase integration tests.";
  }
  if (process.env.NODE_ENV === "production") {
    return "Integration tests never run with NODE_ENV=production.";
  }
  if (!process.env.SUPABASE_TEST_URL || !process.env.SUPABASE_TEST_SERVICE_ROLE_KEY) {
    return "Set SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_ROLE_KEY.";
  }
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_TEST_URL === process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_TEST_ALLOW_SHARED_DATABASE !== "true"
  ) {
    return "SUPABASE_TEST_URL matches app Supabase URL. Set SUPABASE_TEST_ALLOW_SHARED_DATABASE=true only for a disposable test DB.";
  }

  const hostname = new URL(process.env.SUPABASE_TEST_URL).hostname;
  const local = hostname === "localhost" || hostname === "127.0.0.1";
  if (!local && process.env.SUPABASE_TEST_ALLOW_REMOTE !== "true") {
    return "Remote test Supabase requires SUPABASE_TEST_ALLOW_REMOTE=true.";
  }

  return false;
}

function jsonRequest(
  url: string,
  body?: Record<string, unknown>,
  token?: string,
): NextRequest {
  return new Request(url, {
    method: body ? "POST" : "GET",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  }) as NextRequest;
}

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

const skip = integrationSkipReason();

describe("Supabase editorial lifecycle integration", { skip }, () => {
  let supabase: SupabaseClient;
  const runId = `it-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const adminToken = `admin-${runId}`;
  const cronSecret = `cron-${runId}`;
  const createdStoryIds: string[] = [];
  const createdFeedItemIds: string[] = [];
  const sourceFeedUrl = `https://example.com/${runId}/rss.xml`;
  const subscriberEmail = `${runId}@example.com`;

  before(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_TEST_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
    process.env.ADMIN_API_TOKEN = adminToken;
    process.env.CRON_SECRET = cronSecret;
    process.env.ALLOW_MOCK_FALLBACK = "false";
    resetSupabaseAdminForTests();

    supabase = createClient(
      process.env.SUPABASE_TEST_URL!,
      process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  });

  after(async () => {
    if (!supabase) return;

    await supabase.from("subscribers").delete().eq("email", subscriberEmail);
    await supabase
      .from("editorial_selections")
      .delete()
      .in("feed_item_id", createdFeedItemIds.length ? createdFeedItemIds : ["00000000-0000-0000-0000-000000000000"]);
    await supabase.from("feed_items").delete().like("dedupe_key", `%${runId}%`);
    await supabase.from("stories").delete().like("slug", `${runId}%`);
    if (createdStoryIds.length) {
      await supabase.from("stories").delete().in("id", createdStoryIds);
    }
    await supabase.from("sources").delete().eq("feed_url", sourceFeedUrl);
  });

  it("runs the full editorial lifecycle against Supabase", async () => {
    const source = await getOrCreateSource({
      name: `Integration Source ${runId}`,
      homepageUrl: `https://example.com/${runId}`,
      feedUrl: sourceFeedUrl,
      sourceType: "rss",
    });

    const sources = await listSources();
    assert.ok(sources.some((item) => item.id === source.id));

    const canonicalUrl = `https://example.com/${runId}/feed-item`;
    const dedupeKey = buildDedupeKey({
      sourceId: source.id,
      title: `${runId} feed item`,
      canonicalUrl,
      publishedAt: "2026-05-27T12:00:00.000Z",
    });

    const { data: feedItem, error: feedInsertError } = await supabase
      .from("feed_items")
      .insert({
        source_id: source.id,
        title: `${runId} feed item`,
        url: canonicalUrl,
        canonical_url: canonicalUrl,
        published_at: "2026-05-27T12:00:00.000Z",
        summary: "Integration feed item summary.",
        raw_payload: { runId },
        status: "new",
        dedupe_key: dedupeKey,
      })
      .select("*")
      .single();
    assert.ifError(feedInsertError);
    createdFeedItemIds.push(feedItem.id);

    const { error: duplicateError } = await supabase.from("feed_items").insert({
      source_id: source.id,
      title: `${runId} feed item duplicate`,
      url: canonicalUrl,
      canonical_url: canonicalUrl,
      status: "new",
      dedupe_key: dedupeKey,
    });
    assert.equal(duplicateError?.code, "23505");

    const { count } = await supabase
      .from("feed_items")
      .select("id", { count: "exact", head: true })
      .eq("dedupe_key", dedupeKey);
    assert.equal(count, 1);

    const missingFeedList = await listFeedItemsRoute(
      jsonRequest("https://example.com/api/feed-items") as NextRequest,
    );
    assert.equal(missingFeedList.status, 401);

    const promoteResponse = await promoteFeedItemRoute(
      jsonRequest(
        `https://example.com/api/feed-items/${feedItem.id}/promote`,
        {},
        adminToken,
      ),
      context(feedItem.id),
    );
    assert.equal(promoteResponse.status, 201);
    const promoted = await json(promoteResponse);
    const story = promoted.story as PersistedStory;
    assert.equal(story.status, "draft");
    createdStoryIds.push(story.id);

    const promotedFeedItem = await getFeedItemById(feedItem.id);
    assert.equal(promotedFeedItem?.status, "promoted");

    const { count: selectionCount } = await supabase
      .from("editorial_selections")
      .select("id", { count: "exact", head: true })
      .eq("feed_item_id", feedItem.id);
    assert.equal(selectionCount, 1);

    const { count: sourceLinkCount } = await supabase
      .from("story_sources")
      .select("id", { count: "exact", head: true })
      .eq("story_id", story.id)
      .eq("feed_item_id", feedItem.id);
    assert.equal(sourceLinkCount, 1);

    const repeatPromote = await promoteFeedItemRoute(
      jsonRequest(
        `https://example.com/api/feed-items/${feedItem.id}/promote`,
        {},
        adminToken,
      ),
      context(feedItem.id),
    );
    const repeated = await json(repeatPromote);
    assert.equal((repeated.story as PersistedStory).id, story.id);

    const assistResponse = await evidenceAssistRoute(
      jsonRequest(
        `https://example.com/api/stories/${story.id}/evidence-assist`,
        {},
        adminToken,
      ),
      context(story.id),
    );
    assert.equal(assistResponse.status, 200);
    const assist = await json(assistResponse);
    const profile = assist.profile as EvidenceProfile;
    assert.equal(profile.source_count, 1);
    assert.equal(profile.suggested_evidence_level, "Low");

    const updateResponse = await updateStoryRoute(
      jsonRequest(
        `https://example.com/api/stories/${story.id}`,
        {
          title: `${runId} edited lifecycle story`,
          summary: "Edited integration summary.",
          whatHappened: "Edited what happened.",
          whyItMatters: "Edited why it matters.",
          confidence: "Confirmed",
          evidenceLevel: "Strong",
          uncertaintyNote: "Integration uncertainty note.",
          signal: "Top Signal",
          category: "Technology",
          tags: ["integration", runId],
        },
        adminToken,
      ),
      context(story.id),
    );
    assert.equal(updateResponse.status, 200);
    const updated = await json(updateResponse);
    const updatedStory = updated.story as PersistedStory;
    assert.equal(updatedStory.title, `${runId} edited lifecycle story`);
    assert.equal(updatedStory.confidence, "Confirmed");
    assert.equal(updatedStory.evidenceLevel, "Strong");
    assert.equal(updatedStory.uncertaintyNote, "Integration uncertainty note.");
    assert.deepEqual(updatedStory.tags, ["integration", runId]);

    const createSecondResponse = await createStoryRoute(
      jsonRequest(
        "https://example.com/api/stories",
        {
          title: `${runId} second ordering story`,
          slug: `${runId}-second-ordering-story`,
          summary: "Second story summary.",
          whatHappened: "Second story happened.",
          whyItMatters: "Second story matters.",
          category: "World",
          signal: "Developing",
          confidence: "Single-source",
          evidenceLevel: "Low",
          uncertaintyNote: "Second integration story uncertainty.",
          tags: [runId],
          sourceAttachments: [
            {
              sourceName: source.name,
              url: `https://example.com/${runId}/second-source`,
              title: "Second source",
            },
          ],
        },
        adminToken,
      ),
    );
    assert.equal(createSecondResponse.status, 201);
    const second = await json(createSecondResponse);
    const secondStory = second.story as PersistedStory;
    createdStoryIds.push(secondStory.id);

    await publishStoryRoute(
      jsonRequest(
        `https://example.com/api/stories/${secondStory.id}/publish`,
        { homepageRank: 2, isLead: false },
        adminToken,
      ),
      context(secondStory.id),
    );

    const publishResponse = await publishStoryRoute(
      jsonRequest(
        `https://example.com/api/stories/${story.id}/publish`,
        { homepageRank: 1, isLead: true },
        adminToken,
      ),
      context(story.id),
    );
    assert.equal(publishResponse.status, 200);
    const published = await json(publishResponse);
    const publishedStory = published.story as PersistedStory;
    assert.equal(publishedStory.status, "published");
    assert.ok(publishedStory.publishedAt);
    assert.equal(publishedStory.isLead, true);
    assert.equal(publishedStory.homepageRank, 1);

    const publicStories = await listStories({ status: "published", search: runId });
    assert.equal(publicStories[0].id, story.id);
    assert.equal(publicStories[0].isLead, true);
    assert.deepEqual(
      publicStories.map((item) => item.homepageRank),
      [1, 2],
    );

    const homepageStories = await getHomepageStories();
    assert.ok(homepageStories.some((item) => item.id === story.id));

    const slugLookup = await getStoryBySlug(publishedStory.slug);
    assert.equal(slugLookup?.id, story.id);

    const publicDetail = await storyDetailRoute(
      jsonRequest(`https://example.com/api/stories/${publishedStory.slug}`),
      context(publishedStory.slug),
    );
    assert.equal(publicDetail.status, 200);

    const publicListRoute = await listStoriesRoute(
      jsonRequest(`https://example.com/api/stories?search=${runId}`),
    );
    assert.equal(publicListRoute.status, 200);
    const publicList = await json(publicListRoute);
    const publicListStories = publicList.stories as PersistedStory[];
    assert.equal(publicListStories[0].id, story.id);

    const archiveResponse = await archiveStoryRoute(
      jsonRequest(
        `https://example.com/api/stories/${story.id}/archive`,
        {},
        adminToken,
      ),
      context(story.id),
    );
    assert.equal(archiveResponse.status, 200);
    const archived = await json(archiveResponse);
    const archivedStory = archived.story as PersistedStory;
    assert.equal(archivedStory.status, "archived");

    const afterArchive = await getStoryBySlug(publishedStory.slug);
    assert.equal(afterArchive, undefined);
    const publicAfterArchive = await listStories({
      status: "published",
      search: runId,
    });
    assert.equal(publicAfterArchive.some((item) => item.id === story.id), false);

    await archiveStory(secondStory.id);
  });

  it("exercises newsletter and protected route behavior", async () => {
    const invalidNewsletter = await newsletterSignupRoute(
      jsonRequest("https://example.com/api/newsletter/signup", {
        email: "invalid",
      }),
    );
    assert.equal(invalidNewsletter.status, 400);

    const honeypotNewsletter = await newsletterSignupRoute(
      jsonRequest("https://example.com/api/newsletter/signup", {
        email: subscriberEmail,
        company: "bot",
      }),
    );
    assert.equal(honeypotNewsletter.status, 202);

    const validNewsletter = await newsletterSignupRoute(
      jsonRequest("https://example.com/api/newsletter/signup", {
        email: subscriberEmail,
      }),
    );
    assert.equal(validNewsletter.status, 201);
    const duplicateNewsletter = await newsletterSignupRoute(
      jsonRequest("https://example.com/api/newsletter/signup", {
        email: subscriberEmail,
      }),
    );
    assert.equal(duplicateNewsletter.status, 201);

    const missingAdmin = await createStoryRoute(
      jsonRequest("https://example.com/api/stories", {
        title: `${runId} unauthorized`,
      }),
    );
    assert.equal(missingAdmin.status, 401);

    const invalidCron = await ingestRssRoute(
      jsonRequest("https://example.com/api/ingest/rss"),
    );
    assert.equal(invalidCron.status, 401);

    const invalidCronToken = await ingestRssRoute(
      jsonRequest("https://example.com/api/ingest/rss", undefined, "wrong"),
    );
    assert.equal(invalidCronToken.status, 401);
  });
});
