import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type OnboardingNextStep = "plan_selection" | "business_creation" | null;

export type OnboardingChecklistItem = {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
};

export type OnboardingStatus = {
  businessId: number | null;
  twoFactorCompleted: boolean;
  subscriptionSelected: boolean;
  subscriptionCompleted: boolean;
  businessCreated: boolean;
  metaConnected: boolean;
  stripeConnected: boolean;
  teamInvited: boolean;
  firstCampaignCreated: boolean;
  customersImported: boolean;
  hasBusinessDraft: boolean;
  onboardingCompleted: boolean;
  onboardingVersion: string;
  nextStep: OnboardingNextStep;
  redirectPath: string;
  progress: number;
  checklist: OnboardingChecklistItem[];
};

const STATUS_CACHE_TTL_MS = 8_000;
const statusCache = new Map<string, { at: number; value: OnboardingStatus }>();
const statusInflight = new Map<string, Promise<OnboardingStatus>>();

function normalizeNextStep(value: unknown): OnboardingNextStep {
  if (value === "plan_selection" || value === "business_creation") {
    return value;
  }
  return null;
}

function normalizeRedirectPath(
  value: unknown,
  subscriptionCompleted: boolean,
  businessCreated: boolean,
): string {
  if (typeof value !== "string" || !value.trim()) {
    if (!subscriptionCompleted) return "/auth/select-plan";
    return businessCreated ? "/dashboard" : "/business/register";
  }

  return value
    .replace(/^\/restaurant\/register\b/, "/business/register")
    .replace(/^\/restaurant\/upload-menu\b/, "/dashboard")
    .replace(/^\/business\/upload-menu\b/, "/dashboard")
    .replace(/^\/setup\/menu\b/, "/dashboard");
}

function parseOptionalId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 1) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed >= 1) {
      return parsed;
    }
  }
  return null;
}

function normalizeChecklist(raw: unknown): OnboardingChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      if (typeof item.id !== "string" || typeof item.label !== "string") {
        return null;
      }
      return {
        id: item.id,
        label: item.label,
        completed: Boolean(item.completed),
        required: Boolean(item.required),
      };
    })
    .filter((item): item is OnboardingChecklistItem => item != null);
}

function normalizeOnboardingStatus(raw: unknown): OnboardingStatus {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const businessId = parseOptionalId(record.businessId);
  const businessCreated = Boolean(record.businessCreated);
  const subscriptionCompleted = Boolean(
    record.subscriptionCompleted ?? record.subscriptionSelected,
  );

  const progressRaw = record.progress;
  const progress =
    typeof progressRaw === "number" && Number.isFinite(progressRaw)
      ? Math.max(0, Math.min(100, Math.round(progressRaw)))
      : subscriptionCompleted
        ? businessCreated
          ? 65
          : 40
        : 15;

  return {
    businessId,
    twoFactorCompleted: Boolean(record.twoFactorCompleted ?? true),
    subscriptionSelected: subscriptionCompleted,
    subscriptionCompleted,
    businessCreated,
    metaConnected: Boolean(record.metaConnected),
    stripeConnected: Boolean(record.stripeConnected),
    teamInvited: Boolean(record.teamInvited),
    firstCampaignCreated: Boolean(record.firstCampaignCreated),
    customersImported: Boolean(record.customersImported),
    hasBusinessDraft: Boolean(record.hasBusinessDraft),
    onboardingCompleted: Boolean(record.onboardingCompleted),
    onboardingVersion:
      typeof record.onboardingVersion === "string" && record.onboardingVersion
        ? record.onboardingVersion
        : "2026-v1",
    nextStep: normalizeNextStep(record.nextStep),
    redirectPath: normalizeRedirectPath(
      record.redirectPath,
      subscriptionCompleted,
      businessCreated,
    ),
    progress,
    checklist: normalizeChecklist(record.checklist),
  };
}

export async function getOnboardingStatus(
  businessId?: number,
): Promise<OnboardingStatus> {
  const cacheKey =
    businessId != null && Number.isFinite(businessId) && businessId >= 1
      ? `id:${businessId}`
      : "default";

  const cached = statusCache.get(cacheKey);
  if (cached && Date.now() - cached.at < STATUS_CACHE_TTL_MS) {
    return cached.value;
  }

  const existing = statusInflight.get(cacheKey);
  if (existing) {
    return existing;
  }

  const request = (async () => {
    const params = new URLSearchParams();
    if (businessId != null && Number.isFinite(businessId) && businessId >= 1) {
      params.set("businessId", String(businessId));
    }

    const query = params.toString();
    const url = `${getApiBaseUrl()}/onboarding/status${query ? `?${query}` : ""}`;

    const res = await authenticatedFetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(
        await parseApiMessageFromResponse(
          res,
          "Could not load onboarding status.",
        ),
      );
    }

    const data: unknown = await res.json();
    const normalized = normalizeOnboardingStatus(data);
    statusCache.set(cacheKey, { at: Date.now(), value: normalized });
    return normalized;
  })();

  statusInflight.set(cacheKey, request);
  try {
    return await request;
  } finally {
    statusInflight.delete(cacheKey);
  }
}

export function invalidateOnboardingStatusCache(): void {
  statusCache.clear();
  statusInflight.clear();
}

async function parseApiMessageFromResponse(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (data && typeof data === "object" && "message" in data) {
      return parseApiMessage(
        (data as { message: unknown }).message,
        fallback,
      );
    }
  } catch {
    /* ignore */
  }
  return fallback;
}
