"use client";

import { AdminTokenField } from "@/components/admin/AdminTokenField";
import { useAdminToken } from "@/components/admin/useAdminToken";
import { STORY_CATEGORIES } from "@/data/navigation";
import type { AiDraftAssistOutput } from "@/lib/ai/editorial-draft-assist";
import type { EvidenceProfile } from "@/lib/evidence-scoring";
import type { PersistedStory } from "@/types/editorial";
import type { Confidence, EvidenceLevel, Signal } from "@/types/story";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const SIGNALS: Signal[] = [
  "Top Signal",
  "Under-covered",
  "Cross-angle",
  "Developing",
];

const CONFIDENCES: Confidence[] = [
  "Confirmed",
  "Developing",
  "Disputed",
  "Single-source",
];

const EVIDENCE_LEVELS: EvidenceLevel[] = ["Low", "Moderate", "Strong"];

type DraftAssistEditableKey =
  | "suggested_summary"
  | "suggested_what_happened"
  | "suggested_why_it_matters"
  | "suggested_coverage_angle"
  | "suggested_uncertainty_note";

interface AdminStoryFormProps {
  storyId?: string;
}

interface StoryFormState {
  title: string;
  slug: string;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  coverageAngle: string;
  uncertaintyNote: string;
  category: string;
  signal: string;
  confidence: string;
  evidenceLevel: string;
  tags: string;
  homepageRank: string;
  isLead: boolean;
  sources: string;
}

const emptyState: StoryFormState = {
  title: "",
  slug: "",
  summary: "",
  whatHappened: "",
  whyItMatters: "",
  coverageAngle: "",
  uncertaintyNote: "",
  category: "World",
  signal: "Developing",
  confidence: "Single-source",
  evidenceLevel: "Moderate",
  tags: "",
  homepageRank: "",
  isLead: false,
  sources: "",
};

function sourcesToText(story: PersistedStory): string {
  return story.storySources
    .map((source) => `${source.sourceName}|${source.url}|${source.title}`)
    .join("\n");
}

function parseSources(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [sourceName, url, title] = line.split("|").map((part) => part.trim());
      return { sourceName, url, title: title || url };
    })
    .filter((source) => source.sourceName && source.url);
}

