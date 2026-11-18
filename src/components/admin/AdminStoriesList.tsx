"use client";

import { AdminTokenField } from "@/components/admin/AdminTokenField";
import { useAdminToken } from "@/components/admin/useAdminToken";
import type { PersistedStory } from "@/types/editorial";
import Link from "next/link";
import { useState } from "react";

interface StoriesResponse {
  ok: boolean;
  stories?: PersistedStory[];
  error?: string;
}

export function AdminStoriesList() {
  const { token, setToken } = useAdminToken();
  const [stories, setStories] = useState<PersistedStory[]>([]);
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const groups =
    status === "all"
      ? ([
          ["Drafts", stories.filter((story) => story.status === "draft")],
          ["Published", stories.filter((story) => story.status === "published")],
          ["Archived", stories.filter((story) => story.status === "archived")],
          ["Corrected", stories.filter((story) => story.status === "corrected")],
        ] as const)
      : ([[`${status[0].toUpperCase()}${status.slice(1)} stories`, stories]] as const);

  async function adminFetch(path: string, init: RequestInit = {}) {
    return fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
  }

  async function loadStories(nextStatus = status) {
    setLoading(true);
    setMessage("");
    try {
      const response = await adminFetch(`/api/stories?status=${nextStatus}`);
      const data = (await response.json()) as StoriesResponse;
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Unable to load stories");
      setStories(data.stories ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load stories");
    } finally {
      setLoading(false);
    }
  }

  async function action(id: string, endpoint: string, body?: Record<string, unknown>) {
    setLoading(true);
    try {
      const response = await adminFetch(`/api/stories/${id}/${endpoint}`, {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Action failed");
      setMessage(`${endpoint[0].toUpperCase()}${endpoint.slice(1)} action complete.`);
      await loadStories();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed");
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
            <h1 className="font-serif text-2xl font-semibold">Stories</h1>
            <p className="text-sm text-[var(--muted)]">
              Review drafts, publish public briefings, set homepage placement,
              and archive stories that should leave the public desk.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/stories/new"
              className="border border-[var(--accent)] bg-[var(--accent)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white"
            >
              New story
            </Link>
            <button
              type="button"
              onClick={() => loadStories()}
              disabled={!token || loading}
              className="border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["all", "draft", "published", "archived", "corrected"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setStatus(item);
                void loadStories(item);
              }}
              className={`border px-3 py-1 text-xs uppercase tracking-wide ${
                status === item
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--muted)]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {message && (
          <p className="mt-4 border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm text-[var(--muted)]">
            {message}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {groups.map(([title, groupStories]) =>
          groupStories.length > 0 ? (
            <section key={title} className="space-y-2">
              <h2 className="desk-kicker px-1 text-[var(--muted)]">{title}</h2>
              {groupStories.map((story) => (
                <article key={story.id} className="desk-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="desk-kicker mb-1">
                        {story.status} · {story.category} · {story.signal}
                        {story.evidenceLevel ? ` · ${story.evidenceLevel} evidence` : ""}
                        {story.isLead ? " · lead" : ""}
                        {story.homepageRank ? ` · rank ${story.homepageRank}` : ""}
                      </p>
                      <h3 className="font-serif text-lg font-semibold">{story.title}</h3>
                      <p className="mt-2 text-sm text-[var(--muted)]">{story.summary}</p>
                      <p className="mt-2 text-xs text-[var(--muted-light)]">
                        Sources: {story.sources.join(", ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        href={`/admin/stories/${story.id}/edit`}
                        className="border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                      >
                        Edit
                      </Link>
                      {story.status === "published" && (
                        <Link
                          href={`/story/${story.slug}`}
                          className="border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                        >
                          View public
                        </Link>
                      )}
                      {story.status !== "published" && (
                        <button
                          type="button"
                          onClick={() => action(story.id, "publish")}
                          disabled={!token || loading}
                          className="border border-[var(--accent)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent)] disabled:opacity-50"
                        >
                          Publish
                        </button>
                      )}
                  <button
                    type="button"
                        onClick={() => action(story.id, "promote", { homepageRank: 1, isLead: true })}
                        disabled={!token || loading || story.status !== "published"}
                        className="border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide disabled:opacity-50"
                      >
                        Set as lead
                      </button>
                      {story.status !== "archived" && (
                        <button
                          type="button"
                          onClick={() => action(story.id, "archive")}
                          disabled={!token || loading}
                          className="border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide disabled:opacity-50"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </section>
          ) : null,
        )}

        {!loading && stories.length === 0 && (
          <div className="desk-card p-6 text-sm text-[var(--muted)]">
            No stories loaded. Add your admin token and refresh, or create a manual
            draft.
          </div>
        )}
      </div>
    </div>
  );
}
