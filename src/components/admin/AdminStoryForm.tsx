"use client";

import { AdminTokenField } from "@/components/admin/AdminTokenField";
import { useAdminToken } from "@/components/admin/useAdminToken";
import { STORY_CATEGORIES } from "@/data/navigation";
import type { PersistedStory } from "@/types/editorial";
import type { Confidence, Signal } from "@/types/story";
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
  category: string;
  signal: string;
  confidence: string;
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
  category: "World",
  signal: "Developing",
  confidence: "Single-source",
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
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function update<K extends keyof StoryFormState>(key: K, value: StoryFormState[K]) {
    setState((current) => ({ ...current, [key]: value }));
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
          category: story.category,
          signal: story.signal,
          confidence: story.confidence,
          tags: story.tags.join(", "),
          homepageRank: story.homepageRank?.toString() ?? "",
          isLead: story.isLead,
          sources: sourcesToText(story),
        });
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load story");
      } finally {
        setLoading(false);
      }
    }

    void loadStory();
  }, [adminFetch, storyId, token]);

  function payload() {
    return {
      title: state.title,
      slug: state.slug,
      summary: state.summary,
      whatHappened: state.whatHappened,
      whyItMatters: state.whyItMatters,
      coverageAngle: state.coverageAngle,
      category: state.category,
      signal: state.signal,
      confidence: state.confidence,
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
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
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
