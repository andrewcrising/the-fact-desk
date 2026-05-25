import type { CorrectionEntry, LiveSignal, WatchlistSource } from "@/types/story";

export const liveSignals: LiveSignal[] = [
  {
    id: "sig-1",
    label: "Developing",
    detail: "Disaster relief audit — agency briefing expected 2 p.m. ET",
    time: "12m ago",
  },
  {
    id: "sig-2",
    label: "Disputed",
    detail: "Ceasefire talks — delegations issue conflicting readouts",
    time: "28m ago",
  },
  {
    id: "sig-3",
    label: "Developing",
    detail: "Digital evidence appeal — amicus filings increasing",
    time: "1h ago",
  },
  {
    id: "sig-4",
    label: "Confirmed",
    detail: "Central bank decision — statement parsed across outlets",
    time: "3h ago",
  },
];

export const watchlistSources: WatchlistSource[] = [
  {
    id: "w-1",
    name: "Regional Water Authority",
    note: "Conservation board filings",
  },
  {
    id: "w-2",
    name: "Inspector General — Relief Programs",
    note: "Audit releases & testimony",
  },
  {
    id: "w-3",
    name: "County Health Collaborative",
    note: "Rural clinic study follow-ups",
  },
  {
    id: "w-4",
    name: "Mediation Desk (wire)",
    note: "Ceasefire monitoring terms",
  },
  {
    id: "w-5",
    name: "Security Research Collective",
    note: "Enterprise patch analysis",
  },
];

export const correctionLog: CorrectionEntry[] = [
  {
    id: "c-1",
    headline: "Transit fare pilot timeline",
    correction:
      "Start date revised from July to September after vendor readiness review.",
    date: "May 23, 2026",
  },
  {
    id: "c-2",
    headline: "Hospital capacity report",
    correction:
      "Chart axis label corrected; peak occupancy figure unchanged.",
    date: "May 21, 2026",
  },
  {
    id: "c-3",
    headline: "Trade deficit snapshot",
    correction: "Month attributed to April, not March, in summary line.",
    date: "May 19, 2026",
  },
];
