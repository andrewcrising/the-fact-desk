import { isReadOnlyEvaluation } from "./evaluation-mode";
import { parseDiscoverySnapshot, SNAPSHOT_MAX_BYTES, type DiscoverySnapshot } from "./discovery-snapshot";

// Fixed public evaluation data only. No configurable URL, database or writer credential.
export const EVALUATION_SNAPSHOT_URL = "https://raw.githubusercontent.com/andrewcrising/the-fact-desk/data/evaluation-live-feed/discovery.json";
export function createSnapshotReader(load: () => Promise<unknown>, now = Date.now) {
  let retained: DiscoverySnapshot | null = null;
  let nextAttempt = 0;
  let pending: Promise<DiscoverySnapshot | null> | null = null;
  let generation = 0;
  const read = async (): Promise<DiscoverySnapshot | null> => {
    if (now() < nextAttempt) return parseDiscoverySnapshot(retained, now());
    if (!pending) {
      const currentGeneration = generation;
      const current = load().then((data) => {
        const snapshot = parseDiscoverySnapshot(data, now());
        if (currentGeneration !== generation) return parseDiscoverySnapshot(retained, now());
        if (snapshot && (!retained || Date.parse(snapshot.attemptedAt) >= Date.parse(retained.attemptedAt))) retained = snapshot;
        nextAttempt = now() + (snapshot ? 60_000 : 30_000);
        return parseDiscoverySnapshot(retained, now());
      }).catch(() => {
        if (currentGeneration === generation) nextAttempt = now() + 30_000;
        return parseDiscoverySnapshot(retained, now());
      }).finally(() => { if (pending === current) pending = null; });
      pending = current;
    }
    return pending;
  };
  return Object.assign(read, { invalidate() { generation++; nextAttempt = 0; pending = null; } });
}

export async function loadEvaluationSnapshot(): Promise<unknown> {
  const response = await fetch(EVALUATION_SNAPSHOT_URL, { signal: AbortSignal.timeout(3000), redirect: "error", cache: "no-store" });
  if (!response.ok || Number(response.headers.get("content-length") ?? 0) > SNAPSHOT_MAX_BYTES) throw Error("Snapshot unavailable");
  const reader = response.body?.getReader();
  if (!reader) throw Error("Snapshot body missing");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > SNAPSHOT_MAX_BYTES) throw Error("Snapshot too large");
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const buffer = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(buffer));
}
const reader = createSnapshotReader(loadEvaluationSnapshot);
export const getScheduledSnapshot = Object.assign(async () => {
  if (!isReadOnlyEvaluation() || process.env.FACT_DESK_SCHEDULED_DISCOVERY !== "true") return null;
  return reader();
}, { invalidate() { reader.invalidate(); } });
