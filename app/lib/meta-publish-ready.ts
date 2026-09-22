import type {
  AdCreativeStepData,
  AdSetStepData,
  CampaignStepData,
} from "@/app/lib/meta-campaign-builder-types";

function optimizationGoalNeedsPixel(
  goal: string | null | undefined,
  objective?: string | null,
): boolean {
  if (goal === "OFFSITE_CONVERSIONS" || goal === "VALUE") {
    return true;
  }
  if (goal === "LANDING_PAGE_VIEWS") {
    return objective !== "OUTCOME_TRAFFIC";
  }
  return false;
}

export function getMetaPublishReadyError(
  campaign: CampaignStepData | null | undefined,
  adSet: AdSetStepData | null | undefined,
  creative: AdCreativeStepData | null | undefined,
): string | null {
  if (!campaign || !adSet || !creative) {
    return "Complete all steps before publishing.";
  }
  if (!campaign.name.trim()) return "Campaign name is required.";
  if (!adSet.name.trim()) return "Ad set name is required.";
  if (!creative.name.trim()) return "Ad name is required.";
  if (!creative.facebookPageId.trim()) {
    return "Select a Facebook Page before publishing.";
  }
  if (!creative.primaryText.trim()) {
    return "Primary text is required before publishing.";
  }

  const hasLocation =
    Boolean(adSet.audience.country?.trim()) ||
    (adSet.audience.locations?.some((row) => row.mode !== "exclude") ?? false);
  if (!hasLocation) {
    return "Add at least one included location before publishing.";
  }

  if (optimizationGoalNeedsPixel(adSet.optimizationGoal, campaign.objective)) {
    if (!adSet.promotedObject?.pixelId?.trim()) {
      return "Select a Dataset (Meta Pixel) on the Ad set step before publishing.";
    }
    if (
      (adSet.optimizationGoal === "OFFSITE_CONVERSIONS" ||
        adSet.optimizationGoal === "VALUE") &&
      !adSet.promotedObject?.customEventType?.trim()
    ) {
      return "Select a conversion event on the Ad set step before publishing.";
    }
  }

  if (creative.creativeFormat === "SINGLE_IMAGE" && !creative.imageUrl?.trim()) {
    return "Upload an image on the Ad step before publishing.";
  }
  if (creative.creativeFormat === "SINGLE_VIDEO") {
    if (!creative.videoUrl?.trim()) {
      return "Upload a video on the Ad step before publishing.";
    }
    if (!creative.thumbnailUrl?.trim()) {
      return "Upload a video thumbnail on the Ad step before publishing.";
    }
  }
  if (creative.creativeFormat === "CAROUSEL") {
    const cards = creative.carouselCards ?? [];
    if (cards.length < 2) {
      return "Add at least 2 carousel cards before publishing.";
    }
    for (const [index, card] of cards.entries()) {
      if (!card.imageUrl?.trim()) {
        return `Upload an image for carousel card ${index + 1} before publishing.`;
      }
    }
  }
  if (
    creative.creativeFormat !== "CAROUSEL" &&
    !creative.destinationUrl?.trim()
  ) {
    return "Set a landing page URL on the Ad step before publishing.";
  }

  return null;
}
