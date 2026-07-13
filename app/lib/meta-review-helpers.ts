import type {
  AdCreativeStepData,
  AdSetStepData,
  CampaignStepData,
} from "@/app/lib/meta-campaign-builder-types";
import { CTA_OPTIONS } from "@/app/lib/meta-ad-creative-helpers";

const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_TRAFFIC: "Traffic",
  OUTCOME_LEADS: "Leads",
  OUTCOME_SALES: "Sales",
  OUTCOME_ENGAGEMENT: "Engagement",
  OUTCOME_AWARENESS: "Awareness",
};

const BID_LABELS: Record<string, string> = {
  LOWEST_COST_WITHOUT_CAP: "Highest volume",
  LOWEST_COST_WITH_BID_CAP: "Bid cap",
  COST_CAP: "Cost cap",
};

export function formatObjective(objective: string): string {
  return OBJECTIVE_LABELS[objective] ?? objective;
}

export function formatCboBudget(campaign: CampaignStepData): string {
  if (campaign.budgetStrategy !== "campaign" && !campaign.campaignBudgetOptimization) {
    return "Not enabled (ad set budget)";
  }
  if (campaign.campaignBudgetType === "lifetime") {
    return `Lifetime: $${campaign.campaignLifetimeBudget?.toFixed(2) ?? "N/A"}`;
  }
  return `Daily: $${campaign.campaignDailyBudget?.toFixed(2) ?? "N/A"}`;
}

export function formatAdSetBudget(
  campaign: CampaignStepData,
  adSet: AdSetStepData,
): string {
  if (campaign.campaignBudgetOptimization || campaign.budgetStrategy === "campaign") {
    return "Inherited from campaign budget";
  }
  if (adSet.budgetType === "lifetime") {
    return `Lifetime: $${adSet.lifetimeBudget?.toFixed(2) ?? "N/A"}`;
  }
  return `Daily: $${adSet.dailyBudget?.toFixed(2) ?? "N/A"}`;
}

export function formatSchedule(adSet: AdSetStepData): string {
  return `${adSet.startDate} ${adSet.startTime} → ${adSet.endDate} ${adSet.endTime} (${adSet.timezone})`;
}

export function formatAudience(adSet: AdSetStepData): string {
  const locations = adSet.audience.locations;
  if (locations?.length) {
    const included = locations.filter((loc) => loc.mode === "include");
    return included.map((loc) => loc.label).join("; ") || adSet.audience.country;
  }
  if (adSet.audience.city) {
    return `${adSet.audience.city} (${adSet.audience.radius ?? ""} ${adSet.audience.distanceUnit ?? "km"})`;
  }
  return adSet.audience.country;
}

export function formatPlacements(adSet: AdSetStepData): string {
  if (adSet.placements.advantagePlusPlacements) {
    return "Advantage+ Placements";
  }
  const parts: string[] = [];
  if (adSet.placements.publisherPlatforms.facebook) parts.push("Facebook");
  if (adSet.placements.publisherPlatforms.instagram) parts.push("Instagram");
  if (adSet.placements.publisherPlatforms.audienceNetwork) {
    parts.push("Audience Network");
  }
  if (adSet.placements.publisherPlatforms.messenger) parts.push("Messenger");
  return parts.join(", ") || "Manual placements";
}

export function formatBidStrategy(strategy: string): string {
  return BID_LABELS[strategy] ?? strategy;
}

export function formatCta(cta?: string): string {
  if (!cta) return "N/A";
  return CTA_OPTIONS.find((opt) => opt.value === cta)?.label ?? cta;
}

export function formatCreativeFormat(format: AdCreativeStepData["creativeFormat"]): string {
  switch (format) {
    case "SINGLE_IMAGE":
      return "Single image";
    case "SINGLE_VIDEO":
      return "Single video";
    case "CAROUSEL":
      return "Carousel";
    default:
      return format;
  }
}

export function getCreativePreviewUrl(creative: AdCreativeStepData): string | undefined {
  if (creative.creativeFormat === "SINGLE_IMAGE") return creative.imageUrl;
  if (creative.creativeFormat === "SINGLE_VIDEO") {
    return creative.thumbnailUrl ?? creative.videoUrl;
  }
  return creative.carouselCards?.[0]?.imageUrl;
}

/** HTTPS media URL(s) Dealioo sends to Meta on publish. */
export function getCreativeMediaLinks(
  creative: AdCreativeStepData,
): Array<{ label: string; url: string }> {
  if (creative.creativeFormat === "SINGLE_IMAGE" && creative.imageUrl?.trim()) {
    return [{ label: "Image link", url: creative.imageUrl.trim() }];
  }

  if (creative.creativeFormat === "SINGLE_VIDEO") {
    const links: Array<{ label: string; url: string }> = [];
    if (creative.videoUrl?.trim()) {
      links.push({ label: "Video link", url: creative.videoUrl.trim() });
    }
    if (creative.thumbnailUrl?.trim()) {
      links.push({ label: "Thumbnail link", url: creative.thumbnailUrl.trim() });
    }
    return links;
  }

  if (creative.creativeFormat === "CAROUSEL") {
    return (creative.carouselCards ?? [])
      .map((card, index) => {
        const url = card.imageUrl?.trim() || card.videoUrl?.trim();
        if (!url) return null;
        return {
          label: `Card ${index + 1} ${card.imageUrl?.trim() ? "image" : "video"} link`,
          url,
        };
      })
      .filter((row): row is { label: string; url: string } => row != null);
  }

  return [];
}
