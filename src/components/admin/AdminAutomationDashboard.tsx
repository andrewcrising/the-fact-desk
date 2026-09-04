"use client";

import { AdminTokenField } from "@/components/admin/AdminTokenField";
import { useAdminToken } from "@/components/admin/useAdminToken";
import type { BriefingPipelineReport } from "@/lib/automation/briefing-pipeline";
import type { AutomationMode, AutomationRunRecord } from "@/types/editorial";
import { useState } from "react";

interface AdminAutomationDashboardProps {
  mode: AutomationMode;
  healthAutoPublishEnabled: boolean;
  runs: AutomationRunRecord[];
  setupError?: string;
}

export function AdminAutomationDashboard({
  mode,
  healthAutoPublishEnabled,
  runs,
  setupError,
}: AdminAutomationDashboardProps) {
  const { token, setToken } = useAdminToken();
  const [message, setMessage] = useState("");
  const [report, setReport] = useState<BriefingPipelineReport | null>(null);
  const [loading, setLoading] = useState(false);

  async function runPipeline(dryRun: boolean) {
    setLoading(true);
    setMessage("");
    setReport(null);
    try {
      const response = await fetch("/api/automation/run-briefing-pipeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dry_run: dryRun }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Pipeline failed");
      }
      setReport(data.report as BriefingPipelineReport);
      setMessage(dryRun ? "Dry run complete." : "Pipeline run complete.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pipeline failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <AdminTokenField token={token} onTokenChange={setToken} />

      <section className="desk-card p-4">
        <p className="desk-kicker mb-2">Automation mode</p>
        <h1 className="font-serif text-2xl font-semibold">Briefing pipeline</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Current mode: <span className="font-semibold text-[var(--foreground)]">{mode}</span>.
          Manual review remains available as an override layer.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--muted-light)]">
          Health auto-publish: {healthAutoPublishEnabled ? "enabled" : "disabled"}.
          Guarded auto-publish should remain off until extraction, scoring, and
          audit logs are verified.
        </p>
        {setupError && (
          <p className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {setupError}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => runPipeline(true)}
            disabled={!token || loading}
            className="border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide disabled:opacity-50"
          >
            Dry run pipeline
          </button>
          <button
            type="button"
            onClick={() => runPipeline(false)}
            disabled={!token || loading}
            className="border border-[var(--accent)] bg-[var(--accent)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
          >
            Run pipeline
          </button>
        </div>
        {message && (
          <p className="mt-3 border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm text-[var(--muted)]">
            {message}
          </p>
        )}
      </section>

      {report && (
        <section className="desk-card p-4">
          <p className="desk-kicker mb-2">Latest report</p>
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <p>Feeds checked: {report.feeds_checked}</p>
            <p>New feed items: {report.new_feed_items}</p>
            <p>Clusters: {report.clusters_created}</p>
            <p>Drafts created: {report.drafts_created}</p>
            <p>Drafts updated: {report.drafts_updated}</p>
            <p>Auto-published: {report.stories_auto_published}</p>
            <p>Needs review: {report.stories_needing_review}</p>
            <p>Duplicates skipped: {report.duplicates_skipped}</p>
            <p>Errors: {report.errors.length}</p>
          </div>
          {report.warnings.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-[var(--muted)]">
              {report.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="desk-card p-4">
        <p className="desk-kicker mb-2">Recent automation runs</p>
        {runs.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No automation runs recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => (
              <article key={run.id} className="border border-[var(--border-subtle)] p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-semibold">{run.mode} · {run.status}</p>
                  <time className="font-mono text-xs text-[var(--muted-light)]">
                    {new Date(run.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  new {run.newFeedItems} · clusters {run.clustersCreated} · drafts{" "}
                  {run.draftsCreated}/{run.draftsUpdated} · published{" "}
                  {run.storiesAutoPublished} · review {run.storiesNeedingReview}
                </p>
                {run.warnings.length > 0 && (
                  <p className="mt-1 text-xs text-amber-800">
                    Warnings: {run.warnings.slice(0, 2).join(" | ")}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
