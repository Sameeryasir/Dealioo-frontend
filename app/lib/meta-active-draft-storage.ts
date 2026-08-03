import type {
  AdCreativeStepData,
  AdSetStepData,
  CampaignStepData,
  MetaCampaignDraft,
} from "@/app/lib/meta-campaign-builder-types";

const ACTIVE_META_DRAFT_KEY_PREFIX = "dealioo:meta-campaign-active-draft:";
const META_DRAFT_RECOVERY_PREFIX = "dealioo:meta-campaign-draft-recovery:";

export type MetaDraftRecoverySnapshot = {
  draftId: string | null;
  currentStep: number;
  campaignData: CampaignStepData | null;
  adSetData: AdSetStepData | null;
  adCreativeData: AdCreativeStepData | null;
  updatedAt: string;
};

export function metaActiveDraftStorageKey(businessId: number): string {
  return `${ACTIVE_META_DRAFT_KEY_PREFIX}${businessId}`;
}

function recoveryStorageKey(businessId: number): string {
  return `${META_DRAFT_RECOVERY_PREFIX}${businessId}`;
}

export function readActiveMetaDraftId(businessId: number): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(
      metaActiveDraftStorageKey(businessId),
    );
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export function writeActiveMetaDraftId(
  businessId: number,
  draftId: string | null,
): void {
  if (typeof window === "undefined") return;
  try {
    const key = metaActiveDraftStorageKey(businessId);
    if (!draftId?.trim()) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, draftId.trim());
  } catch {
    
  }
}

export function readMetaDraftRecovery(
  businessId: number,
): MetaDraftRecoverySnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(recoveryStorageKey(businessId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MetaDraftRecoverySnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeMetaDraftRecovery(
  businessId: number,
  snapshot: MetaDraftRecoverySnapshot | null,
): void {
  if (typeof window === "undefined") return;
  try {
    const key = recoveryStorageKey(businessId);
    if (!snapshot) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(
      key,
      JSON.stringify({
        ...snapshot,
        updatedAt: snapshot.updatedAt || new Date().toISOString(),
      }),
    );
  } catch {
    
  }
}

export function clearMetaDraftLocalState(businessId: number): void {
  writeActiveMetaDraftId(businessId, null);
  writeMetaDraftRecovery(businessId, null);
}

export function isResumableMetaDraft(draft: MetaCampaignDraft): boolean {
  const status = (draft.status ?? "").toLowerCase();
  const publishStatus = (draft.publishStatus ?? "").toUpperCase();
  if (status === "published" || publishStatus === "PUBLISHED") return false;
  if (status === "failed" || publishStatus === "FAILED") return false;
  return true;
}
