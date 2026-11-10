import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseRssItems, readBoundedRssBody } from "@/lib/ingest/rss";

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

describe("bounded RSS transport", () => {
  function responseWithChunks(chunks: Uint8Array[], length?: number): Response {
    return new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
    }), { headers: length === undefined ? {} : { "content-length": String(length) } });
  }

  it("reads a complete small body", async () => {
    const bytes = new TextEncoder().encode("<rss><channel /></rss>");
    assert.equal(await readBoundedRssBody(responseWithChunks([bytes]), 128), "<rss><channel /></rss>");
  });

  it("rejects oversized declared Content-Length before streaming", async () => {
    const bytes = new TextEncoder().encode("small");
    await assert.rejects(readBoundedRssBody(responseWithChunks([bytes], 1024), 16), /size limit/);
  });

  it("rejects chunked oversized feeds even without Content-Length", async () => {
    const chunks = [new Uint8Array(12), new Uint8Array(12)];
    await assert.rejects(readBoundedRssBody(responseWithChunks(chunks), 20), /size limit/);
  });

  it("accepts a body exactly at the byte boundary", async () => {
    const bytes = new TextEncoder().encode("1234567890");
    assert.equal(await readBoundedRssBody(responseWithChunks([bytes]), 10), "1234567890");
  });
});
