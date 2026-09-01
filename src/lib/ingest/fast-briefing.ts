import type { StoryCategory } from "@/types/story";

const CONFLICT_PATTERN =
  /\b(airstrik(?:e|es)|military strike|military attack|missile(?:s)?|rocket launch(?:er|ers)|rocket attack|invasion|ceasefire|retaliat(?:e|es|ed|ion)|war)\b/i;
const DISASTER_PATTERN =
  /\b(flash flood(?:s)?|flood(?:s|ing)?|earthquake(?:s)?|hurricane(?:s)?|tornado(?:es)?|wildfire(?:s)?|tsunami(?:s)?|landslide(?:s)?|capsiz(?:e|es|ed)|evacuat(?:e|es|ed|ion)|missing)\b/i;
const MONETARY_PATTERN =
  /\b(federal reserve|fed chair|interest rates?|rate hike|rate cut|inflation|jobs report|unemployment)\b/i;
const TRADE_ENERGY_PATTERN =
  /\b(tariffs?|sanctions?|oil|gas|strait of hormuz|shipping|trade war)\b/i;
const HEALTH_PATTERN =
  /\b(outbreak|pandemic|recall|fda approv(?:e|es|ed|al)|drug approval|emergency use authorization|eua|cancer|vaccine|clinical trial|treatment|therapy)\b/i;
const COURT_PATTERN =
  /\b(supreme court|appeals court|court ruling|court|judge|defen[sc]e lawyers?|criminal case|murder case|ruling|injunction|indictment|conviction|petition)\b/i;
const CYBER_PATTERN =
  /\b(cyberattack|data breach|zero-day|vulnerabilit(?:y|ies)|cve-|ransomware|exploit)\b/i;
const ELECTION_PATTERN =
  /\b(election results?|wins? election|elected president|elected prime minister|declared winner)\b/i;

const HEALTH_CATEGORY_PATTERN =
  /\b(cancer|drug|medication|fda|nih|cdc|health|medical|medicine|hospital|patient|clinical|vaccine|virus|disease|outbreak|therapy|treatment|diagnosis)\b/i;
const TECHNOLOGY_CATEGORY_PATTERN =
  /(?:\ba\.?i\.?\b|\b(?:artificial intelligence|technology|tech|cyber|software|semiconductor|chip|nasa|space|telescope|satellite|computer|internet|robot|quantum)\b)/i;
const MARKETS_CATEGORY_PATTERN =
  /\b(federal reserve|fed chair|inflation|interest rates?|rate hike|rate cut|stocks?|bonds?|markets?|earnings|economy|economic|tariffs?)\b/i;
const ENERGY_CATEGORY_PATTERN =
  /\b(oil|gas|energy|power grid|electricity|nuclear power|solar|wind power|pipeline|opec)\b/i;
const POLITICS_CATEGORY_PATTERN =
  /\b(congress|senate|house of representatives|white house|president|governor|election|campaign|administration|democrat|republican)\b/i;
const CULTURE_CATEGORY_PATTERN =
  /\b(film|movie|music|television|celebrity|sports?|golf|football|baseball|basketball|hockey|tennis|olympics?|athlete|head coach|championship|world cup|nfl|nba|mlb|nhl|soccer|arts?|culture)\b/i;

function combinedText(title: string, summary: string): string {
  return `${title} ${summary}`;
}

/**
 * Keep figurative uses of "war" and "invasion" from being classified as armed
 * conflict. The source headline stays untouched; this normalization is used
 * only to choose the independently written significance template.
 */
function conflictClassificationText(text: string): string {
  return text
    .replace(/\binvasion of privacy\b/gi, "privacy intrusion")
    .replace(/\b(?:trade|culture|price|pricing|bidding|political) war\b/gi, "dispute")
    .replace(
      /\bwar on (?:cancer|crime|drugs|poverty|inflation|woke|wokeness|cash|cars|coal|oil|gas|technology|tech)\b/gi,
      "campaign",
    )
    .replace(/\bwar of words\b/gi, "public dispute");
}

/**
 * Feed categories are intentionally broad. Only override them when the public
 * headline contains a high-confidence topic signal; otherwise preserve the
 * curated feed category.
 */
