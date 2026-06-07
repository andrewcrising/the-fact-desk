import { requireSupabaseAdmin } from "@/lib/supabase";
import type {
  AutomationMode,
  AutomationRunRecord,
  AutomationRunStatus,
} from "@/types/editorial";

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
  const { data, error } = await supabase
    .from("automation_runs")
    .insert({ mode, status: "running", started_at: new Date().toISOString() })
    .select("id")
    .single();

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
