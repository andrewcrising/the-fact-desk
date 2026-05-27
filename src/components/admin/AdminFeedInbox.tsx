"use client";

import { AdminTokenField } from "@/components/admin/AdminTokenField";
import { useAdminToken } from "@/components/admin/useAdminToken";
import type { FeedItem } from "@/types/editorial";
import Link from "next/link";
import { useState } from "react";

interface ApiListResponse {
  ok: boolean;
  feedItems?: FeedItem[];
  error?: string;
}

export function AdminFeedInbox() {
  const { token, setToken } = useAdminToken();
  const [status, setStatus] = useState("new");
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function loadFeedItems(nextStatus = status) {
    setLoading(true);
    setMessage("");
    try {
      const response = await adminFetch(`/api/feed-items?status=${nextStatus}`);
      const data = (await response.json()) as ApiListResponse;
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Unable to load feed items");
      setFeedItems(data.feedItems ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load feed items");
    } finally {
      setLoading(false);
    }
  }

  async function ingest() {
    setLoading(true);
    setMessage("");
    try {
      const response = await adminFetch("/api/ingest/rss", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Ingest failed");
      setMessage(
        `Ingest complete: ${data.summary.newItemsInserted} new, ${data.summary.duplicatesSkipped} duplicates, ${data.summary.errors.length} feed errors.`,
      );
      await loadFeedItems();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ingest failed");
    } finally {
      setLoading(false);
    }
  }

  async function promote(id: string) {
    setLoading(true);
    try {
      const response = await adminFetch(`/api/feed-items/${id}/promote`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Promotion failed");
      setMessage("Draft story created.");
      await loadFeedItems();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Promotion failed");
    } finally {
      setLoading(false);
    }
  }

  async function ignore(id: string) {
    setLoading(true);
    try {
      const response = await adminFetch(`/api/feed-items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ignored" }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Ignore failed");
      await loadFeedItems();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ignore failed");
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
            <h1 className="font-serif text-2xl font-semibold">Feed Inbox</h1>
            <p className="text-sm text-[var(--muted)]">
              RSS items stay private here until promoted into draft stories.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={ingest}
              disabled={!token || loading}
              className="border border-[var(--accent)] bg-[var(--accent)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
            >
              Ingest RSS
            </button>
            <button
              type="button"
              onClick={() => loadFeedItems()}
              disabled={!token || loading}
              className="border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["new", "reviewed", "promoted", "ignored", "error", "all"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setStatus(item);
                void loadFeedItems(item);
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
        {feedItems.map((item) => (
          <article key={item.id} className="desk-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="desk-kicker mb-1">
                  {item.sourceName ?? "RSS"} · {item.status}
                </p>
                <h2 className="font-serif text-lg font-semibold">{item.title}</h2>
                {item.summary && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">
                    {item.summary}
                  </p>
                )}
                <a
                  href={item.canonicalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block truncate text-xs text-[var(--accent)]"
                >
                  {item.canonicalUrl}
                </a>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => promote(item.id)}
                  disabled={!token || loading || item.status === "promoted"}
                  className="border border-[var(--accent)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent)] disabled:opacity-50"
                >
                  Create draft
                </button>
                <button
                  type="button"
                  onClick={() => ignore(item.id)}
                  disabled={!token || loading}
                  className="border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide disabled:opacity-50"
                >
                  Ignore
                </button>
              </div>
            </div>
          </article>
        ))}

        {!loading && feedItems.length === 0 && (
          <div className="desk-card p-6 text-sm text-[var(--muted)]">
            No feed items loaded. Add your admin token, then refresh or ingest RSS.
            <div className="mt-3">
              <Link href="/admin/stories" className="text-[var(--accent)] hover:underline">
                View story drafts →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
