import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { createServer, request as httpRequest } from "node:http";
import { createServer as netServer } from "node:net";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import EmbeddedPostgres from "embedded-postgres";

// Disposable loopback-only database and genuine PostgREST HTTP. No hosted secrets.
const binary = process.env.POSTGREST_BIN;
assert.ok(binary, "Set POSTGREST_BIN to the verified PostgREST 16.6 executable");
assert.match(execFileSync(resolve(binary), ["--version"], { encoding: "utf8" }), /^PostgREST 16\.6\s*$/);
async function freePort() {
  const probe = netServer();
  await new Promise((resolve, reject) => { probe.once("error", reject); probe.listen(0, "127.0.0.1", resolve); });
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}
const directory = await mkdtemp(join(tmpdir(), "factdesk-editorial-http-"));
const pgPort = await freePort(), restPort = await freePort();
const password = randomBytes(24).toString("hex"), secret = randomBytes(32).toString("hex");
const db = new EmbeddedPostgres({ databaseDir: join(directory, "data"), user: "postgres", password,
  port: pgPort, persistent: false, postgresFlags: ["-h", "127.0.0.1", "-c", "unix_socket_directories="], onLog() {}, onError() {} });
const token = (role) => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ role, exp: Math.floor(Date.now() / 1000) + 600 })).toString("base64url");
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${createHmac("sha256", secret).update(unsigned).digest("base64url")}`;
};
let admin, postgrest, proxy;
let restLogs = "";
try {
  await db.initialise(); await db.start();
  admin = db.getPgClient("postgres", "127.0.0.1"); await admin.connect();
  await admin.query(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD '${password}';
    GRANT anon, authenticated, service_role TO authenticator;`);
  for (const path of ["supabase/schema.sql", "supabase/security.sql", "supabase/automation_concurrency.sql",
    "supabase/migrations/20261109_story_source_reviews.sql", "supabase/migrations/20261112_review_identity_invalidation.sql"]) {
    await admin.query(await readFile(path, "utf8"));
  }
  postgrest = spawn(resolve(binary), [], { env: { PATH: process.env.PATH,
    PGRST_DB_URI: `postgres://authenticator:${password}@127.0.0.1:${pgPort}/postgres`,
    PGRST_DB_SCHEMAS: "public", PGRST_DB_ANON_ROLE: "anon", PGRST_JWT_SECRET: secret,
    PGRST_SERVER_HOST: "127.0.0.1", PGRST_SERVER_PORT: String(restPort) }, stdio: ["ignore", "pipe", "pipe"] });
  postgrest.stdout.on("data", (b) => { restLogs = (restLogs + b).slice(-12000); });
  postgrest.stderr.on("data", (b) => { restLogs = (restLogs + b).slice(-12000); });
  postgrest.on("error", (error) => { restLogs += error.message; });
  let ready = false;
  for (let i = 0; i < 150; i++) {
    if (postgrest.exitCode !== null) throw Error(`PostgREST exited: ${restLogs}`);
    try { if ((await fetch(`http://127.0.0.1:${restPort}/`, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, `PostgREST did not become ready: ${restLogs}`);
  // Supabase-js adds /rest/v1. This adapter only removes that fixed prefix;
  // all authorization, data serialization and SQL execution remain PostgREST.
  proxy = createServer((req, res) => {
    if (!req.url.startsWith("/rest/v1/")) { res.writeHead(404); res.end(); return; }
    const upstream = httpRequest({ hostname: "127.0.0.1", port: restPort,
      path: req.url.slice("/rest/v1".length), method: req.method, headers: req.headers }, (reply) => {
      res.writeHead(reply.statusCode, reply.headers); reply.pipe(res);
    });
    upstream.on("error", () => { res.writeHead(502); res.end(); }); req.pipe(upstream);
  });
  await new Promise((resolve) => proxy.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${proxy.address().port}`;
  for (const role of [null, "authenticated"]) {
    for (const path of ["stories?select=id", "story_source_reviews?select=story_source_id"]) {
      const response = await fetch(`${url}/rest/v1/${path}`, { headers: role ? { authorization: `Bearer ${token(role)}` } : {} });
      assert.ok([401, 403].includes(response.status), `${role ?? "anon"} unexpectedly accessed ${path}: ${response.status}`);
    }
  }
  const forged = await fetch(`${url}/rest/v1/stories`, { headers: { authorization: `Bearer ${token("service_role").slice(0, -8)}forgedxx` } });
  assert.equal(forged.status, 401);
  console.log("PASS genuine PostgREST anonymous/authenticated isolation and forged JWT denial");
  const env = { ...process.env, NODE_ENV: "test", RUN_INTEGRATION_TESTS: "true",
    SUPABASE_TEST_URL: url, SUPABASE_TEST_SERVICE_ROLE_KEY: token("service_role") };
  for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY",
    "FACT_DESK_PREVIEW_ISOLATED", "VERCEL_ENV", "SUPABASE_TEST_ALLOW_REMOTE", "SUPABASE_TEST_ALLOW_SHARED_DATABASE"]) delete env[key];
  const status = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", "--test", "src/lib/editorial-lifecycle.integration.test.ts"], { env, stdio: "inherit", timeout: 120_000 });
    child.once("error", reject); child.once("exit", resolve);
  });
  assert.equal(status, 0, "Native editorial HTTP lifecycle failed");
  console.log("PASS disposable PostgreSQL + PostgREST editorial HTTP release gate");
} finally {
  if (proxy) { proxy.closeAllConnections(); await new Promise((resolve) => proxy.close(resolve)); }
  if (postgrest && postgrest.exitCode === null) {
    const stopped = new Promise((resolve) => postgrest.once("exit", resolve)); postgrest.kill("SIGTERM"); await stopped;
  }
  if (admin) await admin.end();
  await db.stop();
  await rm(directory, { recursive: true, force: true });
}
