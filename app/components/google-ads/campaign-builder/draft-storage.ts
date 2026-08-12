import {
  TOTAL_WIZARD_STEPS,
  createDefaultDraft,
  type GoogleCampaignBuilderDraft,
} from "@/app/components/google-ads/campaign-builder/types";
import { toDealiooPublicAdsUrl } from "@/app/components/google-ads/campaign-builder/destination";
import {
  deriveLegacyLocationFields,
  migrateLegacyLocations,
  withDefaultLocationRadius,
} from "@/app/components/google-ads/campaign-builder/location-targeting";
import { beStepToUiStep } from "@/app/components/google-ads/campaign-builder/step-mapping";

const META_PREFIX = "rp_google_campaign_draft_meta_v1";
const RECOVERY_PREFIX = "rp_google_campaign_draft_recovery_v1";
const LEGACY_DRAFT_PREFIX = "rp_google_campaign_draft_v3";
const LEGACY_SERVER_ID_PREFIX = "rp_google_campaign_server_draft_id_v1";

export type GoogleDraftLocalMeta = {
  draftId: string | null;
  serverVersion: number | null;
  updatedAt: string | null;
};

function metaKey(businessId: number): string {
  return `${META_PREFIX}:${businessId}`;
}

function recoveryKey(businessId: number): string {
  return `${RECOVERY_PREFIX}:${businessId}`;
}

function normalizeRadiusUnit(
  unit: unknown,
): GoogleCampaignBuilderDraft["radiusUnit"] {
  if (unit === "KILOMETERS" || unit === "kilometer" || unit === "km") {
    return "KILOMETERS";
  }
  if (unit === "MILES" || unit === "mile" || unit === "miles") {
    return "MILES";
  }
  return "KILOMETERS";
}

function normalizeDraft(
  parsed: Partial<GoogleCampaignBuilderDraft> & { radiusUnit?: string },
): GoogleCampaignBuilderDraft {
  const migrated = migrateLegacyLocations(parsed);
  const legacy = deriveLegacyLocationFields(migrated.targetLocations);
  const wizardVersion =
    typeof parsed.wizardVersion === "number" ? parsed.wizardVersion : 1;
  const rawStep = parsed.currentStep ?? 1;
  const currentStep =
    wizardVersion >= 2
      ? Math.min(TOTAL_WIZARD_STEPS, Math.max(1, rawStep))
      : beStepToUiStep(rawStep);

  const fallbackRadius =
    typeof parsed.radiusValue === "number" && parsed.radiusValue >= 1
      ? parsed.radiusValue
      : typeof legacy.radiusValue === "number" && legacy.radiusValue >= 1
        ? legacy.radiusValue
        : 16;
  const fallbackUnit = normalizeRadiusUnit(
    parsed.radiusUnit ?? legacy.radiusUnit,
  );
  const targetLocations = migrated.targetLocations.map((row) =>
    withDefaultLocationRadius(row, fallbackRadius, fallbackUnit),
  );
  const excludedLocationTargets = migrated.excludedLocationTargets.map(
    (row) => ({
      ...row,
      radiusValue: undefined,
      radiusUnit: undefined,
    }),
  );
  const legacyNormalized = deriveLegacyLocationFields(targetLocations);
  const destinationType =
    parsed.destinationType ??
    (parsed.salesChannel === "PHONE_ORDERS" ||
    (Array.isArray(parsed.leadContactMethods) &&
      parsed.leadContactMethods.includes("PHONE_CALLS"))
      ? "phone"
      : parsed.salesChannel === "PHYSICAL_STORE"
        ? "physical_location"
        : Array.isArray(parsed.leadContactMethods) &&
            parsed.leadContactMethods.includes("GOOGLE_LEAD_FORM")
          ? "google_lead_form"
          : parsed.websiteUrl || parsed.landingPageUrl
            ? "external_website"
            : null);

  const websiteUrl =
    destinationType === "dealioo_funnel"
      ? toDealiooPublicAdsUrl(parsed.websiteUrl ?? "")
      : (parsed.websiteUrl ?? "");
  const landingPageUrl =
    destinationType === "dealioo_funnel"
      ? toDealiooPublicAdsUrl(parsed.landingPageUrl ?? websiteUrl)
      : (parsed.landingPageUrl ?? "");
  const ads = Array.isArray(parsed.ads)
    ? parsed.ads.map((ad, index) =>
        index === 0 && destinationType === "dealioo_funnel"
          ? {
              ...ad,
              finalUrl: toDealiooPublicAdsUrl(
                ad.finalUrl || landingPageUrl || websiteUrl,
              ),
            }
          : ad,
      )
    : parsed.ads;

  return {
    ...createDefaultDraft(),
    ...parsed,
    ...migrated,
    ...legacy,
    ...legacyNormalized,
    targetLocations,
    excludedLocationTargets,
    excludedLocations: excludedLocationTargets.map((row) => row.name),
    radiusUnit: fallbackUnit,
    radiusCenter: parsed.radiusCenter ?? null,
    presenceOption: parsed.presenceOption ?? "PRESENCE",
    businessDescription: parsed.businessDescription ?? "",
    onboardingDone: Boolean(parsed.onboardingDone),
    idealCustomers: Array.isArray(parsed.idealCustomers)
      ? parsed.idealCustomers
      : [],
    productsServices: Array.isArray(parsed.productsServices)
      ? parsed.productsServices
      : [],
    destinationType,
    websiteUrl,
    landingPageUrl,
    ads: ads ?? createDefaultDraft().ads,
    selectedFunnelId:
      typeof parsed.selectedFunnelId === "number"
        ? parsed.selectedFunnelId
        : null,
    selectedFunnelName:
      typeof parsed.selectedFunnelName === "string"
        ? parsed.selectedFunnelName
        : "",
    currentStep,
    wizardVersion: 2,
  };
}