export function inferStoryCategory(
  title: string,
  fallback: StoryCategory,
): StoryCategory {
  if (COURT_PATTERN.test(title)) return "Courts";
  if (HEALTH_CATEGORY_PATTERN.test(title)) return "Health";
  if (TECHNOLOGY_CATEGORY_PATTERN.test(title)) return "Technology";
  if (MARKETS_CATEGORY_PATTERN.test(title)) return "Markets";
  if (ENERGY_CATEGORY_PATTERN.test(title)) return "Energy";
  if (POLITICS_CATEGORY_PATTERN.test(title)) return "Politics";
  if (CULTURE_CATEGORY_PATTERN.test(title)) return "Culture";
  return fallback;
}

/**
 * Produces an immediate, conservative "why it matters" using only context that
 * is also safe to show to the reader. Event-specific templates require the
 * headline to support the event, or a matching curated category plus visible
 * synopsis context. Hidden publisher body text must never drive public claims.
 */
export function buildFastWhyItMatters(
  title: string,
  summary: string,
  category: StoryCategory,
): string {
  const visibleText = combinedText(title, summary);
  const conflictText = conflictClassificationText(title);

  if (COURT_PATTERN.test(title) || category === "Courts") {
    return "The legal outcome could change what governments, institutions, companies, or individuals are allowed or required to do. Its broader effect depends on the court, the scope of the ruling, and any appeal or follow-on action.";
  }

  if (ELECTION_PATTERN.test(title)) {
    return "The result can change political control, policy priorities, and the balance of power. Early counts or projections should be treated cautiously until the relevant authorities confirm the outcome.";
  }

  if (
    HEALTH_PATTERN.test(title) ||
    (category === "Health" && HEALTH_PATTERN.test(visibleText))
  ) {
    return "This could change treatment options, safety guidance, or public-health decisions. The practical significance depends on who is affected, the strength of the evidence, and any follow-up guidance from regulators or health authorities.";
  }

  if (
    CYBER_PATTERN.test(title) ||
    (category === "Technology" && CYBER_PATTERN.test(visibleText))
  ) {
    return "The main question is whether systems are exposed and whether users or operators need to patch, isolate, or change behavior. Severity depends on exploitability, affected products, and evidence of active abuse.";
  }

  if (CONFLICT_PATTERN.test(conflictText)) {
    return "This may change the near-term security picture, raise the risk of further retaliation, and affect civilians, regional operations, shipping, or energy markets. Early details can change quickly as official statements and additional reporting arrive.";
  }

  if (DISASTER_PATTERN.test(title)) {
    return "The immediate stakes are rescue, safety, and the scale of damage or displacement. Missing-person, casualty, evacuation, and infrastructure figures often change quickly during the first hours of a disaster.";
  }

  if (
    MONETARY_PATTERN.test(title) ||
    (category === "Markets" && MONETARY_PATTERN.test(visibleText))
  ) {
    return "Changes in inflation expectations or central-bank policy can quickly affect borrowing costs, currencies, bonds, equities, housing, and household finances. The market impact depends on what policymakers actually signal or do next.";
  }

  if (
    TRADE_ENERGY_PATTERN.test(title) ||
    ((category === "Markets" || category === "Energy") &&
      TRADE_ENERGY_PATTERN.test(visibleText))
  ) {
    return "This can affect prices, supply chains, energy costs, trade flows, and financial markets. The practical impact depends on the scope, duration, and whether governments or companies respond with additional measures.";
  }

  switch (category) {
    case "Politics":
      return "This may affect government policy, political control, or implementation decisions. The significance will become clearer as official action, legal constraints, and responses from affected institutions develop.";
    case "Markets":
      return "This may affect prices, investment expectations, company decisions, or household finances. The size of the impact depends on whether the development changes policy, demand, supply, or risk expectations.";
    case "Technology":
      return "This may affect how technology is built, used, secured, or regulated. The practical impact depends on adoption, affected users, and whether the development changes costs, capabilities, or risk.";
    case "Health":
      return "This may affect medical practice, treatment choices, safety guidance, or public-health decisions. The importance depends on the quality of the evidence and the population actually affected.";
    case "Energy":
      return "This may affect energy supply, infrastructure, costs, or long-term capacity. The significance depends on scale, timing, and whether the change alters real-world production or reliability.";
    case "Culture":
      return "This is primarily a cultural development; its significance depends on audience impact, broader industry effects, or whether it reflects a larger social or media trend.";
    case "World":
    default:
      return "This may affect public policy, security, economic conditions, or people directly involved. The significance depends on what changes next and whether additional sources confirm the early account.";
  }
}
