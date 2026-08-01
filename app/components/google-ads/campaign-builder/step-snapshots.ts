import type { GoogleCampaignBuilderDraft } from "@/app/components/google-ads/campaign-builder/types";

function normalizeValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (Array.isArray(value)) {
    const normalized = value.map((item) => normalizeValue(item));
    const allPrimitive = normalized.every(
      (item) =>
        item === null ||
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean",
    );
    if (allPrimitive) {
      return [...normalized].sort((a, b) =>
        JSON.stringify(a).localeCompare(JSON.stringify(b)),
      );
    }
    return normalized;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      out[key] = normalizeValue(record[key]);
    }
    return out;
  }
  return value;
}

export function fingerprintValue(value: unknown): string {
  return JSON.stringify(normalizeValue(value));
}

function stepPayload(
  step: number,
  draft: GoogleCampaignBuilderDraft,
): unknown {
  switch (step) {
    case 1:
      return { goal: draft.goal };
    case 2:
      return {
        goal: draft.goal,
        salesChannel: draft.salesChannel,
        websiteUrl: draft.websiteUrl,
        businessLocation: draft.businessLocation,
        businessPhone: draft.businessPhone,
        leadContactMethods: draft.leadContactMethods,
        landingPageUrl: draft.landingPageUrl,
        trafficAction: draft.trafficAction,
        businessName: draft.businessName,
        businessCategory: draft.businessCategory,
        businessAddress: draft.businessAddress,
        businessHours: draft.businessHours,
        appName: draft.appName,
        goalDetailSubstep: draft.goalDetailSubstep,
      };
    case 3:
      return {
        campaignName: draft.campaignName,
        businessName: draft.businessName,
        websiteUrl: draft.websiteUrl,
        businessCategory: draft.businessCategory,
        logoFileName: draft.logoFileName,
        logoPreviewUrl: draft.logoPreviewUrl.startsWith("blob:")
          ? ""
          : draft.logoPreviewUrl,
        extensionBusinessName: draft.extensionBusinessName,
      };
    case 4:
      return {
        dailyBudget: draft.dailyBudget,
        startDate: draft.startDate,
        endDate: draft.endDate,
      };
    case 5:
      return {
        targetLocations: draft.targetLocations,
        excludedLocationTargets: draft.excludedLocationTargets,
        countries: draft.countries,
        regions: draft.regions,
        cities: draft.cities,
        excludedLocations: draft.excludedLocations,
        radiusEnabled: draft.radiusEnabled,
        radiusCenter: draft.radiusCenter,
        radiusLat: draft.radiusLat,
        radiusLng: draft.radiusLng,
        radiusValue: draft.radiusValue,
        radiusUnit: draft.radiusUnit,
        radiusTargeting: draft.radiusTargeting,
        presenceOption: draft.presenceOption,
      };
    case 6:
      return { languages: draft.languages };
    case 7:
      return {
        ageRanges: draft.ageRanges,
        gender: draft.gender,
        householdIncome: draft.householdIncome,
        interests: draft.interests,
      };
    case 8:
      return {
        businessType: draft.businessType,
        suggestedKeywords: draft.suggestedKeywords,
        customKeywords: draft.customKeywords,
        negativeKeywords: draft.negativeKeywords,
        keywordMatchType: draft.keywordMatchType,
      };
    case 9:
      return {
        ads: draft.ads,
        adsGenerated: draft.adsGenerated,
      };
    case 10:
      return {
        extensionBusinessName: draft.extensionBusinessName,
        phoneNumber: draft.phoneNumber,
        callouts: draft.callouts,
        structuredSnippetHeader: draft.structuredSnippetHeader,
        structuredSnippetValues: draft.structuredSnippetValues,
        useLocationExtension: draft.useLocationExtension,
        sitelinks: draft.sitelinks,
        assetsGenerated: draft.assetsGenerated,
      };
    default:
      return { currentStep: draft.currentStep };
  }
}

export function getGoogleStepSnapshot(
  step: number,
  draft: GoogleCampaignBuilderDraft,
): string {
  return fingerprintValue(stepPayload(step, draft));
}

export function seedSavedStepSnapshots(
  draft: GoogleCampaignBuilderDraft,
  completedSteps: number[],
): Record<number, string> {
  const snapshots: Record<number, string> = {};
  for (const step of completedSteps) {
    if (step >= 1 && step <= 10) {
      snapshots[step] = getGoogleStepSnapshot(step, draft);
    }
  }
  return snapshots;
}
