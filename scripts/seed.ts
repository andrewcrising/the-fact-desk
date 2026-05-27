import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to your environment before running npm run seed.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface SeedSource {
  name: string;
  homepage_url: string;
  feed_url: string;
  source_type: "rss";
}

interface SeedStory {
  slug: string;
  title: string;
  summary: string;
  what_happened: string;
  why_it_matters: string;
  coverage_angle: string;
  category: string;
  signal: string;
  confidence: string;
  status: "draft" | "published";
  homepage_rank: number | null;
  is_lead: boolean;
  tags: string[];
  published_at: string | null;
}

interface SeedFeedItem {
  source: string;
  title: string;
  canonical_url: string;
  summary: string;
  category_hint: string;
}

const sources: SeedSource[] = [
  {
    name: "NPR",
    homepage_url: "https://www.npr.org",
    feed_url: "https://feeds.npr.org/1001/rss.xml",
    source_type: "rss",
  },
  {
    name: "BBC World",
    homepage_url: "https://www.bbc.com/news/world",
    feed_url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    source_type: "rss",
  },
  {
    name: "BBC News",
    homepage_url: "https://www.bbc.com/news",
    feed_url: "https://feeds.bbci.co.uk/news/rss.xml",
    source_type: "rss",
  },
  {
    name: "CISA",
    homepage_url: "https://www.cisa.gov",
    feed_url: "https://www.cisa.gov/cybersecurity-advisories/all.xml",
    source_type: "rss",
  },
  {
    name: "Federal Reserve",
    homepage_url: "https://www.federalreserve.gov",
    feed_url: "https://www.federalreserve.gov/feeds/press_all.xml",
    source_type: "rss",
  },
  {
    name: "SEC",
    homepage_url: "https://www.sec.gov",
    feed_url: "https://www.sec.gov/news/pressreleases.rss",
    source_type: "rss",
  },
  {
    name: "NASA",
    homepage_url: "https://www.nasa.gov",
    feed_url: "https://www.nasa.gov/news-release/feed/",
    source_type: "rss",
  },
  {
    name: "WHO",
    homepage_url: "https://www.who.int",
    feed_url: "https://www.who.int/rss-feeds/news-english.xml",
    source_type: "rss",
  },
  {
    name: "White House",
    homepage_url: "https://www.whitehouse.gov",
    feed_url: "https://www.whitehouse.gov/briefing-room/feed/",
    source_type: "rss",
  },
  {
    name: "NIH",
    homepage_url: "https://www.nih.gov",
    feed_url: "https://www.nih.gov/news-events/news-releases/feed.xml",
    source_type: "rss",
  },
];

const now = new Date().toISOString();

const stories: SeedStory[] = [
  {
    slug: "demo-federal-rate-hold-market-reaction",
    title: "Central bank holds rates while markets parse inflation language",
    summary:
      "Officials left rates unchanged and signaled they need more data before changing course.",
    what_happened:
      "The central bank kept its benchmark rate steady and described inflation progress as uneven. Bond yields moved modestly as investors weighed the statement language.",
    why_it_matters:
      "Rate expectations affect borrowing costs, equity valuations, and consumer credit conditions.",
    coverage_angle:
      "Financial outlets emphasized market pricing while public-radio coverage focused on household borrowing costs.",
    category: "Markets",
    signal: "Top Signal",
    confidence: "Confirmed",
    status: "published",
    homepage_rank: 1,
    is_lead: true,
    tags: ["seed", "markets", "rates"],
    published_at: now,
  },
  {
    slug: "demo-cybersecurity-advisory-industrial-systems",
    title: "Cybersecurity agency flags industrial system vulnerabilities",
    summary:
      "A new advisory urges operators to review exposed systems and apply vendor mitigations.",
    what_happened:
      "A federal cybersecurity bulletin described vulnerabilities affecting industrial software and recommended segmentation, patching, and monitoring.",
    why_it_matters:
      "Industrial advisories can indicate operational risk for energy, manufacturing, and public infrastructure operators.",
    coverage_angle:
      "Technical sources focused on CVEs; broader coverage remains limited unless exploitation is confirmed.",
    category: "Technology",
    signal: "Under-covered",
    confidence: "Single-source",
    status: "published",
    homepage_rank: 2,
    is_lead: false,
    tags: ["seed", "cybersecurity"],
    published_at: now,
  },
  {
    slug: "demo-global-health-guidance-update",
    title: "Health agencies update respiratory illness guidance",
    summary:
      "Public health agencies refreshed seasonal guidance as surveillance data showed regional variation.",
    what_happened:
      "Health officials updated public guidance around respiratory illness prevention, testing, and risk reduction for vulnerable groups.",
    why_it_matters:
      "Clear guidance helps clinicians, families, and workplaces distinguish routine seasonal precautions from emerging risk signals.",
    coverage_angle:
      "Public health sources emphasized prevention; local outlets focused on school and workplace impacts.",
    category: "Health",
    signal: "Cross-angle",
    confidence: "Developing",
    status: "published",
    homepage_rank: 3,
    is_lead: false,
    tags: ["seed", "health"],
    published_at: now,
  },
  {
    slug: "demo-draft-energy-grid-rule",
    title: "Draft: Regulators consider energy grid reliability rule",
    summary:
      "A draft briefing tracking a proposed reliability rule and early stakeholder response.",
    what_happened:
      "Regulators opened discussion around reliability requirements for grid operators. The story needs more source review before publication.",
    why_it_matters:
      "Grid reliability rules can affect utilities, industrial customers, and state energy planning.",
    coverage_angle: "Draft seed story for editor workflow testing.",
    category: "Energy",
    signal: "Developing",
    confidence: "Single-source",
    status: "draft",
    homepage_rank: null,
    is_lead: false,
    tags: ["seed", "draft"],
    published_at: null,
  },
];