function pickNonEmptyArray<T>(local: T[] | undefined, remote: T[] | undefined): T[] {
  if (Array.isArray(local) && local.length > 0) return local;
  if (Array.isArray(remote) && remote.length > 0) return remote;
  return Array.isArray(local) ? local : Array.isArray(remote) ? remote : [];
}

function pickFilledString(local: string | undefined, remote: string | undefined): string {
  if (typeof local === "string" && local.trim()) return local;
  if (typeof remote === "string" && remote.trim()) return remote;
  return local ?? remote ?? "";
}

export function mergeGoogleDraftWithLocalRecovery(options: {
  remote: {
    draftData?: Partial<GoogleCampaignBuilderDraft> | null;
    goal?: GoogleCampaignBuilderDraft["goal"] | null;
    campaignName?: string | null;
    lastSavedAt?: string | null;
    version: number;
    currentStep?: number | null;
  };
  localDraft: GoogleCampaignBuilderDraft | null;
  localMeta: GoogleDraftLocalMeta;
  remoteUiStep: number;
}): GoogleCampaignBuilderDraft {
  const remoteBase = normalizeDraft({
    ...createDefaultDraft(),
    ...(options.remote.draftData ?? {}),
    goal:
      options.remote.goal ??
      options.remote.draftData?.goal ??
      null,
    campaignName:
      options.remote.campaignName ||
      options.remote.draftData?.campaignName ||
      "",
    businessDescription: options.remote.draftData?.businessDescription ?? "",
    onboardingDone: true,
    currentStep: options.remoteUiStep,
    wizardVersion: 2,
    savedAt: options.remote.lastSavedAt ?? new Date().toISOString(),
  });

  if (!options.localDraft) {
    return remoteBase;
  }

  const local = normalizeDraft({
    ...options.localDraft,
    onboardingDone: true,
    wizardVersion: 2,
  });
  const preferLocal = shouldOfferLocalRestore({
    localUpdatedAt: local.savedAt ?? options.localMeta.updatedAt,
    serverUpdatedAt: options.remote.lastSavedAt ?? null,
    localVersion: options.localMeta.serverVersion,
    serverVersion: options.remote.version,
  });

  const primary = preferLocal ? local : remoteBase;
  const secondary = preferLocal ? remoteBase : local;

  const targetLocations = pickNonEmptyArray(
    primary.targetLocations,
    secondary.targetLocations,
  );
  const excludedLocationTargets = pickNonEmptyArray(
    primary.excludedLocationTargets,
    secondary.excludedLocationTargets,
  );
  const ads = pickNonEmptyArray(primary.ads, secondary.ads);
  const idealCustomers = pickNonEmptyArray(
    primary.idealCustomers,
    secondary.idealCustomers,
  );
  const productsServices = pickNonEmptyArray(
    primary.productsServices,
    secondary.productsServices,
  );
  const languages = pickNonEmptyArray(primary.languages, secondary.languages);
  const suggestedKeywords = pickNonEmptyArray(
    primary.suggestedKeywords,
    secondary.suggestedKeywords,
  );

  return normalizeDraft({
    ...secondary,
    ...primary,
    goal: primary.goal ?? secondary.goal ?? null,
    campaignName: pickFilledString(primary.campaignName, secondary.campaignName),
    businessName: pickFilledString(primary.businessName, secondary.businessName),
    businessDescription: pickFilledString(
      primary.businessDescription,
      secondary.businessDescription,
    ),
    websiteUrl: pickFilledString(primary.websiteUrl, secondary.websiteUrl),
    landingPageUrl: pickFilledString(
      primary.landingPageUrl,
      secondary.landingPageUrl,
    ),
    logoPreviewUrl: pickFilledString(
      primary.logoPreviewUrl,
      secondary.logoPreviewUrl,
    ),
    targetLocations,
    excludedLocationTargets,
    ads,
    adsGenerated: ads.length > 0 ? primary.adsGenerated || secondary.adsGenerated : false,
    idealCustomers,
    productsServices,
    languages,
    suggestedKeywords,
    currentStep: Math.max(local.currentStep ?? 1, remoteBase.currentStep ?? 1),
    onboardingDone: true,
    wizardVersion: 2,
    savedAt: new Date().toISOString(),
  });
}

