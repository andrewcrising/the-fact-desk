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
    trendingScore: 94,
    keyFacts: [
      "Audit covers fiscal years 2023–2025 across all FEMA-administered disaster relief programs.",
      "87% of approved funds confirmed disbursed to designated accounts.",
      "Three states — Louisiana, Florida, and Texas — experienced disbursement delays exceeding 120 days.",
      "No criminal referrals issued in this preliminary release.",
      "Final audit with reserve figures expected Q3 2026.",
    ],
    timeline: [
      { date: "2023-09-01", event: "FY2023 disaster relief appropriations enacted." },
      { date: "2024-11-15", event: "Inspector general opens formal audit of disbursement timelines." },
      { date: "2025-08-20", event: "Field auditors complete reviews in all 50 states." },
      { date: "2026-05-23", event: "Preliminary audit report published." },
    ],
    keyFigures: [
      { name: "Office of Inspector General", role: "Conducted the audit" },
      { name: "FEMA", role: "Administered the relief funds under review" },
      { name: "Senate Appropriations Committee", role: "Requested timeline review" },
    ],
    dataPoints: [
      { label: "Total funds audited", value: "$14.2 billion" },
      { label: "Disbursement confirmation rate", value: "87%" },
      { label: "States with delays >120 days", value: "3" },
      { label: "Audit period", value: "FY2023–FY2025" },
      { label: "Criminal referrals", value: "0" },
    ],
    primaryDocuments: [
      { title: "OIG Preliminary Audit Report 2026-DA-0047", type: "report" },
      { title: "FEMA Disaster Relief Fund quarterly obligation data", type: "data" },
      { title: "Senate Appropriations Committee hearing transcript, May 2026", type: "filing" },
    ],
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
    trendingScore: 88,
    keyFacts: [
      "Benchmark rate held at 4.25%–4.50% range.",
      "Vote was 9–1; one dissenter favored a 25 basis point cut.",
      "Policy statement added language: 'incoming data will determine the timing of adjustments.'",
      "Core PCE inflation at 3.1% year-over-year (April 2026 reading).",
      "Services inflation remained at 4.8%, while goods prices declined 0.3%.",
    ],
    timeline: [
      { date: "2026-03-15", event: "Previous meeting: rate held unchanged." },
      { date: "2026-04-30", event: "Core PCE for April released at 3.1% YoY." },
      { date: "2026-05-10", event: "Labor report shows 178,000 jobs added in April." },
      { date: "2026-05-23", event: "Rate decision announced: hold at 4.25%–4.50%." },
    ],
    keyFigures: [
      { name: "Federal Open Market Committee", role: "Voted on rate decision" },
      { name: "Bureau of Economic Analysis", role: "Published PCE inflation data" },
      { name: "Bureau of Labor Statistics", role: "Published employment figures" },
    ],
    dataPoints: [
      { label: "Benchmark rate", value: "4.25%–4.50%" },
      { label: "Vote", value: "9–1 (hold)" },
      { label: "Core PCE (April 2026)", value: "3.1% YoY" },
      { label: "Services inflation", value: "4.8%" },
      { label: "Goods prices", value: "-0.3%" },
      { label: "Jobs added (April)", value: "178,000" },
    ],
    primaryDocuments: [
      { title: "FOMC Policy Statement, May 2026", type: "statement" },
      { title: "BEA Personal Income and Outlays, April 2026", type: "data" },
      { title: "BLS Employment Situation Summary, April 2026", type: "data" },
    ],
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
    trendingScore: 91,
    keyFacts: [
      "CVE-2026-31247 assigned; CVSS base score 9.1 (Critical).",
      "Patch version 12.4.2 released to all stable channels.",
      "Vulnerability allows authentication bypass in SAML-based enterprise SSO flows.",
      "CISA added CVE to Known Exploited Vulnerabilities (KEV) catalog.",
      "Exploitation observed against U.S. government contractor networks; scope still under assessment.",
      "Vulnerability existed in codebase since version 11.2.0 (released October 2024).",
    ],
    timeline: [
      { date: "2024-10-01", event: "Version 11.2.0 released containing vulnerable code." },
      { date: "2026-04-12", event: "Security researchers discover flaw during routine audit." },
      { date: "2026-05-01", event: "Coordinated disclosure to vendor." },
      { date: "2026-05-22", event: "CISA adds CVE to KEV catalog after exploitation confirmed." },
      { date: "2026-05-23", event: "Patch 12.4.2 pushed to stable channels." },
    ],
    keyFigures: [
      { name: "CISA", role: "Added CVE to Known Exploited Vulnerabilities catalog" },
      { name: "MITRE", role: "Assigned CVE-2026-31247" },
    ],
    dataPoints: [
      { label: "CVE", value: "CVE-2026-31247" },
      { label: "CVSS score", value: "9.1 (Critical)" },
      { label: "Patch version", value: "12.4.2" },
      { label: "Vulnerable since", value: "v11.2.0 (Oct 2024)" },
      { label: "Attack vector", value: "SAML authentication bypass" },
    ],
    primaryDocuments: [
      { title: "Vendor Security Advisory SA-2026-05-001", type: "advisory" },
      { title: "CISA KEV Catalog Update, May 22 2026", type: "advisory" },
      { title: "MITRE CVE Record CVE-2026-31247", type: "data" },
    ],
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
    trendingScore: 82,
    keyFacts: [
      "Talks entered second day in Geneva under UN mediation.",
      "UN spokesperson confirmed existence of draft inspection-route document.",
      "Delegation A states withdrawal phases 'agreed in principle'; Delegation B denies this.",
      "Three humanitarian corridors remain closed pending monitoring agreement.",
      "ICRC reports 240,000 civilians in areas dependent on corridor access for food and medicine.",
    ],
    timeline: [
      { date: "2026-05-15", event: "Ceasefire agreement signed; monitoring terms deferred." },
      { date: "2026-05-22", event: "Day 1 of monitoring talks begins in Geneva." },
      { date: "2026-05-23", event: "Day 2: inspection-route document confirmed; withdrawal timelines remain disputed." },
    ],
    keyFigures: [
      { name: "United Nations", role: "Mediating monitoring talks in Geneva" },
      { name: "ICRC", role: "Reported on affected civilian population" },
    ],
    dataPoints: [
      { label: "Days of talks", value: "2" },
      { label: "Humanitarian corridors closed", value: "3" },
      { label: "Civilians dependent on corridor access", value: "240,000" },
      { label: "Disputed items", value: "Withdrawal phase timelines" },
    ],
    primaryDocuments: [
      { title: "UN spokesperson daily briefing, May 23 2026", type: "statement" },
      { title: "ICRC Situation Report No. 7", type: "report" },
    ],
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
    trendingScore: 56,
    keyFacts: [
      "Study published in JAMA Network Open; peer-reviewed.",
      "42 rural clinics across 8 states studied over 18 months.",
      "Primary care telehealth visits increased 34% during study period.",
      "Specialist telehealth availability remained below 40% in clinics without fiber broadband.",
      "Counties with fiber upgrades saw average specialist wait times drop from 47 days to 22 days.",
      "12 million rural Americans live in counties with similar infrastructure gaps.",
    ],
    timeline: [
      { date: "2024-09-01", event: "Study enrollment begins across 42 clinics." },
      { date: "2026-02-28", event: "18-month data collection period ends." },
      { date: "2026-05-21", event: "Study published in JAMA Network Open." },
    ],
    keyFigures: [
      { name: "JAMA Network Open", role: "Published the peer-reviewed study" },
      { name: "State health departments (8 states)", role: "Provided clinic enrollment data" },
    ],
    dataPoints: [
      { label: "Clinics studied", value: "42" },
      { label: "States represented", value: "8" },
      { label: "Study duration", value: "18 months" },
      { label: "Primary care telehealth increase", value: "+34%" },
      { label: "Specialist availability (no fiber)", value: "<40%" },
      { label: "Wait time with fiber", value: "22 days (down from 47)" },
      { label: "Affected rural population", value: "12 million" },
    ],
    primaryDocuments: [
      { title: "JAMA Network Open study: Rural Telehealth Specialist Access", type: "study" },
      { title: "FCC Broadband Deployment Report 2026", type: "data" },
    ],
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
    trendingScore: 63,
    keyFacts: [
      "Oral arguments scheduled for June 2026 in the U.S. Court of Appeals, Fourth Circuit.",
      "Case number: 26-1482. United States v. Harmon.",
      "Lower court excluded two encrypted messaging metadata exhibits from fraud prosecution.",
      "Core question: whether metadata from end-to-end encrypted platforms requires expert authentication testimony.",
      "37 pending federal cases involve similar digital evidence authentication disputes.",
    ],
    timeline: [
      { date: "2025-03-10", event: "Trial court excludes two metadata exhibits." },
      { date: "2025-06-02", event: "Government files appeal to Fourth Circuit." },
      { date: "2026-01-18", event: "Amicus briefs filed by digital rights organizations and DOJ." },
      { date: "2026-05-22", event: "Oral arguments scheduled for June 2026." },
    ],
    keyFigures: [
      { name: "U.S. Court of Appeals, Fourth Circuit", role: "Hearing the appeal" },
      { name: "Department of Justice", role: "Appellant (prosecution)" },
    ],
    dataPoints: [
      { label: "Case number", value: "26-1482" },
      { label: "Exhibits excluded", value: "2" },
      { label: "Similar pending federal cases", value: "37" },
      { label: "Amicus briefs filed", value: "6" },
    ],
    primaryDocuments: [
      { title: "Court docket: United States v. Harmon, No. 26-1482", type: "filing" },
      { title: "Government appellate brief", type: "filing" },
      { title: "EFF amicus brief on metadata authentication", type: "filing" },
    ],
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
    trendingScore: 41,
    keyFacts: [
      "Board voted unanimously (7–0) to extend stage-two conservation through September 30, 2026.",
      "Combined reservoir storage at 68% of capacity as of May 22, 2026.",
      "Stage-two limits: outdoor watering restricted to two days per week; car washing prohibited without recirculating systems.",
      "Agricultural users under restricted irrigation schedules: 75% of normal allocation.",
      "Stage-three triggers automatically if reservoir drops below 55%.",
      "Region serves 2.1 million residential accounts and 14,000 agricultural permits.",
    ],
    timeline: [
      { date: "2026-02-01", event: "Stage-two conservation activated after dry winter." },
      { date: "2026-04-15", event: "Reservoir drops to 71% capacity." },
      { date: "2026-05-22", event: "Reservoir at 68%; board schedules extension vote." },
      { date: "2026-05-23", event: "Board votes 7–0 to extend through September 30." },
    ],
    keyFigures: [
      { name: "Regional Water Authority Board", role: "Voted to extend conservation" },
      { name: "State Water Resources Control Board", role: "Sets statewide drought policy" },
    ],
    dataPoints: [
      { label: "Reservoir capacity", value: "68%" },
      { label: "Board vote", value: "7–0 (unanimous)" },
      { label: "Conservation stage", value: "Stage 2" },
      { label: "Agricultural allocation", value: "75% of normal" },
      { label: "Stage-3 trigger", value: "Below 55% capacity" },
      { label: "Residential accounts served", value: "2.1 million" },
    ],
    primaryDocuments: [
      { title: "Water Authority Board Resolution 2026-041", type: "ruling" },
      { title: "Reservoir storage levels, weekly update", type: "data" },
    ],
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
    trendingScore: 47,
    keyFacts: [
      "March 14 broadcast segment cited poll results without on-screen methodology citation.",
      "Trade journal critique published May 22, 2026, alleging missing sampling details.",
      "Outlet states on-air reference was to a separate tracking poll, not the poll named in the critique.",
      "Outlet methodology PDF last updated April 18, 2026.",
      "AAPOR Transparency Initiative requires disclosure of sampling frame, weighting, and margin of error.",
    ],
    timeline: [
      { date: "2026-03-14", event: "Broadcast segment cites poll results on air." },
      { date: "2026-04-18", event: "Outlet updates methodology PDF on website." },
      { date: "2026-05-22", event: "Trade journal publishes critique of disclosure gaps." },
      { date: "2026-05-22", event: "Outlet issues response clarifying poll reference." },
    ],
    keyFigures: [
      { name: "AAPOR", role: "Sets polling transparency standards" },
    ],
    dataPoints: [
      { label: "Broadcast date in question", value: "March 14, 2026" },
      { label: "Methodology PDF updated", value: "April 18, 2026" },
      { label: "Critique published", value: "May 22, 2026" },
    ],
    primaryDocuments: [
      { title: "Trade journal critique article", type: "report" },
      { title: "Outlet methodology PDF (updated April 2026)", type: "data" },
      { title: "AAPOR Transparency Initiative guidelines", type: "other" },
    ],
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
    trendingScore: 52,
    keyFacts: [
      "State Public Utilities Commission deferred decision from May to July 2026.",
      "Procurement involves 1,200 MW of grid-scale battery storage across three sites.",
      "Interconnection studies for two of three sites remain incomplete.",
      "Estimated project cost: $2.8 billion.",
      "Utilities state delay risks missing 2027 summer peak reliability targets.",
      "Project not cancelled; procurement timeline extended.",
    ],
    timeline: [
      { date: "2025-09-01", event: "Utilities file joint procurement application." },
      { date: "2026-02-15", event: "Interconnection study for Site A completed." },
      { date: "2026-05-22", event: "Commission defers decision to July; Sites B and C studies incomplete." },
    ],
    keyFigures: [
      { name: "State Public Utilities Commission", role: "Regulator reviewing procurement" },
    ],
    dataPoints: [
      { label: "Battery storage capacity", value: "1,200 MW" },
      { label: "Project sites", value: "3" },
      { label: "Interconnection studies complete", value: "1 of 3" },
      { label: "Estimated cost", value: "$2.8 billion" },
      { label: "Decision deferred to", value: "July 2026" },
      { label: "Reliability target year", value: "2027" },
    ],
    primaryDocuments: [
      { title: "PUC Order Deferring Decision, Docket No. 2025-ES-0412", type: "ruling" },
      { title: "Utility joint procurement application", type: "filing" },
      { title: "Interconnection study progress report", type: "report" },
    ],
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
    trendingScore: 35,
    keyFacts: [
      "Original press release stated pilot start: July 1, 2026.",
      "Corrected press release issued May 23, 2026: pilot start moved to September 1, 2026.",
      "City council approved the fare pilot program on April 12, 2026 (vote: 8–3).",
      "Vendor contract signed May 5, 2026; requires 60 days of system testing.",
      "Pilot reduces base fare from $2.75 to $1.50 for qualifying low-income riders.",
      "Pilot duration: 12 months; covers 14 bus routes.",
    ],
    timeline: [
      { date: "2026-04-12", event: "City council approves fare pilot (8–3 vote)." },
      { date: "2026-05-05", event: "Vendor contract signed." },
      { date: "2026-05-15", event: "Original press release: July 1 start date." },
      { date: "2026-05-23", event: "Corrected press release: September 1 start date." },
    ],
    keyFigures: [
      { name: "City Council", role: "Approved the fare pilot program" },
      { name: "Transit Authority", role: "Managing vendor contract and implementation" },
    ],
    dataPoints: [
      { label: "Original start date", value: "July 1, 2026" },
      { label: "Corrected start date", value: "September 1, 2026" },
      { label: "Council vote", value: "8–3" },
      { label: "Vendor testing period", value: "60 days" },
      { label: "Reduced fare", value: "$1.50 (from $2.75)" },
      { label: "Bus routes covered", value: "14" },
      { label: "Pilot duration", value: "12 months" },
    ],
    primaryDocuments: [
      { title: "Corrected City Press Release, May 23 2026", type: "statement" },
      { title: "City Council Resolution 2026-0412-T", type: "ruling" },
      { title: "Transit Authority vendor contract summary", type: "filing" },
    ],
  },
];
