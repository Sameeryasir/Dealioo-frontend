import { ADDON_TIP_MIN_TRUSTED_VISITS } from "@/app/lib/addon-suggestion-copy";
import type { CampaignAddonSuggestionItem } from "@/app/services/addon-suggestion/get-campaign-addon-suggestions";

export const CAMPAIGN_ADDON_SUGGESTIONS_PAGE_SIZE = 8;
export const CAMPAIGN_ADDON_MIN_TRUSTED_VISITS = ADDON_TIP_MIN_TRUSTED_VISITS;
export const CAMPAIGN_ADDON_PRIOR_PAGE_SIZE = 50;

const MOM_SHARE_GAP_PP = 3;
const MOM_LIFT_GAP = 0.15;

export type MomTrend =
  | "stronger"
  | "weaker"
  | "similar"
  | "new"
  | "unavailable";

export type MomCompare = {
  trend: MomTrend;
  label: string;
  detail: string;
};

export function addonMatchKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function formatShare(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatLift(value: number): string {
  if (Number.isInteger(value)) return value.toFixed(0);
  if (Math.abs(value * 10 - Math.round(value * 10)) < 0.001) {
    return value.toFixed(1);
  }
  return value.toFixed(2);
}

export function priorityLabel(
  priority: CampaignAddonSuggestionItem["priority"],
): string {
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  return "Low";
}

export function priorityClass(
  priority: CampaignAddonSuggestionItem["priority"],
): string {
  if (priority === "high") return "bg-[#ecfdf5] text-[#15803d]";
  if (priority === "medium") return "bg-[#e8f2ff] text-[#1877f2]";
  return "bg-[#f1f5f9] text-slate-500";
}

export function momBadgeClass(trend: MomTrend): string {
  if (trend === "stronger") return "bg-[#ecfdf5] text-[#15803d]";
  if (trend === "weaker") return "bg-[#fef2f2] text-[#b91c1c]";
  if (trend === "new") return "bg-[#e8f2ff] text-[#1877f2]";
  if (trend === "similar") return "bg-[#f1f5f9] text-slate-500";
  return "bg-[#f8fafc] text-slate-400";
}

export function compareSuggestionToPrior(
  current: CampaignAddonSuggestionItem,
  prior: CampaignAddonSuggestionItem | null,
  priorMonthLabel: string,
): MomCompare {
  if (!prior) {
    return {
      trend: "new",
      label: "New",
      detail: `Did not appear with this deal in ${priorMonthLabel}.`,
    };
  }

  if (prior.visitCount < CAMPAIGN_ADDON_MIN_TRUSTED_VISITS) {
    return {
      trend: "unavailable",
      label: "—",
      detail: `Not enough add-on visits in ${priorMonthLabel} to compare fairly.`,
    };
  }

  const shareDelta = current.sharePercent - prior.sharePercent;
  const liftDelta = current.lift - prior.lift;
  const detail = `Share ${formatShare(prior.sharePercent)}% → ${formatShare(current.sharePercent)}% · Lift ${formatLift(prior.lift)}x → ${formatLift(current.lift)}x vs ${priorMonthLabel}`;

  const clearlyUp =
    shareDelta >= MOM_SHARE_GAP_PP ||
    (shareDelta >= 1 && liftDelta >= MOM_LIFT_GAP);
  const clearlyDown =
    shareDelta <= -MOM_SHARE_GAP_PP ||
    (shareDelta <= -1 && liftDelta <= -MOM_LIFT_GAP);

  if (clearlyUp && !clearlyDown) {
    return { trend: "stronger", label: "Stronger", detail };
  }
  if (clearlyDown && !clearlyUp) {
    return { trend: "weaker", label: "Weaker", detail };
  }
  return { trend: "similar", label: "Similar", detail };
}

export function buildPriorAddonMap(
  priorSuggestions: CampaignAddonSuggestionItem[],
): Map<string, CampaignAddonSuggestionItem> {
  const map = new Map<string, CampaignAddonSuggestionItem>();
  for (const row of priorSuggestions) {
    const key = addonMatchKey(row.addonName);
    if (!key || map.has(key)) continue;
    map.set(key, row);
  }
  return map;
}
