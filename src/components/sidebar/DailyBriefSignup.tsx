"use client";

import { SidebarPanel } from "@/components/ui/SidebarPanel";
import { FormEvent, useState } from "react";

export function DailyBriefSignup() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");

    try {
      const response = await fetch("/api/newsletter/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Unable to subscribe");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to subscribe");
    }
  }

  return (
    <SidebarPanel title="Daily Brief">
      <p className="mb-4 text-[13px] leading-relaxed text-[var(--muted)]">
        Morning digest of top signals, corrections, and under-covered stories —
        evidence first. MVP signup collection only; delivery is not enabled yet.
      </p>
      {submitted ? (
        <p className="border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-[13px] text-emerald-900">
          Thanks — you&apos;re on the list.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <label htmlFor="brief-email" className="sr-only">
            Email address
          </label>
          <input
            name="company"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />
          <input
            id="brief-email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <button
            type="submit"
            className="w-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-[var(--accent-muted)]"
          >
            Subscribe
          </button>
          {error && (
            <p className="text-[12px] leading-relaxed text-red-700">{error}</p>
          )}
        </form>
      )}
    </SidebarPanel>
  );
}
