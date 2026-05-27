import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseRssItems } from "@/lib/ingest/rss";

describe("RSS parsing", () => {
  it("normalizes RSS items for the editorial inbox", () => {
    const items = parseRssItems(`
      <rss>
        <channel>
          <item>
            <title><![CDATA[Test <b>Headline</b>]]></title>
            <link>https://example.com/story?utm_source=rss</link>
            <description><![CDATA[<p>Useful excerpt.</p>]]></description>
            <dc:creator>Reporter</dc:creator>
            <pubDate>Wed, 27 May 2026 12:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `);

    assert.equal(items.length, 1);
    assert.equal(items[0].title, "Test Headline");
    assert.equal(items[0].description, "Useful excerpt.");
    assert.equal(items[0].author, "Reporter");
  });
});
