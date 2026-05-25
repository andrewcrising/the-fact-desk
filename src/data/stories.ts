/**
 * Central story store for The Fact Desk prototype.
 *
 * UI and routes should read via `src/lib/story-repository.ts`, not import
 * this array directly (except the repository itself).
 *
 * Replace this module later without rewriting UI components:
 * - RSS ingestion (normalize to `Story` shape in a loader)
 * - News APIs (Reuters, AP, etc. — map fields in `lib/ingest/`)
 * - Supabase / Postgres (query in Server Components or Route Handlers)
 * - Scheduled cron refresh (Vercel cron → fetch → upsert DB)
 * - AI summarization/scoring (post-process records before save)
 *
 * Keep the `Story` type stable; add optional fields rather than breaking renames.
 */
import type { Story } from "@/types/story";

export const stories: Story[] = [
  {
    id: "1",
    slug: "disaster-relief-audit-preliminary",
    title:
      "Federal agency releases preliminary audit of disaster relief spending",
    summary:
      "Inspector general report flags delayed disbursements in three states while confirming most approved funds reached designated accounts.",
    whatHappened:
      "The inspector general published a preliminary audit covering disaster relief spending for fiscal years 2023–2025. It confirms most approved funds reached designated accounts but documents slower disbursements in three states. No criminal referrals appear in this release.",
    whyItMatters:
      "Congress and state officials are using the findings to scrutinize allocation timelines ahead of the next budget cycle. Until final reserve figures are published, debate will focus on process delays rather than proven fraud.",
    category: "Politics",
    confidence: "Developing",
    signal: "Top Signal",
    sources: ["Reuters", "AP", "Politico", "Official IG release"],
    sourceUrls: [
      "https://www.reuters.com",
      "https://apnews.com",
    ],
    publishedAt: "2026-05-23T07:00:00Z",
    updatedAt: "2026-05-23T09:12:00Z",
    tags: ["federal-budget", "disaster-relief", "audit"],
    coverageAngle:
      "Wire services stress compliance timelines; local outlets emphasize constituent wait times.",
  },
  {
    id: "2",
    slug: "central-bank-holds-rates-mixed-inflation",
    title: "Central bank holds benchmark rate steady amid mixed inflation signals",
    summary:
      "Policy makers noted easing goods prices but persistent services inflation; markets had largely priced in no change.",
    whatHappened:
      "The central bank voted 9–1 to leave its benchmark rate unchanged. One member dissented in favor of a quarter-point cut. The policy statement shifted wording toward data-dependent next steps.",
    whyItMatters:
      "Borrowing costs for mortgages and business credit will stay elevated in the near term. Labor and inflation prints over the next two months are likely to drive the next policy debate.",
    category: "Markets",
    confidence: "Confirmed",
    signal: "Cross-angle",
    sources: ["Reuters", "Bloomberg", "FT", "Official policy statement"],
    publishedAt: "2026-05-23T06:30:00Z",
    updatedAt: "2026-05-23T07:00:00Z",
    tags: ["interest-rates", "inflation", "monetary-policy"],
    coverageAngle:
      "Financial press leads with bond yields; consumer outlets translate impacts to household budgets.",
  },
  {
    id: "3",
    slug: "enterprise-login-zero-day-patch",
    title: "Major platform patches zero-day affecting enterprise login flows",
    summary:
      "Vendor credits coordinated disclosure; researchers report limited exploitation attempts focused on government contractors.",
    whatHappened:
      "A software vendor shipped patch version 12.4.2 to stable channels after coordinated disclosure of a zero-day in enterprise login flows. A CVE has been assigned and a U.S. cyber agency added the flaw to its known-exploited catalog.",
    whyItMatters:
      "Government contractors and large enterprises are being urged to patch immediately. Researchers are still assessing how long the vulnerability existed before disclosure.",
    category: "Technology",
    confidence: "Developing",
    signal: "Top Signal",
    sources: ["BleepingComputer", "Reuters", "CISA", "Vendor advisory"],
    publishedAt: "2026-05-23T05:00:00Z",
    updatedAt: "2026-05-23T06:22:00Z",
    tags: ["cybersecurity", "zero-day", "enterprise"],
    coverageAngle:
      "Security trade press emphasizes patch urgency; mainstream summaries focus on government contractor risk.",
  },
  {
    id: "4",
    slug: "ceasefire-monitoring-terms-talks",
    title: "Coalition negotiators report incremental progress on ceasefire monitoring terms",
    summary:
      "Mediators describe agreement on inspection routes but say timelines for troop movements remain unsettled after overnight talks.",
    whatHappened:
      "Talks continued for a second day. A UN spokesperson confirmed an inspection-route document exists. Delegations give conflicting accounts of whether withdrawal phases were agreed in principle.",
    whyItMatters:
      "Humanitarian corridor access depends on verifiable monitoring. Until signed text is published, on-the-ground verification remains limited and public narratives may diverge from formal agreements.",
    category: "World",
    confidence: "Disputed",
    signal: "Cross-angle",
    sources: ["Reuters", "AFP", "UN spokesperson", "Regional state media"],
    publishedAt: "2026-05-23T08:00:00Z",
    updatedAt: "2026-05-23T10:05:00Z",
    tags: ["diplomacy", "ceasefire", "humanitarian"],
    coverageAngle:
      "International agencies stress corridor access; state outlets publish divergent readouts.",
  },
  {
    id: "5",
    slug: "rural-telehealth-specialist-gaps",
    title: "Study finds specialist telehealth access gaps persist in rural clinic network",
    summary:
      "Peer-reviewed findings show improved primary care reach but uneven specialist availability; broadband upgrades correlate with shorter waits.",
    whatHappened:
      "A peer-reviewed study of 42 clinics over 18 months reports improved primary telehealth reach but persistent specialist access gaps. Counties with documented fiber upgrades saw shorter specialist wait times.",
    whyItMatters:
      "Rural health policy debates often focus on reimbursement and infrastructure together. National outlets have given limited attention relative to the size of the affected population.",
    category: "Health",
    confidence: "Confirmed",
    signal: "Under-covered",
    sources: ["JAMA Network Open", "Local health press", "State health dept."],
    publishedAt: "2026-05-21T12:00:00Z",
    updatedAt: "2026-05-21T14:00:00Z",
    tags: ["telehealth", "rural-health", "broadband"],
    coverageAngle:
      "Local and specialty health press cover findings; major national desks have not widely picked up the study.",
  },
  {
    id: "6",
    slug: "digital-evidence-appeals-court",
    title: "Appeals court schedules arguments on digital evidence authentication rules",
    summary:
      "Dispute centers on whether encrypted messaging metadata meets authentication standards without expert testimony.",
    whatHappened:
      "An appeals court set oral arguments for next month in a case that could affect how encrypted messaging metadata is admitted without expert testimony. The lower court excluded two exhibits in a fraud prosecution.",
    whyItMatters:
      "A ruling could influence pending cases nationwide and prompt legislative review of evidence standards for digital communications.",
    category: "Courts",
    confidence: "Developing",
    signal: "Cross-angle",
    sources: ["Reuters Legal", "Law360", "Court docket"],
    publishedAt: "2026-05-22T14:00:00Z",
    updatedAt: "2026-05-22T16:30:00Z",
    tags: ["evidence", "encryption", "appeals"],
    coverageAngle:
      "Legal analysis sites compare wiretap and email precedents; general news stresses privacy and prosecution tradeoffs.",
  },
  {
    id: "7",
    slug: "regional-reservoir-conservation-extension",
    title: "Regional water authority extends conservation measures through summer",
    summary:
      "Reservoir storage at 68% of capacity; board vote was unanimous as officials warn of stricter tiers if rainfall underperforms.",
    whatHappened:
      "A regional water authority voted unanimously to extend stage-two conservation through summer. Reservoir storage is at 68% of capacity. Agricultural users remain under restricted irrigation schedules.",
    whyItMatters:
      "Food supply and municipal water rates in the region may be affected if precipitation underperforms. Growers have raised questions about alternate supply contracts cited in briefings.",
    category: "Energy",
    confidence: "Confirmed",
    signal: "Under-covered",
    sources: ["Local Gazette", "State water board", "AP"],
    publishedAt: "2026-05-23T07:30:00Z",
    updatedAt: "2026-05-23T08:45:00Z",
    tags: ["water", "drought", "agriculture"],
    coverageAngle:
      "Local outlets emphasize household rules; agricultural trade press focuses on yield risk.",
  },
  {
    id: "8",
    slug: "outlet-poll-methodology-disclosure-debate",
    title: "Trade journal questions whether poll methodology was fully disclosed on air",
    summary:
      "Outlet says methodology page was updated last month; critics cite a March broadcast segment and request raw tables.",
    whatHappened:
      "A media trade journal published a critique alleging missing sampling details in a March 14 broadcast segment. The outlet says on-air remarks referred to a different tracking poll and that its methodology PDF was updated recently.",
    whyItMatters:
      "Transparency standards for election polling are under renewed scrutiny. Academic pollsters have called for release of full methodology regardless of outlet response.",
    category: "Culture",
    confidence: "Single-source",
    signal: "Developing",
    sources: ["Trade journal critique", "Outlet methodology page"],
    publishedAt: "2026-05-22T18:00:00Z",
    updatedAt: "2026-05-22T20:15:00Z",
    tags: ["media", "polling", "transparency"],
    coverageAngle:
      "Media critics frame transparency; defenders argue the critique misrepresents segment context.",
  },
  {
    id: "9",
    slug: "grid-battery-storage-procurement-delay",
    title: "State regulator delays approval of large battery storage procurement",
    summary:
      "Decision pushed to July citing interconnection study gaps; utilities say delay may affect 2027 reliability targets.",
    whatHappened:
      "A state utility regulator delayed until July its decision on a large battery storage procurement, citing incomplete interconnection studies. Participating utilities warned the delay could affect 2027 reliability planning.",
    whyItMatters:
      "Grid reliability and renewable integration timelines are sensitive to procurement schedules. The order does not cancel the project but introduces schedule uncertainty.",
    category: "Energy",
    confidence: "Developing",
    signal: "Developing",
    sources: ["Energy trade press", "Regulatory filing", "Utility statement"],
    publishedAt: "2026-05-22T10:00:00Z",
    updatedAt: "2026-05-22T11:30:00Z",
    tags: ["grid", "storage", "regulation"],
  },
  {
    id: "10",
    slug: "city-transit-fare-pilot-timeline-corrected",
    title: "City council corrects transit fare pilot start date to September",
    summary:
      "Officials revised an earlier July timeline after reporter questions about contractor readiness; pilot goals unchanged.",
    whatHappened:
      "The city issued a corrected press release moving a fare pilot start from July to September. Council approved the pilot in April; vendor contracts require 60 days of system testing.",
    whyItMatters:
      "Riders and advocates need accurate timelines for fare changes. The correction highlights how early communications can outpace contracting realities.",
    category: "Politics",
    confidence: "Confirmed",
    signal: "Developing",
    sources: ["City press office", "Local newsroom", "Transit advocates"],
    publishedAt: "2026-05-23T04:00:00Z",
    updatedAt: "2026-05-23T05:40:00Z",
    tags: ["transit", "correction", "local-government"],
  },
];
