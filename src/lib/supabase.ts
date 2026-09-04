import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedAdminClient: SupabaseClient | null | undefined;

function getServerApiKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getServerApiKey());
}

/**
 * Server-only Supabase client.
 *
 * Required env vars:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SECRET_KEY (preferred current key) OR
 *   SUPABASE_SERVICE_ROLE_KEY (legacy fallback)
 *
 * The server API key has service-role privileges and must never be imported
 * into Client Components or exposed through NEXT_PUBLIC_* variables.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (cachedAdminClient !== undefined) return cachedAdminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverApiKey = getServerApiKey();

  if (!url || !serverApiKey) {
    cachedAdminClient = null;
    return cachedAdminClient;
  }

  cachedAdminClient = createClient(url, serverApiKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedAdminClient;
}

export function resetSupabaseAdminForTests() {
  if (process.env.NODE_ENV === "production") return;
  cachedAdminClient = undefined;
}

export class DatabaseUnavailableError extends Error {
  constructor(message = "Supabase is not configured") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

export function requireSupabaseAdmin(): SupabaseClient {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new DatabaseUnavailableError(
      "Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return supabase;
}