const feedItems: SeedFeedItem[] = [
  {
    source: "NPR",
    title: "Seed inbox: Congress weighs disaster aid package",
    canonical_url: "https://example.com/seed/congress-disaster-aid",
    summary: "A seeded inbox item for testing editorial promotion.",
    category_hint: "Politics",
  },
  {
    source: "BBC World",
    title: "Seed inbox: Diplomats meet after regional escalation",
    canonical_url: "https://example.com/seed/diplomats-regional-escalation",
    summary: "A seeded inbox item representing a developing world story.",
    category_hint: "World",
  },
  {
    source: "CISA",
    title: "Seed inbox: Vendor patch released for access-control flaw",
    canonical_url: "https://example.com/seed/vendor-access-control-flaw",
    summary: "A seeded technical advisory for inbox testing.",
    category_hint: "Technology",
  },
  {
    source: "WHO",
    title: "Seed inbox: Health officials review supplement safety data",
    canonical_url: "https://example.com/seed/supplement-safety-data",
    summary: "A seeded health item for Health Desk lifecycle testing.",
    category_hint: "Health",
  },
  {
    source: "Federal Reserve",
    title: "Seed inbox: Bank supervisors publish resilience note",
    canonical_url: "https://example.com/seed/bank-resilience-note",
    summary: "A seeded markets item for testing source attachment.",
    category_hint: "Markets",
  },
];

async function upsertSource(source: SeedSource) {
  const { data, error } = await supabase
    .from("sources")
    .upsert(
      {
        ...source,
        active: true,
        credibility_score: null,
        political_or_editorial_label: null,
      },
      { onConflict: "feed_url" },
    )
    .select("id,name,feed_url")
    .single();

  if (error) throw error;
  return data as { id: string; name: string; feed_url: string };
}

async function upsertStory(story: SeedStory) {
  const { data, error } = await supabase
    .from("stories")
    .upsert(story, { onConflict: "slug" })
    .select("id,slug,title")
    .single();

  if (error) throw error;
  return data as { id: string; slug: string; title: string };
}

async function main() {
  console.log("Seeding The Fact Desk MVP data...");

  const sourceByName = new Map<string, { id: string; name: string; feed_url: string }>();
  for (const source of sources) {
    const row = await upsertSource(source);
    sourceByName.set(row.name, row);
  }
  console.log(`Upserted ${sourceByName.size} sources.`);

  const defaultSource = sourceByName.get("NPR")!;
  for (const story of stories) {
    const row = await upsertStory(story);
    const { error } = await supabase.from("story_sources").upsert(
      {
        story_id: row.id,
        source_id: defaultSource.id,
        url: `https://example.com/seed/story/${story.slug}`,
        title: row.title,
        source_name: defaultSource.name,
        published_at: story.published_at,
      },
      { onConflict: "story_id,url" },
    );
    if (error) throw error;
  }
  console.log(`Upserted ${stories.length} demo stories.`);

  for (const item of feedItems) {
    const source = sourceByName.get(item.source)!;
    const dedupeKey = `${source.id}::${item.canonical_url}::seed`;
    const { error } = await supabase.from("feed_items").upsert(
      {
        source_id: source.id,
        title: item.title,
        url: item.canonical_url,
        canonical_url: item.canonical_url,
        author: null,
        published_at: now,
        summary: item.summary,
        raw_payload: { seeded: true, category_hint: item.category_hint },
        status: "new",
        dedupe_key: dedupeKey,
      },
      { onConflict: "dedupe_key" },
    );
    if (error) throw error;
  }
  console.log(`Upserted ${feedItems.length} feed inbox items.`);

  console.log("Seed complete. Open /admin, load Feed Inbox, promote a draft, then publish it.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
