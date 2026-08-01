import { enabledKeywords } from "@/app/components/google-ads/campaign-builder/auto-generate";
import type { GoogleCampaignBuilderDraft } from "@/app/components/google-ads/campaign-builder/types";

export const HEADLINE_MAX = 30;
export const DESCRIPTION_MAX = 90;
export const PATH_MAX = 15;

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

export function validateStep(
  step: number,
  draft: GoogleCampaignBuilderDraft,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (step === 1 && !draft.goal) {
    errors.goal = "Choose what you want to achieve.";
  }

  if (step === 2 && draft.goal) {
    if (draft.goal === "SALES") {
      if (!draft.salesChannel) {
        errors.salesChannel = "Choose how customers buy from you.";
      } else if (
        (draft.salesChannel === "WEBSITE" ||
          draft.salesChannel === "ONLINE_STORE" ||
          draft.salesChannel === "MULTIPLE") &&
        !isValidHttpUrl(draft.websiteUrl)
      ) {
        errors.websiteUrl = "Enter a valid website URL.";
      } else if (
        (draft.salesChannel === "PHYSICAL_STORE" ||
          draft.salesChannel === "MULTIPLE") &&
        !draft.businessLocation.trim()
      ) {
        errors.businessLocation = "Add your business location.";
      } else if (
        draft.salesChannel === "PHONE_ORDERS" &&
        !draft.businessPhone.trim()
      ) {
        errors.businessPhone = "Add a phone number.";
      }
    }

    if (draft.goal === "LEADS") {
      if (draft.leadContactMethods.length === 0) {
        errors.leadContactMethods = "Select at least one contact method.";
      }
      if (
        draft.leadContactMethods.includes("CONTACT_FORM") &&
        !isValidHttpUrl(draft.landingPageUrl || draft.websiteUrl)
      ) {
        errors.landingPageUrl = "Add a landing page URL.";
      }
      if (
        draft.leadContactMethods.includes("PHONE_CALLS") &&
        !draft.businessPhone.trim()
      ) {
        errors.businessPhone = "Add a business phone number.";
      }
    }

    if (draft.goal === "WEBSITE_TRAFFIC") {
      if (draft.goalDetailSubstep <= 0 && !isValidHttpUrl(draft.websiteUrl)) {
        errors.websiteUrl = "Where should visitors go? Add a valid URL.";
      }
      if (draft.goalDetailSubstep >= 1 && !draft.trafficAction) {
        errors.trafficAction = "Choose an action for visitors.";
      }
    }

    if (draft.goal === "AWARENESS") {
      if (!draft.businessName.trim()) {
        errors.businessName = "Add your business name.";
      }
      if (!draft.businessCategory.trim()) {
        errors.businessCategory = "Choose a business category.";
      }
    }

    if (draft.goal === "APP_PROMOTION" && !draft.appName.trim()) {
      errors.appName = "Add your app name.";
    }
  }

  if (step === 3) {
    if (!draft.campaignName.trim()) errors.campaignName = "Add a campaign name.";
    if (!draft.businessName.trim()) errors.businessName = "Add your business name.";
    if (draft.websiteUrl.trim() && !isValidHttpUrl(draft.websiteUrl)) {
      errors.websiteUrl = "Enter a valid website URL.";
    }
  }

  if (step === 4 && (!draft.dailyBudget || draft.dailyBudget < 1)) {
    errors.dailyBudget = "Set a daily budget of at least $1.";
  }

  if (step === 4 && draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
    errors.endDate = "End date must be on or after the start date.";
  }

  if (step === 5 && draft.targetLocations.length === 0) {
    errors.targetLocations = "Select at least one target location.";
  }

  if (
    step === 5 &&
    draft.radiusEnabled &&
    (!draft.radiusValue || draft.radiusValue < 1)
  ) {
    errors.radiusValue = "Enter a radius of at least 1.";
  }

  if (step === 6 && draft.languages.length === 0) {
    errors.languages = "Select at least one language.";
  }

  if (step === 7 && draft.ageRanges.length === 0) {
    errors.ageRanges = "Select at least one age group.";
  }

  if (step === 8) {
    if (!draft.businessType.trim()) {
      errors.businessType = "Choose your business type.";
    } else if (enabledKeywords(draft).length === 0) {
      errors.keywords = "Keep or add at least one keyword.";
    }
  }

  if (step === 9) {
    const ad = draft.ads[0];
    if (!ad) {
      errors.ads = "Create at least one ad.";
    } else {
      if (!isValidHttpUrl(ad.finalUrl)) {
        errors.finalUrl = "Add a valid final URL.";
      }
      const headlines = ad.headlines.map((h) => h.trim()).filter(Boolean);
      if (headlines.length < 3) {
        errors.headlines = "Keep at least 3 headlines.";
      }
      const descriptions = ad.descriptions.map((d) => d.trim()).filter(Boolean);
      if (descriptions.length < 2) {
        errors.descriptions = "Keep at least 2 descriptions.";
      }
    }
  }

  return errors;
}

export function validateAllRequiredSteps(
  draft: GoogleCampaignBuilderDraft,
): Record<string, string> {
  const all: Record<string, string> = {};
  for (let step = 1; step <= 9; step += 1) {
    Object.assign(all, validateStep(step, draft));
  }
  return all;
}
