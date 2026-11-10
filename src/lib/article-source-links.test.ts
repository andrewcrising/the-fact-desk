import assert from "node:assert/strict";
import test from "node:test";
import { safeArticleUrl } from "@/lib/article-source-links";

test("reader citations accept HTTP and HTTPS article URLs", () => {
  assert.equal(safeArticleUrl("https://example.org/report?id=2"), "https://example.org/report?id=2");
  assert.equal(safeArticleUrl("http://example.org/report"), "http://example.org/report");
});

test("reader citations refuse dangerous schemes, credentials and malformed links", () => {
  for (const url of [
    "javascript:alert(1)", "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd", "https://user:pass@example.org/report",
    "https://", "not-a-url", "", undefined,
  ]) assert.equal(safeArticleUrl(url), null, String(url));
});

test("live discovery link guard rejects untrusted feed citations", () => {
  const candidates = [
    "javascript:alert(document.domain)",
    "data:text/html,unsafe",
    "https://editor:secret@example.org/report",
    "relative/story",
    "https://",
  ];
  for (const candidate of candidates) {
    assert.equal(safeArticleUrl(candidate), null, candidate);
  }
  assert.equal(safeArticleUrl("https://publisher.example/article"), "https://publisher.example/article");
});

test("live feed renders only URLs that passed the citation guard", async () => {
  const { readFile } = await import("node:fs/promises");
  const component = await readFile("src/components/stories/LiveBetaFeed.tsx", "utf8");
  assert.match(component, /safeArticleUrl\(story\.sourceUrls\?\.\[0\]\)/);
  assert.doesNotMatch(component, /const externalUrl = story\.sourceUrls\?\.\[0\]/);
});
