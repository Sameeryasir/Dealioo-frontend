import { enabledKeywords } from "@/app/components/google-ads/campaign-builder/auto-generate";
import type { GoogleCampaignBuilderDraft } from "@/app/components/google-ads/campaign-builder/types";

export const HEADLINE_MAX = 30;
export const DESCRIPTION_MAX = 90;
export const PATH_MAX = 15;
export const GOOGLE_REQUIRED_PUBLISH_STEPS = [
  1, 2, 3, 4, 5, 6, 7,
] as const;

export function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidHttpsUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function sitelinkUrlError(url: string, enabled: boolean): string | null {
  if (!enabled) return null;
  const trimmed = url.trim();
  if (!trimmed) return "Add a destination URL starting with https://";
  if (!trimmed.toLowerCase().startsWith("https://")) {
    return "URL must begin with https://";
  }
  if (!isValidHttpsUrl(trimmed)) return "Enter a valid https:// URL.";
  return null;
}

function safeHostname(value: string): string | null {
  if (!isValidHttpUrl(value)) return null;
  try {
    return new URL(value.trim()).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export type ValidateStepOptions = {
  forPublish?: boolean;
};

function validateGoalDetailsFields(
  draft: GoogleCampaignBuilderDraft,
  errors: Record<string, string>,
) {
  if (!draft.goal) return;

  const funnelGoals =
    draft.goal === "SALES" ||
    draft.goal === "LEADS" ||
    draft.goal === "WEBSITE_TRAFFIC";

  if (funnelGoals) {
    if (draft.destinationType !== "dealioo_funnel") {
      errors.destinationType = "Choose a Dealioo funnel.";
    } else if (!draft.selectedFunnelId) {
      errors.destinationType = "Select a published Dealioo funnel.";
    } else if (!isValidHttpUrl(draft.landingPageUrl || draft.websiteUrl)) {
      errors.destinationType =
        "Funnel link is missing. Select a published Dealioo funnel.";
    }
  }

  if (draft.goal === "WEBSITE_TRAFFIC" && !draft.trafficAction) {
    errors.trafficAction = "Choose what visitors should do.";
  }
}

function validateKeywordsFields(
  draft: GoogleCampaignBuilderDraft,
  errors: Record<string, string>,
) {
  if (enabledKeywords(draft).length === 0) {
    errors.keywords = "Add at least one keyword to continue.";
  }
}

export function validateStep(
  step: number,
  draft: GoogleCampaignBuilderDraft,
  options?: ValidateStepOptions,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const forPublish = options?.forPublish === true;

  if (step === 1 && !draft.goal) {
    errors.goal = "Choose what you want to achieve.";
  }

  if (step === 2) {
    if (!draft.campaignName.trim()) {
      errors.campaignName = "Add a campaign name.";
    }
    if (!draft.businessName.trim()) {
      errors.businessName = "Add your business name.";
    }
    if (draft.websiteUrl.trim() && !isValidHttpUrl(draft.websiteUrl)) {
      errors.websiteUrl = "Enter a valid website URL.";
    }
    validateGoalDetailsFields(draft, errors);
  }

  if (step === 3) {
    if (!draft.dailyBudget || draft.dailyBudget < 1) {
      errors.dailyBudget = "Set a daily budget of at least $1.";
    }
    if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
      errors.endDate = "End date must be on or after the start date.";
    }
    if (forPublish) {
      if (draft.bidStrategy === "TARGET_CPA" && !draft.targetCpa.trim()) {
        errors.targetCpa = "Enter a target cost per conversion.";
      }
      if (draft.bidStrategy === "TARGET_ROAS" && !draft.targetRoas.trim()) {
        errors.targetRoas = "Enter a target return on ad spend.";
      }
    }
  }

  if (step === 4) {
    if (draft.targetLocations.length === 0) {
      errors.targetLocations = "Add at least one country, region, or city.";
    }
    if (draft.languages.length === 0) {
      errors.languages = "Select at least one language.";
    }
    if (
      draft.containsEuPoliticalAdvertising !== true &&
      draft.containsEuPoliticalAdvertising !== false
    ) {
      errors.containsEuPoliticalAdvertising =
        "Confirm if your campaign has EU political ads.";
    }

    const pinWithoutRadius = draft.targetLocations.find((row) => {
      if (row.type === "country") return false;
      const hasCoords =
        typeof row.latitude === "number" && typeof row.longitude === "number";
      const hasRadius =
        typeof row.radiusValue === "number" && row.radiusValue >= 1;
      return !hasCoords || !hasRadius;
    });
    if (pinWithoutRadius) {
      errors.radiusValue = `Set a map radius for ${pinWithoutRadius.name}.`;
      if (forPublish) {
        errors.radiusCenter = `Click ${pinWithoutRadius.name} and set its radius on the map before publishing.`;
      }
    }
  }

  if (step === 5) {
    if (!draft.ageRanges.length) {
      errors.ageRanges = "Select at least one age group.";
    }
    if (!draft.gender) {
      errors.gender = "Choose a gender option.";
    }
  }

  if (step === 6) {
    validateKeywordsFields(draft, errors);
  }

  if (step === 7) {
    const ad = draft.ads[0];
    if (!ad) {
      errors.ads = "Create at least one ad.";
    } else {
      const finalUrl =
        ad.finalUrl.trim() ||
        draft.landingPageUrl.trim() ||
        draft.websiteUrl.trim();

      if (draft.destinationType !== "dealioo_funnel" || !draft.selectedFunnelId) {
        errors.finalUrl = "Select a published Dealioo funnel in Campaign Setup.";
      } else if (!isValidHttpUrl(finalUrl)) {
        errors.finalUrl = "Funnel link is missing. Re-select your Dealioo funnel.";
      }

      const headlines = ad.headlines.map((h) => h.trim()).filter(Boolean);
      if (headlines.length < 3) {
        errors.headlines = "Add at least 3 headlines.";
      } else if (ad.headlines.length > 15) {
        errors.headlines = "You can add up to 15 headlines.";
      } else if (headlines.some((h) => h.length > HEADLINE_MAX)) {
        errors.headlines = `Each headline must be ${HEADLINE_MAX} characters or fewer.`;
      }
      const descriptions = ad.descriptions.map((d) => d.trim()).filter(Boolean);
      if (descriptions.length < 2) {
        errors.descriptions = "Add at least 2 descriptions.";
      } else if (ad.descriptions.length > 4) {
        errors.descriptions = "You can add up to 4 descriptions.";
      } else if (descriptions.some((d) => d.length > DESCRIPTION_MAX)) {
        errors.descriptions = `Each description must be ${DESCRIPTION_MAX} characters or fewer.`;
      }
      if (ad.path1.trim() && ad.path1.trim().length > PATH_MAX) {
        errors.path1 = `Path 1 must be ${PATH_MAX} characters or fewer.`;
      }
      if (ad.path2.trim() && ad.path2.trim().length > PATH_MAX) {
        errors.path2 = `Path 2 must be ${PATH_MAX} characters or fewer.`;
      }

      if (forPublish) {
        const websiteHost = safeHostname(draft.websiteUrl || draft.landingPageUrl);
        const finalHost = safeHostname(finalUrl);
        const isOnlineSales =
          draft.goal === "SALES" &&
          (draft.salesChannel === "WEBSITE" ||
            draft.salesChannel === "ONLINE_STORE" ||
            draft.salesChannel === "MULTIPLE");
        if (
          isOnlineSales &&
          websiteHost &&
          finalHost &&
          websiteHost !== finalHost
        ) {
          errors.finalUrl =
            "Ad landing page should match the destination you chose earlier.";
        }
      }
    }

    validateKeywordsFields(draft, errors);
  }

  return errors;
}

export function validateAllRequiredSteps(
  draft: GoogleCampaignBuilderDraft,
): Record<string, string> {
  const all: Record<string, string> = {};
  for (const step of GOOGLE_REQUIRED_PUBLISH_STEPS) {
    Object.assign(all, validateStep(step, draft, { forPublish: true }));
  }
  return all;
}
