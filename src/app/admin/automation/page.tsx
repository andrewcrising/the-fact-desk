import { AdminAutomationDashboard } from "@/components/admin/AdminAutomationDashboard";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopNav } from "@/components/layout/TopNav";
import { listAutomationRuns } from "@/lib/automation/automation-repository";
import {
  getAutomationMode,
  isHealthAutoPublishEnabled,
} from "@/lib/automation/config";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { AutomationRunRecord } from "@/types/editorial";

export default async function AdminAutomationPage() {
  let setupError: string | undefined;
  let runs: AutomationRunRecord[] = [];

  if (hasSupabaseConfig()) {
    try {
      runs = await listAutomationRuns(10);
    } catch (error) {
      setupError =
        error instanceof Error
          ? error.message
          : "Unable to load automation runs.";
    }
  } else {
    setupError = "Supabase is not configured, so automation run history is unavailable.";
  }

  return (
    <>
      <TopNav />
      <main className="desk-canvas flex-1">
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
          <AdminSetupNotice />
          <AdminAutomationDashboard
            mode={getAutomationMode()}
            healthAutoPublishEnabled={isHealthAutoPublishEnabled()}
            runs={runs}
            setupError={setupError}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
