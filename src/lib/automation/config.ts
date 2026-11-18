import type { AutomationMode } from "@/types/editorial";

const MODES: AutomationMode[] = [
  "manual_review",
  "auto_draft",
  "guarded_auto_publish",
  "full_auto_briefing",
];

export function getAutomationMode(): AutomationMode {
  const value = process.env.FACT_DESK_AUTOMATION_MODE;
  return MODES.includes(value as AutomationMode)
    ? (value as AutomationMode)
    : "manual_review";
}

export function isHealthAutoPublishEnabled(): boolean {
  return process.env.FACT_DESK_HEALTH_AUTO_PUBLISH_ENABLED === "true";
}

export function canRunAutomationDrafting(mode = getAutomationMode()): boolean {
  return mode === "auto_draft" || mode === "guarded_auto_publish";
}

export function canRunGuardedAutoPublish(mode = getAutomationMode()): boolean {
  return mode === "guarded_auto_publish";
}