export function AdminStoryForm({ storyId }: AdminStoryFormProps) {
  const { token, setToken } = useAdminToken();
  const [state, setState] = useState<StoryFormState>(emptyState);
  const [savedStory, setSavedStory] = useState<PersistedStory | null>(null);
  const [evidenceAssist, setEvidenceAssist] = useState<EvidenceProfile | null>(null);
  const [draftAssist, setDraftAssist] = useState<AiDraftAssistOutput | null>(null);
  const [draftAssistError, setDraftAssistError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [assistLoading, setAssistLoading] = useState(false);
  const [draftAssistLoading, setDraftAssistLoading] = useState(false);
  const [aiSuggestionsApplied, setAiSuggestionsApplied] = useState(false);
  const [aiSuggestionsSaved, setAiSuggestionsSaved] = useState(false);

  function update<K extends keyof StoryFormState>(key: K, value: StoryFormState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  function updateDraftAssist<K extends DraftAssistEditableKey>(
    key: K,
    value: AiDraftAssistOutput[K],
  ) {
    setDraftAssist((current) =>
      current ? { ...current, [key]: value } : current,
    );
  }

  function applyAiSuggestion(key: keyof StoryFormState, value: string) {
    update(key, value);
    setAiSuggestionsApplied(true);
    setAiSuggestionsSaved(false);
  }

  function applyAllSafeAiSuggestions() {
    if (!draftAssist) return;
    applyAiSuggestion("summary", draftAssist.suggested_summary);
    applyAiSuggestion("whatHappened", draftAssist.suggested_what_happened);
    applyAiSuggestion("whyItMatters", draftAssist.suggested_why_it_matters);
    applyAiSuggestion("coverageAngle", draftAssist.suggested_coverage_angle);
    applyAiSuggestion("uncertaintyNote", draftAssist.suggested_uncertainty_note);
  }

  const adminFetch = useCallback(async (path: string, init: RequestInit = {}) => {
    return fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
  }, [token]);

  const loadEvidenceAssist = useCallback(
    async (id: string, options: { silent?: boolean } = {}) => {
      setAssistLoading(true);
      try {
        const response = await adminFetch(`/api/stories/${id}/evidence-assist`, {
          method: "POST",
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "Unable to calculate evidence assist");
        }
        const profile = data.profile as EvidenceProfile;
        setEvidenceAssist(profile);
        if (!options.silent) setMessage("Evidence assist recalculated.");
        return profile;
      } catch (error) {
        if (!options.silent) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to calculate evidence assist",
          );
        }
        return null;
      } finally {
        setAssistLoading(false);
      }
    },
    [adminFetch],
  );

  async function generateDraftAssist() {
    if (!savedStory) return;

    setDraftAssistLoading(true);
    setDraftAssistError("");
    try {
      const response = await adminFetch(`/api/stories/${savedStory.id}/draft-assist`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Unable to generate AI Draft Assist");
      }
      setDraftAssist(data.suggestions as AiDraftAssistOutput);
      setMessage("AI Draft Assist suggestions generated. Review before applying.");
    } catch (error) {
      setDraftAssistError(
        error instanceof Error
          ? error.message
          : "Unable to generate AI Draft Assist",
      );
    } finally {
      setDraftAssistLoading(false);
    }
  }

  useEffect(() => {
    if (!storyId || !token) return;

    async function loadStory() {
      setLoading(true);
      try {
        const response = await adminFetch(`/api/stories/${storyId}`);
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error ?? "Unable to load story");
        const story = data.story as PersistedStory;
        setSavedStory(story);
        setState({
          title: story.title,
          slug: story.slug,
          summary: story.summary,
          whatHappened: story.whatHappened,
          whyItMatters: story.whyItMatters,
          coverageAngle: story.coverageAngle ?? "",
          uncertaintyNote: story.uncertaintyNote ?? "",
          category: story.category,
          signal: story.signal,
          confidence: story.confidence,
          evidenceLevel: story.evidenceLevel ?? "Moderate",
          tags: story.tags.join(", "),
          homepageRank: story.homepageRank?.toString() ?? "",
          isLead: story.isLead,
          sources: sourcesToText(story),
        });
        await loadEvidenceAssist(story.id, { silent: true });
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load story");
      } finally {
        setLoading(false);
      }
    }

    void loadStory();
  }, [adminFetch, loadEvidenceAssist, storyId, token]);

  function payload() {
    return {
      title: state.title,
      slug: state.slug,
      summary: state.summary,
      whatHappened: state.whatHappened,
      whyItMatters: state.whyItMatters,
      coverageAngle: state.coverageAngle,
      uncertaintyNote: state.uncertaintyNote,
      category: state.category,
      signal: state.signal,
      confidence: state.confidence,
      evidenceLevel: state.evidenceLevel,
      tags: state.tags,
      homepageRank: state.homepageRank,
      isLead: state.isLead,
      sourceAttachments: parseSources(state.sources),
    };
  }

  async function save() {
    setLoading(true);
    setMessage("");
    try {
      const response = await adminFetch(
        savedStory ? `/api/stories/${savedStory.id}` : "/api/stories",
        {
          method: savedStory ? "PATCH" : "POST",
          body: JSON.stringify(payload()),
        },
      );
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Save failed");
      setSavedStory(data.story);
      setAiSuggestionsSaved(true);
      setMessage("Story saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function publish() {
    if (!savedStory) return;
    setLoading(true);
    try {
      const profile =
        (await loadEvidenceAssist(savedStory.id, { silent: true })) ??
        evidenceAssist;
      if (profile?.source_count === 0) {
        setMessage("Cannot publish without source links. Attach at least one source first.");
        return;
      }
      if (
        profile?.warnings.length &&
        !window.confirm(
          `Evidence Assist warnings:\n\n${profile.warnings.join(
            "\n",
          )}\n\nPublish anyway after human review?`,
        )
      ) {
        setMessage("Publish cancelled. Review evidence posture before publishing.");
        return;
      }
      const aiWarnings = [
        aiSuggestionsApplied && !aiSuggestionsSaved
          ? "AI suggestions were applied locally but not saved as a draft yet."
          : null,
        draftAssist?.claims_to_verify.length
          ? `AI Draft Assist listed claims to verify: ${draftAssist.claims_to_verify.join("; ")}`
          : null,
      ].filter((item): item is string => Boolean(item));
      if (
        aiWarnings.length > 0 &&
        !window.confirm(
          `AI Draft Assist cautions:\n\n${aiWarnings.join(
            "\n",
          )}\n\nPublish anyway after human review?`,
        )
      ) {
        setMessage("Publish cancelled. Review AI Draft Assist cautions first.");
        return;
      }

      const response = await adminFetch(`/api/stories/${savedStory.id}/publish`, {
        method: "POST",
        body: JSON.stringify({
          homepageRank: state.homepageRank,
          isLead: state.isLead,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Publish failed");
      setSavedStory(data.story);
      setMessage("Story published.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Publish failed");
    } finally {
      setLoading(false);
    }
  }

  async function storyAction(endpoint: "archive" | "promote") {
    if (!savedStory) return;
    setLoading(true);
    try {
      const response = await adminFetch(`/api/stories/${savedStory.id}/${endpoint}`, {
        method: "POST",
        body: JSON.stringify(
          endpoint === "promote"
            ? { homepageRank: state.homepageRank || 1, isLead: true }
            : {},
        ),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? `${endpoint} failed`);
      setSavedStory(data.story);
      if (endpoint === "promote") {
        update("isLead", true);
        if (!state.homepageRank) update("homepageRank", "1");
      }
      setMessage(endpoint === "promote" ? "Story set as homepage lead." : "Story archived.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `${endpoint} failed`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <AdminTokenField token={token} onTokenChange={setToken} />

      <div className="desk-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold">
              {savedStory ? "Edit story" : "New draft story"}
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Save draft edits first. Publish makes the story public; archive
              removes it from the public desk.
            </p>
            {savedStory && (
              <p className="mt-1 text-xs text-[var(--muted-light)]">
                Current status: {savedStory.status}
                {savedStory.status === "published" ? ` · /story/${savedStory.slug}` : ""}
              </p>
            )}
          </div>
          <Link href="/admin/stories" className="text-sm text-[var(--accent)] hover:underline">
            Back to stories
          </Link>
        </div>

        {message && (
          <p className="mt-4 border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm text-[var(--muted)]">
            {message}
          </p>
        )}
      </div>

      <form
        className="desk-card grid gap-4 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <label className="grid gap-1 text-sm">
          <span className="desk-kicker">Title</span>
          <input
            required
            value={state.title}
            onChange={(event) => update("title", event.target.value)}
            className="border border-[var(--border)] px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="desk-kicker">Slug</span>
          <input
            value={state.slug}
            onChange={(event) => update("slug", event.target.value)}
            className="border border-[var(--border)] px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="desk-kicker">Summary</span>
          <textarea
            required
            rows={3}
            value={state.summary}
            onChange={(event) => update("summary", event.target.value)}
            className="border border-[var(--border)] px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="desk-kicker">What happened</span>
          <textarea
            required
            rows={5}
            value={state.whatHappened}
            onChange={(event) => update("whatHappened", event.target.value)}
            className="border border-[var(--border)] px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="desk-kicker">Why it matters</span>
          <textarea
            required
            rows={5}
            value={state.whyItMatters}
            onChange={(event) => update("whyItMatters", event.target.value)}
            className="border border-[var(--border)] px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="desk-kicker">Coverage angle</span>
          <textarea
            rows={3}
            value={state.coverageAngle}
            onChange={(event) => update("coverageAngle", event.target.value)}
            className="border border-[var(--border)] px-3 py-2"
          />
          <span className="text-xs text-[var(--muted-light)]">
            Explain why this belongs on The Fact Desk: source spread,
            under-covered significance, or public-interest relevance.
          </span>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="desk-kicker">Uncertainty note</span>
          <textarea
            rows={3}
            value={state.uncertaintyNote}
            onChange={(event) => update("uncertaintyNote", event.target.value)}
            placeholder="What remains unknown, disputed, or not independently confirmed?"
            className="border border-[var(--border)] px-3 py-2"
          />
          <span className="text-xs text-[var(--muted-light)]">
            Use this to make limits visible. Leave blank only when uncertainty is
            already fully covered in the briefing.
          </span>
        </label>

        <div className="grid gap-3 sm:grid-cols-4">
          <label className="grid gap-1 text-sm">
            <span className="desk-kicker">Category</span>
            <select
              value={state.category}
              onChange={(event) => update("category", event.target.value)}
              className="border border-[var(--border)] px-3 py-2"
            >
              {STORY_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="desk-kicker">Signal</span>
            <select
              value={state.signal}
              onChange={(event) => update("signal", event.target.value)}
              className="border border-[var(--border)] px-3 py-2"
            >
              {SIGNALS.map((signal) => (
                <option key={signal}>{signal}</option>
              ))}
            </select>
            <span className="text-xs text-[var(--muted-light)]">
              Developing = unfolding; Under-covered = important but limited
              pickup; Cross-angle = credible sources differ in emphasis.
            </span>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="desk-kicker">Confidence</span>
            <select
              value={state.confidence}
              onChange={(event) => update("confidence", event.target.value)}
              className="border border-[var(--border)] px-3 py-2"
            >
              {CONFIDENCES.map((confidence) => (
                <option key={confidence}>{confidence}</option>
              ))}
            </select>
            <span className="text-xs text-[var(--muted-light)]">
              Confirmed = well established; Developing = credible but moving;
              Single-source = limited sourcing; Disputed = conflicting accounts.
            </span>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="desk-kicker">Evidence level</span>
            <select
              value={state.evidenceLevel}
              onChange={(event) => update("evidenceLevel", event.target.value)}
              className="border border-[var(--border)] px-3 py-2"
            >
              {EVIDENCE_LEVELS.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
            <span className="text-xs text-[var(--muted-light)]">
              Strong = primary documents or multiple reliable sources; Moderate
              = credible reporting; Low = early or thin signal.
            </span>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_160px_120px]">
          <label className="grid gap-1 text-sm">
            <span className="desk-kicker">Tags</span>
            <input
              value={state.tags}
              onChange={(event) => update("tags", event.target.value)}
              placeholder="rss-inbox, health"
              className="border border-[var(--border)] px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="desk-kicker">Homepage rank</span>
            <input
              value={state.homepageRank}
              onChange={(event) => update("homepageRank", event.target.value)}
              className="border border-[var(--border)] px-3 py-2"
            />
          </label>
          <label className="flex items-end gap-2 text-sm">
            <input
              type="checkbox"
              checked={state.isLead}
              onChange={(event) => update("isLead", event.target.checked)}
            />
            Lead story
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="desk-kicker">Sources</span>
          <textarea
            rows={4}
            value={state.sources}
            onChange={(event) => update("sources", event.target.value)}
            placeholder="Source name|https://example.com/story|Source headline"
            className="border border-[var(--border)] px-3 py-2"
          />
          <span className="text-xs text-[var(--muted-light)]">
            One source per line: source name | URL | optional title. These show
            as the story evidence/source list.
          </span>
        </label>

        <section className="border border-[var(--border-subtle)] bg-[#fafbfc] p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="desk-kicker mb-1">Evidence Assist</p>
              <p className="max-w-2xl text-xs leading-relaxed text-[var(--muted)]">
                Deterministic editorial assist based on saved source links. It is
                not a truth score and never overwrites editor judgment unless you
                apply a suggestion.
              </p>
            </div>
            <button
              type="button"
              onClick={() => savedStory && loadEvidenceAssist(savedStory.id)}
              disabled={!token || !savedStory || assistLoading}
              className="border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide disabled:opacity-50"
            >
              {assistLoading ? "Calculating..." : "Recalculate evidence assist"}
            </button>
          </div>

          {evidenceAssist ? (
            <div className="mt-3 space-y-3">
              <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="desk-kicker text-[8px]">Sources</p>
                  <p className="text-[var(--foreground)]">
                    {evidenceAssist.source_count} links ·{" "}
                    {evidenceAssist.unique_source_count} unique
                  </p>
                </div>
                <div>
                  <p className="desk-kicker text-[8px]">Source spread</p>
                  <p className="text-[var(--foreground)]">
                    {evidenceAssist.source_spread}
                  </p>
                </div>
                <div>
                  <p className="desk-kicker text-[8px]">Primary / official</p>
                  <p className="text-[var(--foreground)]">
                    {evidenceAssist.has_primary_source ? "Primary " : ""}
                    {evidenceAssist.has_official_source ? "Official" : "Not detected"}
                  </p>
                </div>
                <div>
                  <p className="desk-kicker text-[8px]">Assist score</p>
                  <p className="text-[var(--foreground)]">
                    {evidenceAssist.evidence_score}/100 editorial assist
                  </p>
                </div>
                <div>
                  <p className="desk-kicker text-[8px]">Suggested evidence</p>
                  <p className="text-[var(--foreground)]">
                    {evidenceAssist.suggested_evidence_level}
                  </p>
                </div>
                <div>
                  <p className="desk-kicker text-[8px]">Suggested confidence</p>
                  <p className="text-[var(--foreground)]">
                    {evidenceAssist.suggested_confidence}
                  </p>
                </div>
                <div>
                  <p className="desk-kicker text-[8px]">Coverage status</p>
                  <p className="text-[var(--foreground)]">
                    {evidenceAssist.coverage_status_suggestion}
                  </p>
                </div>
                <div>
                  <p className="desk-kicker text-[8px]">Under-covered</p>
                  <p className="text-[var(--foreground)]">
                    {evidenceAssist.undercovered_indicator ? "Possible" : "No"}
                  </p>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-[var(--muted)]">
                {evidenceAssist.explanation}
              </p>

              {evidenceAssist.warnings.length > 0 && (
                <div className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
                  <p className="font-semibold">Review before publishing</p>
                  <ul className="mt-1 list-disc pl-4">
                    {evidenceAssist.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    update("evidenceLevel", evidenceAssist.suggested_evidence_level)
                  }
                  className="border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                >
                  Apply suggested evidence level
                </button>
                <button
                  type="button"
                  onClick={() =>
                    update("confidence", evidenceAssist.suggested_confidence)
                  }
                  className="border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                >
                  Apply suggested confidence
                </button>
                {evidenceAssist.uncertainty_note_suggestion && (
                  <button
                    type="button"
                    onClick={() =>
                      update(
                        "uncertaintyNote",
                        evidenceAssist.uncertainty_note_suggestion ?? "",
                      )
                    }
                    className="border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                  >
                    Apply uncertainty note suggestion
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-[var(--muted-light)]">
              Save the story and source links, then recalculate to see source
              spread, evidence suggestions, and publish warnings.
            </p>
          )}
        </section>

        <section className="border border-[var(--border-subtle)] bg-white p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="desk-kicker mb-1">AI Draft Assist</p>
              <p className="max-w-2xl text-xs leading-relaxed text-[var(--muted)]">
                Admin-only draft suggestions grounded in saved story fields,
                attached sources, feed items, and Evidence Assist. AI suggestions
                require human review before saving or publishing.
              </p>
            </div>
            <button
              type="button"
              onClick={generateDraftAssist}
              disabled={!token || !savedStory || draftAssistLoading}
              className="border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide disabled:opacity-50"
            >
              {draftAssistLoading ? "Generating..." : "Generate draft assist"}
            </button>
          </div>

          {draftAssistError && (
            <p className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
              {draftAssistError}
            </p>
          )}

          {!draftAssist && !draftAssistError && (
            <p className="mt-3 text-xs text-[var(--muted-light)]">
              If AI Draft Assist is not configured, this panel will report that
              OPENAI_API_KEY and AI_DRAFT_ASSIST_ENABLED are required.
            </p>
          )}

          {draftAssist && (
            <div className="mt-3 space-y-3">
              <p className="border border-[var(--border-subtle)] bg-[#fafbfc] px-3 py-2 text-xs leading-relaxed text-[var(--muted)]">
                Review and edit these suggestions. Applying updates this form
                only; you still need to click Save draft, then Publish separately.
              </p>

              <label className="grid gap-1 text-sm">
                <span className="desk-kicker">Suggested summary</span>
                <textarea
                  rows={3}
                  value={draftAssist.suggested_summary}
                  onChange={(event) =>
                    updateDraftAssist("suggested_summary", event.target.value)
                  }
                  className="border border-[var(--border)] px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() =>
                    applyAiSuggestion("summary", draftAssist.suggested_summary)
                  }
                  className="w-fit text-xs font-semibold uppercase tracking-wide text-[var(--accent)]"
                >
                  Apply summary
                </button>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="desk-kicker">Suggested what happened</span>
                <textarea
                  rows={4}
                  value={draftAssist.suggested_what_happened}
                  onChange={(event) =>
                    updateDraftAssist("suggested_what_happened", event.target.value)
                  }
                  className="border border-[var(--border)] px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() =>
                    applyAiSuggestion(
                      "whatHappened",
                      draftAssist.suggested_what_happened,
                    )
                  }
                  className="w-fit text-xs font-semibold uppercase tracking-wide text-[var(--accent)]"
                >
                  Apply what happened
                </button>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="desk-kicker">Suggested why it matters</span>
                <textarea
                  rows={4}
                  value={draftAssist.suggested_why_it_matters}
                  onChange={(event) =>
                    updateDraftAssist("suggested_why_it_matters", event.target.value)
                  }
                  className="border border-[var(--border)] px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() =>
                    applyAiSuggestion(
                      "whyItMatters",
                      draftAssist.suggested_why_it_matters,
                    )
                  }
                  className="w-fit text-xs font-semibold uppercase tracking-wide text-[var(--accent)]"
                >
                  Apply why it matters
                </button>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="desk-kicker">Suggested coverage angle</span>
                <textarea
                  rows={3}
                  value={draftAssist.suggested_coverage_angle}
                  onChange={(event) =>
                    updateDraftAssist("suggested_coverage_angle", event.target.value)
                  }
                  className="border border-[var(--border)] px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() =>
                    applyAiSuggestion(
                      "coverageAngle",
                      draftAssist.suggested_coverage_angle,
                    )
                  }
                  className="w-fit text-xs font-semibold uppercase tracking-wide text-[var(--accent)]"
                >
                  Apply coverage angle
                </button>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="desk-kicker">Suggested uncertainty note</span>
                <textarea
                  rows={3}
                  value={draftAssist.suggested_uncertainty_note}
                  onChange={(event) =>
                    updateDraftAssist(
                      "suggested_uncertainty_note",
                      event.target.value,
                    )
                  }
                  className="border border-[var(--border)] px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() =>
                    applyAiSuggestion(
                      "uncertaintyNote",
                      draftAssist.suggested_uncertainty_note,
                    )
                  }
                  className="w-fit text-xs font-semibold uppercase tracking-wide text-[var(--accent)]"
                >
                  Apply uncertainty note
                </button>
              </label>

              <div className="grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <p className="desk-kicker mb-1">Confidence rationale</p>
                  <p className="leading-relaxed text-[var(--muted)]">
                    {draftAssist.confidence_rationale || "No rationale returned."}
                  </p>
                </div>
                <div>
                  <p className="desk-kicker mb-1">Source spread explanation</p>
                  <p className="leading-relaxed text-[var(--muted)]">
                    {draftAssist.source_spread_explanation || "No explanation returned."}
                  </p>
                </div>
              </div>

              {draftAssist.editorial_warnings.length > 0 && (
                <div className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
                  <p className="font-semibold">Editorial warnings</p>
                  <ul className="mt-1 list-disc pl-4">
                    {draftAssist.editorial_warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {draftAssist.claims_to_verify.length > 0 && (
                <div className="border border-[var(--border-subtle)] bg-[#fafbfc] px-3 py-2 text-xs leading-relaxed text-[var(--muted)]">
                  <p className="font-semibold text-[var(--foreground)]">Claims to verify</p>
                  <ul className="mt-1 list-disc pl-4">
                    {draftAssist.claims_to_verify.map((claim) => (
                      <li key={claim}>{claim}</li>
                    ))}
                  </ul>
                </div>
              )}

              {draftAssist.metadata_limitations.length > 0 && (
                <div className="text-xs leading-relaxed text-[var(--muted-light)]">
                  <p className="font-semibold">Metadata limitations</p>
                  <ul className="mt-1 list-disc pl-4">
                    {draftAssist.metadata_limitations.map((limitation) => (
                      <li key={limitation}>{limitation}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                onClick={applyAllSafeAiSuggestions}
                className="border border-[var(--accent)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]"
              >
                Apply all safe suggestions
              </button>
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={!token || loading}
            className="border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={!token || loading || !savedStory}
            className="border border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-wide disabled:opacity-50"
          >
            Publish
          </button>
          <button
            type="button"
            onClick={() => storyAction("promote")}
            disabled={!token || loading || !savedStory || savedStory.status !== "published"}
            className="border border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-wide disabled:opacity-50"
          >
            Set as lead
          </button>
          <button
            type="button"
            onClick={() => storyAction("archive")}
            disabled={!token || loading || !savedStory || savedStory.status === "archived"}
            className="border border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-wide disabled:opacity-50"
          >
            Archive
          </button>
          {savedStory?.status === "published" && (
            <Link
              href={`/story/${savedStory.slug}`}
              className="border border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-wide"
            >
              View public story
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
