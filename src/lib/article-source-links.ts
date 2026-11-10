/** Accept only navigable article citations; feed-provided schemes are untrusted. */
export function safeArticleUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname ||
        parsed.username || parsed.password) return null;
    return parsed.href;
  } catch {
    return null;
  }
}
