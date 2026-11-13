import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "./route";

test("disabled monitoring reports unavailable without contacting feeds or granting write access", async () => {
  const previous = process.env.FACT_DESK_SCHEDULED_DISCOVERY;
  try {
    delete process.env.FACT_DESK_SCHEDULED_DISCOVERY;
    const response = await GET();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    const body = await response.json();
    assert.equal(body.status, "unavailable");
    assert.equal(body.schedulerVerified, false);
    assert.equal(body.stories, 0);
    assert.deepEqual(body.feeds, []);
    assert.equal(Object.keys(body.categories).length, 8);
  } finally {
    if (previous === undefined) delete process.env.FACT_DESK_SCHEDULED_DISCOVERY;
    else process.env.FACT_DESK_SCHEDULED_DISCOVERY = previous;
  }
});
