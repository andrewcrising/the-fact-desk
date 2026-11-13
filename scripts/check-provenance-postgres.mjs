import assert from "node:assert/strict";
import { readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import EmbeddedPostgres from "embedded-postgres";

// A disposable native PostgreSQL server. Never accepts a remote database URL.
const portProbe = createServer();
await new Promise((resolve, reject) => { portProbe.once("error", reject); portProbe.listen(0, "127.0.0.1", resolve); });
const port = portProbe.address().port;
await new Promise((resolve) => portProbe.close(resolve));
const directory = await mkdtemp(join(tmpdir(), "factdesk-postgres-"));
const server = new EmbeddedPostgres({
  databaseDir: join(directory, "data"), user: "postgres", password: "disposable-local-only",
  port, persistent: false, postgresFlags: ["-h", "127.0.0.1", "-c", "unix_socket_directories="],
  onLog: () => {}, onError: () => {},
});
const clients = [];
async function connect(role) {
  const db = server.getPgClient("postgres", "127.0.0.1");
  await db.connect(); clients.push(db);
  await db.query("SET statement_timeout = '8s'");
  if (role) await db.query(`SET ROLE ${role}`); // Fixed role names in this test only.
  return db;
}
try {
  await server.initialise(); await server.start();
  const admin = await connect();
  console.log((await admin.query("SELECT version()")).rows[0].version);
  await admin.query("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;");
  const paths = ["supabase/schema.sql", "supabase/security.sql", "supabase/automation_concurrency.sql", "supabase/migrations/20261109_story_source_reviews.sql"];
  for (let replay = 0; replay < 2; replay++) {
    for (const path of paths) await admin.query(await readFile(path, "utf8"));
    console.log(`PASS schema/security/migration replay ${replay + 1}`);
  }
  await admin.query(await readFile("supabase/tests/story_source_reviews_regression.sql", "utf8"));
  console.log("PASS existing provenance regression and rollback");
  const identityRegression = await readFile("supabase/tests/story_source_identity_reassignment_regression.sql", "utf8");
  await assert.rejects(admin.query(identityRegression), /Publisher reassignment retained prior origin attestation/);
  await admin.query("ROLLBACK");
  console.log("REPRODUCED original identity-reassignment defect on native PostgreSQL");
  for (let replay = 0; replay < 2; replay++) {
    await admin.query(await readFile("supabase/migrations/20261112_review_identity_invalidation.sql", "utf8"));
    await admin.query(identityRegression);
  }
  console.log("PASS additive identity correction, no-op preservation, story/publisher reassignment and ABA (two replays)");
  for (const role of ["anon", "authenticated"]) {
    const db = await connect(role);
    await assert.rejects(db.query("SELECT * FROM public.story_source_reviews"), { code: "42501" });
    await assert.rejects(db.query("SELECT public.attest_story_source_origin(gen_random_uuid(),gen_random_uuid(),'https://example.org/a','origin','reviewer')"), { code: "42501" });
  }
  console.log("PASS direct anon/authenticated privilege denials");
  const source = (await admin.query("INSERT INTO sources(name) VALUES('Native test') RETURNING id")).rows[0].id;
  const story = (await admin.query("INSERT INTO stories(slug,title,summary,what_happened,why_it_matters,category,signal,confidence) VALUES('native-race','Native','Native','Native','Native','World','Developing','Single-source') RETURNING id")).rows[0].id;
  const link = (await admin.query("INSERT INTO story_sources(story_id,source_id,url,title,source_name) VALUES($1,$2,'https://example.org/old','Native','Native') RETURNING id", [story, source])).rows[0].id;
  const a = await connect("service_role"), b = await connect("service_role");
  const rpc = (db, url) => db.query("SELECT public.attest_story_source_origin($1,$2,$3,'origin-A','reviewer-A') AS accepted", [story, link, url]);
  const pid = (await b.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
  async function assertBlocked() {
    for (let attempt = 0; attempt < 100; attempt++) {
      if ((await admin.query("SELECT cardinality(pg_blocking_pids($1)) > 0 AS blocked", [pid])).rows[0].blocked) return;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw Error("Second session did not wait on the source row lock");
  }
  await a.query("BEGIN");
  await a.query("UPDATE story_sources SET url='https://example.org/new' WHERE id=$1", [link]);
  const staleReview = rpc(b, "https://example.org/old");
  await assertBlocked(); await a.query("COMMIT");
  assert.equal((await staleReview).rows[0].accepted, false);
  console.log("PASS two-session source-edit then stale-review race");
  await a.query("BEGIN");
  assert.equal((await rpc(a, "https://example.org/new")).rows[0].accepted, true);
  const sourceEdit = b.query("UPDATE story_sources SET url='https://example.org/replaced' WHERE id=$1", [link]);
  await assertBlocked(); await a.query("COMMIT"); await sourceEdit;
  assert.equal((await admin.query("SELECT count(*)::int AS count FROM story_source_reviews")).rows[0].count, 0);
  await b.query("UPDATE story_sources SET url='https://example.org/new' WHERE id=$1", [link]);
  assert.equal((await admin.query("SELECT count(*)::int AS count FROM story_source_reviews")).rows[0].count, 0);
  console.log("PASS review-then-edit race and ABA invalidation");
  await a.query("BEGIN"); await rpc(a, "https://example.org/new"); await a.query("ROLLBACK");
  assert.equal((await admin.query("SELECT count(*)::int AS count FROM story_source_reviews")).rows[0].count, 0);
  console.log("PASS attestation transaction rollback");
} finally {
  await Promise.allSettled(clients.map((client) => client.end()));
  await server.stop();
}
