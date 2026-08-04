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

  if (draft.goal === "SALES") {
    if (!draft.salesChannel) {
      errors.salesChannel = "Choose how customers buy from you.";
    } else {
      const needsWebsite =
        draft.salesChannel === "WEBSITE" ||
        draft.salesChannel === "ONLINE_STORE" ||
        draft.salesChannel === "MULTIPLE";
      const needsLocation =
        draft.salesChannel === "PHYSICAL_STORE" ||
        draft.salesChannel === "MULTIPLE";
      const needsPhone = draft.salesChannel === "PHONE_ORDERS";

      if (needsWebsite && !isValidHttpUrl(draft.websiteUrl)) {
        errors.websiteUrl = "Enter a valid website URL.";
      }
      if (needsLocation && !draft.businessLocation.trim()) {
        errors.businessLocation = "Add your business location.";
      }
      if (needsPhone && !draft.businessPhone.trim()) {
        errors.businessPhone = "Add a phone number.";
      }
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
      errors.landingPageUrl = "Add a valid landing page URL.";
    }
    if (
      draft.leadContactMethods.includes("PHONE_CALLS") &&
      !draft.businessPhone.trim()
    ) {
      errors.businessPhone = "Add a phone number.";
    }
  }

  if (draft.goal === "WEBSITE_TRAFFIC") {
    if (!isValidHttpUrl(draft.websiteUrl)) {
      errors.websiteUrl = "Enter a valid website URL.";
    }
    if (!draft.trafficAction) {
      errors.trafficAction = "Choose the action visitors should take.";
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
    if (draft.radiusEnabled) {
      if (!draft.radiusValue || draft.radiusValue < 1) {
        errors.radiusValue = "Enter a radius of at least 1.";
      }
      if (
        forPublish &&
        !draft.radiusCenter?.id &&
        (draft.radiusLat == null || draft.radiusLng == null)
      ) {
        errors.radiusCenter = "Pick a center point for the optional radius.";
      }
    }
  }

  if (step === 5 && draft.idealCustomers.length === 0) {
    errors.idealCustomers = "Tell us who your ideal customers are.";
  }

  if (step === 6) {
    if (draft.productsServices.length === 0) {
      errors.productsServices = "Add at least one product or service.";
    } else if (enabledKeywords(draft).length === 0) {
      errors.keywords = "Keep or generate at least one keyword.";
    }
  }

  if (step === 7) {
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
      } else if (headlines.some((h) => h.length > HEADLINE_MAX)) {
        errors.headlines = `Each headline must be ${HEADLINE_MAX} characters or fewer.`;
      }
      const descriptions = ad.descriptions.map((d) => d.trim()).filter(Boolean);
      if (descriptions.length < 2) {
        errors.descriptions = "Keep at least 2 descriptions.";
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
        const websiteHost = safeHostname(draft.websiteUrl);
        const finalHost = safeHostname(ad.finalUrl);
        if (
          draft.goal === "SALES" &&
          (draft.salesChannel === "WEBSITE" ||
            draft.salesChannel === "ONLINE_STORE" ||
            draft.salesChannel === "MULTIPLE") &&
          websiteHost &&
          finalHost &&
          websiteHost !== finalHost
        ) {
          errors.finalUrl =
            "Ad final URL should use the same website domain as your sales site.";
        }
      }
    }
  }

  if (step === 8 && forPublish) {
    if (draft.sitelinks.length > 8) {
      errors.sitelinks = "You can add up to 8 sitelinks.";
    }
    for (const link of draft.sitelinks) {
      if (!link.enabled) continue;
      if (!link.text.trim()) {
        errors.sitelinks = "Enabled sitelinks need a link label.";
        break;
      }
      const urlErr = sitelinkUrlError(link.url, true);
      if (urlErr) {
        errors.sitelinks = urlErr;
        break;
      }
    }
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
  Object.assign(all, validateStep(8, draft, { forPublish: true }));
  return all;
}
