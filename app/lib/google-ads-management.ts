import type { GoogleAdsCampaign } from "@/app/services/google-ads/get-google-ads-campaign-stats";
import type { GoogleCampaignDraftListItem } from "@/app/services/google-ads/google-campaign-draft";

export type GoogleCampaignOfferLink = {
  draftId: string;
  funnelId: number | null;
  funnelName: string | null;
  landingPageUrl: string | null;
};

export type GoogleAdsManagementAlert = {
  id: string;
  tone: "amber" | "rose" | "slate";
  title: string;
  detail: string;
  campaignId?: string;
  campaignName?: string;
};

function parseNum(raw: string | null | undefined): number {
  const n = Number.parseFloat(raw ?? "");
  return Number.isFinite(n) ? n : 0;
}

function normalizeStatus(status: string | null | undefined): string {
  const raw = status?.trim() ?? "";
  if (!raw) return "";
  const byCode: Record<string, string> = {
    "0": "UNSPECIFIED",
    "1": "UNKNOWN",
    "2": "ENABLED",
    "3": "PAUSED",
    "4": "REMOVED",
  };
  return byCode[raw] ?? raw.toUpperCase();
}

export function buildGoogleCampaignOfferLinkMap(
  drafts: GoogleCampaignDraftListItem[],
): Record<string, GoogleCampaignOfferLink> {
  const map: Record<string, GoogleCampaignOfferLink> = {};
  for (const draft of drafts) {
    const googleId = draft.googleCampaignId?.trim();
    if (!googleId) continue;
    map[googleId] = {
      draftId: draft.id,
      funnelId:
        typeof draft.selectedFunnelId === "number" && draft.selectedFunnelId > 0
          ? draft.selectedFunnelId
          : null,
      funnelName: draft.selectedFunnelName?.trim() || null,
      landingPageUrl: draft.landingPageUrl?.trim() || null,
    };
  }
  return map;
}

export function buildGoogleAdsManagementAlerts(
  campaigns: GoogleAdsCampaign[],
  datePreset = "ALL_TIME",
): GoogleAdsManagementAlert[] {
  const alerts: GoogleAdsManagementAlert[] = [];
  const preset = datePreset.toUpperCase();
  const periodDays = preset.includes("ALL_TIME")
    ? null
    : preset.includes("7")
      ? 7
      : preset.includes("14")
        ? 14
        : 30;

  for (const campaign of campaigns) {
    const status = normalizeStatus(
      campaign.effectiveStatus || campaign.status,
    );
    const name = campaign.name?.trim() || "Untitled campaign";
    const spend = parseNum(campaign.insights?.spend);
    const impressions = parseNum(campaign.insights?.impressions);
    const clicks = parseNum(campaign.insights?.clicks);
    const dailyBudget = parseNum(campaign.dailyBudget);
    const avgDailySpend =
      periodDays != null && periodDays > 0 ? spend / periodDays : null;

    if (status === "ENABLED" || status === "ACTIVE") {
      if (impressions <= 0 && clicks <= 0) {
        alerts.push({
          id: `${campaign.id}-not-delivering`,
          tone: "amber",
          title: "Ad not delivering",
          detail: `${name} is enabled but has no impressions yet. Check bidding, keywords, or billing in Google Ads.`,
          campaignId: campaign.id,
          campaignName: name,
        });
      } else if (impressions > 0 && clicks <= 0) {
        alerts.push({
          id: `${campaign.id}-no-clicks`,
          tone: "slate",
          title: "Getting views, no clicks",
          detail: `${name} has impressions but zero clicks. Review ad copy or landing page.`,
          campaignId: campaign.id,
          campaignName: name,
        });
      }

      if (
        avgDailySpend != null &&
        dailyBudget > 0 &&
        avgDailySpend >= dailyBudget * 0.9
      ) {
        alerts.push({
          id: `${campaign.id}-budget`,
          tone: "rose",
          title: "Budget nearly used",
          detail: `${name} is averaging about $${avgDailySpend.toFixed(2)}/day vs a $${dailyBudget.toFixed(2)} daily budget. Raise budget or pause if needed.`,
          campaignId: campaign.id,
          campaignName: name,
        });
      }
    }
  }

  return alerts.slice(0, 6);
}
