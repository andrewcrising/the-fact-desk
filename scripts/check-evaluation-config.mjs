import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const source = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));
const built = JSON.parse(readFileSync("dist/server/wrangler.json", "utf8"));
const [major, minor] = lock.packages["node_modules/wrangler"].version.split(".").map(Number);
assert(major > 4 || (major === 4 && minor >= 135), "Wrangler must support isolated Previews");
assert.equal(pkg.devDependencies.wrangler, lock.packages[""].devDependencies.wrangler);
assert.deepEqual(built.previews, { vars: { FACT_DESK_PREVIEW_ISOLATED: "true" } });
assert.deepEqual(source.previews, built.previews);
for (const config of [source, built]) {
  for (const key of ["d1_databases", "r2_buckets", "kv_namespaces", "hyperdrive", "services", "workflows", "vectorize", "secrets_store_secrets", "routes"]) {
    assert(!config[key]?.length, `${key} requires separate resource-isolation review`);
  }
  assert.deepEqual(config.vars ?? {}, {}, "Reader must not inherit configured runtime credentials");
  assert(!config.triggers?.crons?.length, "Do not attach production schedules to the evaluation reader");
  assert(!config.queues?.producers?.length && !config.queues?.consumers?.length);
  assert(!config.durable_objects?.bindings?.length);
}
console.log("PASS local source/build/lock isolation: assets only, no configured database or credential bindings");
console.log("REMOTE GATES STILL REQUIRED: authenticated account costs, Preview secrets/base config, deployed URL, rollback");
