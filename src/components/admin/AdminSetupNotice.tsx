import { hasSupabaseConfig } from "@/lib/supabase";

export function AdminSetupNotice() {
  const supabaseConfigured = hasSupabaseConfig();
  const adminTokenConfigured = Boolean(process.env.ADMIN_API_TOKEN);
  const cronConfigured = Boolean(process.env.CRON_SECRET);

  if (supabaseConfigured && adminTokenConfigured && cronConfigured) return null;

  return (
    <div className="desk-card border-amber-200 bg-amber-50/60 p-4 text-sm leading-relaxed text-amber-950">
      <p className="font-semibold">Backend setup incomplete</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {!supabaseConfigured && (
          <li>
            Supabase persistence is not configured. Set
            NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
          </li>
        )}
        {!adminTokenConfigured && (
          <li>ADMIN_API_TOKEN is missing, so admin API actions will reject requests.</li>
        )}
        {!cronConfigured && (
          <li>CRON_SECRET is missing, so scheduled ingest calls will reject requests.</li>
        )}
      </ul>
    </div>
  );
}