export function loadGoogleDraftLocalMeta(
  businessId: number,
): GoogleDraftLocalMeta {
  if (typeof window === "undefined") {
    return { draftId: null, serverVersion: null, updatedAt: null };
  }
  try {
    const raw = window.localStorage.getItem(metaKey(businessId));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GoogleDraftLocalMeta>;
      return {
        draftId: parsed.draftId?.trim() || null,
        serverVersion:
          typeof parsed.serverVersion === "number" ? parsed.serverVersion : null,
        updatedAt: parsed.updatedAt ?? null,
      };
    }
    const legacyId = window.localStorage.getItem(
      `${LEGACY_SERVER_ID_PREFIX}:${businessId}`,
    );
    return {
      draftId: legacyId?.trim() || null,
      serverVersion: null,
      updatedAt: null,
    };
  } catch {
    return { draftId: null, serverVersion: null, updatedAt: null };
  }
}

export function saveGoogleDraftLocalMeta(
  businessId: number,
  meta: GoogleDraftLocalMeta,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    metaKey(businessId),
    JSON.stringify({
      draftId: meta.draftId,
      serverVersion: meta.serverVersion,
      updatedAt: meta.updatedAt ?? new Date().toISOString(),
    }),
  );
  if (meta.draftId) {
    window.localStorage.setItem(
      `${LEGACY_SERVER_ID_PREFIX}:${businessId}`,
      meta.draftId,
    );
  } else {
    window.localStorage.removeItem(`${LEGACY_SERVER_ID_PREFIX}:${businessId}`);
  }
}

export function loadGoogleCampaignServerDraftId(
  businessId: number,
): string | null {
  return loadGoogleDraftLocalMeta(businessId).draftId;
}

export function saveGoogleCampaignServerDraftId(
  businessId: number,
  draftId: string | null,
): void {
  const current = loadGoogleDraftLocalMeta(businessId);
  saveGoogleDraftLocalMeta(businessId, {
    ...current,
    draftId,
    updatedAt: new Date().toISOString(),
  });
}

export function loadGoogleCampaignDraft(
  businessId: number,
): GoogleCampaignBuilderDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(recoveryKey(businessId)) ||
      window.localStorage.getItem(`${LEGACY_DRAFT_PREFIX}:${businessId}`) ||
      window.localStorage.getItem(
        `rp_google_campaign_draft_v2:${businessId}`,
      );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GoogleCampaignBuilderDraft> & {
      radiusUnit?: string;
    };
    return normalizeDraft(parsed);
  } catch {
    return null;
  }
}

export function saveGoogleCampaignDraft(
  businessId: number,
  draft: GoogleCampaignBuilderDraft,
): GoogleCampaignBuilderDraft {
  const next: GoogleCampaignBuilderDraft = {
    ...draft,
    savedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(recoveryKey(businessId), JSON.stringify(next));
    } catch {
      try {
        const slim: GoogleCampaignBuilderDraft = {
          ...next,
          logoPreviewUrl: next.logoPreviewUrl.startsWith("data:")
            ? ""
            : next.logoPreviewUrl,
        };
        window.localStorage.setItem(
          recoveryKey(businessId),
          JSON.stringify(slim),
        );
      } catch {

      }
    }
    const meta = loadGoogleDraftLocalMeta(businessId);
    saveGoogleDraftLocalMeta(businessId, {
      ...meta,
      updatedAt: next.savedAt,
    });
  }
  return next;
}

export function clearGoogleCampaignDraft(businessId: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(recoveryKey(businessId));
  window.localStorage.removeItem(metaKey(businessId));
  window.localStorage.removeItem(`${LEGACY_DRAFT_PREFIX}:${businessId}`);
  window.localStorage.removeItem(`${LEGACY_SERVER_ID_PREFIX}:${businessId}`);
  window.localStorage.removeItem(`rp_google_campaign_draft_v2:${businessId}`);
}

export function shouldOfferLocalRestore(options: {
  localUpdatedAt: string | null;
  serverUpdatedAt: string | null;
  localVersion: number | null;
  serverVersion: number | null;
}): boolean {
  if (!options.localUpdatedAt) return false;
  if (options.serverVersion != null && options.localVersion != null) {
    if (options.serverVersion > options.localVersion) return false;
    if (options.localVersion > options.serverVersion) return true;
  }
  if (!options.serverUpdatedAt) return true;
  return (
    new Date(options.localUpdatedAt).getTime() >
    new Date(options.serverUpdatedAt).getTime()
  );
}
