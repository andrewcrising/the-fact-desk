import { STORY_CATEGORIES } from "@/data/navigation";
import type {
  Confidence,
  EvidenceLevel,
  Signal,
  StoryCategory,
} from "@/types/story";

const CONFIDENCES: Confidence[] = [
  "Confirmed",
  "Developing",
  "Disputed",
  "Single-source",
];

const SIGNALS: Signal[] = [
  "Top Signal",
  "Under-covered",
  "Cross-angle",
  "Developing",
];

const EVIDENCE_LEVELS: EvidenceLevel[] = ["Low", "Moderate", "Strong"];

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function asOptionalString(value: unknown): string | null | undefined {
  if (value == null) return null;
  return asString(value);
}

export function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function asNumber(value: unknown): number | null | undefined {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function asStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return undefined;
}

export function asCategory(value: unknown): StoryCategory | undefined {
  return STORY_CATEGORIES.includes(value as StoryCategory)
    ? (value as StoryCategory)
    : undefined;
}

export function asSignal(value: unknown): Signal | undefined {
  return SIGNALS.includes(value as Signal) ? (value as Signal) : undefined;
}

export function asConfidence(value: unknown): Confidence | undefined {
  return CONFIDENCES.includes(value as Confidence)
    ? (value as Confidence)
    : undefined;
}

export function asEvidenceLevel(value: unknown): EvidenceLevel | undefined {
  return EVIDENCE_LEVELS.includes(value as EvidenceLevel)
    ? (value as EvidenceLevel)
    : undefined;
}

export function isEmail(value: string): boolean {
  const email = value.trim().toLowerCase();
  if (email.length > 254) return false;
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(email);
}
