import {
  TOTAL_WIZARD_STEPS,
  createDefaultDraft,
  type GoogleCampaignBuilderDraft,
} from "@/app/components/google-ads/campaign-builder/types";
import {
  deriveLegacyLocationFields,
  migrateLegacyLocations,
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

  return {
    ...createDefaultDraft(),
    ...parsed,
    ...migrated,
    ...legacy,
    excludedLocations: migrated.excludedLocationTargets.map((row) => row.name),
    radiusUnit: normalizeRadiusUnit(parsed.radiusUnit),
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
    destinationType:
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
              : null),
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
