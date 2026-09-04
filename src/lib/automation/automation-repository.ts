import { requireSupabaseAdmin } from "@/lib/supabase";
import type {
  AutomationMode,
  AutomationRunRecord,
  AutomationRunStatus,
} from "@/types/editorial";

const STALE_AUTOMATION_RUN_MS = 30 * 60 * 1000;
export const AUTOMATION_ALREADY_RUNNING_MESSAGE =
  "Automation pipeline is already running.";

interface AutomationRunRow {
  id: string;
  mode: AutomationMode;
  started_at: string;
  completed_at: string | null;
  status: AutomationRunStatus;
  feeds_checked: number;
  new_feed_items: number;
  clusters_created: number;
  drafts_created: number;
  drafts_updated: number;
  stories_auto_published: number;
  stories_needing_review: number;
  errors: Array<Record<string, unknown>>;
  warnings: string[];
  created_at: string;
}

function mapRun(row: AutomationRunRow): AutomationRunRecord {
  return {
    id: row.id,
    mode: row.mode,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status,
    feedsChecked: row.feeds_checked,
    newFeedItems: row.new_feed_items,
    clustersCreated: row.clusters_created,
    draftsCreated: row.drafts_created,
    draftsUpdated: row.drafts_updated,
    storiesAutoPublished: row.stories_auto_published,
    storiesNeedingReview: row.stories_needing_review,
    errors: row.errors ?? [],
    warnings: row.warnings ?? [],
    createdAt: row.created_at,
  };
}

export async function listAutomationRuns(limit = 10): Promise<AutomationRunRecord[]> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("automation_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as AutomationRunRow[]).map(mapRun);
}

export async function createAutomationRun(mode: AutomationMode): Promise<string> {
  const supabase = requireSupabaseAdmin();
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_AUTOMATION_RUN_MS).toISOString();

  // A crashed invocation must not block the desk forever. Expire only clearly
  // stale claims; the partial unique index still makes the subsequent insert
  // race-safe if two schedulers arrive together.
  const { error: staleError } = await supabase
    .from("automation_runs")
    .update({
      status: "failed",
      completed_at: now.toISOString(),
      warnings: ["Automation run exceeded 30 minutes and was closed as stale."],
    })
    .eq("status", "running")
    .lt("started_at", staleBefore);

  if (staleError) throw staleError;

  const { data, error } = await supabase
    .from("automation_runs")
    .insert({ mode, status: "running", started_at: now.toISOString() })
    .select("id")
    .single();

  if (error?.code === "23505") {
    throw new Error(AUTOMATION_ALREADY_RUNNING_MESSAGE);
  }
  if (error) throw error;
  return data.id as string;
}

export async function completeAutomationRun(
  id: string,
  report: {
    status: AutomationRunStatus;
    feeds_checked: number;
    new_feed_items: number;
    clusters_created: number;
    drafts_created: number;
    drafts_updated: number;
    stories_auto_published: number;
    stories_needing_review: number;
    errors: Array<Record<string, unknown>>;
    warnings: string[];
  },
): Promise<void> {
  const supabase = requireSupabaseAdmin();
  const { error } = await supabase
    .from("automation_runs")
    .update({
      ...report,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

export async function createStoryAutomationEvent(input: {
  storyId?: string | null;
  eventType: string;
  mode: AutomationMode;
  details: Record<string, unknown>;
}): Promise<void> {
  const supabase = requireSupabaseAdmin();
  const { error } = await supabase.from("story_automation_events").insert({
    story_id: input.storyId ?? null,
    event_type: input.eventType,
    mode: input.mode,
    details: input.details,
  });

  if (error) throw error;
}
