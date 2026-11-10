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
