import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type OnboardingNextStep = "business_creation" | null;

export type OnboardingStatus = {
  businessId: number | null;
  twoFactorCompleted: boolean;
  businessCreated: boolean;
  onboardingCompleted: boolean;
  nextStep: OnboardingNextStep;
  redirectPath: string;
};

function normalizeNextStep(value: unknown): OnboardingNextStep {
  if (value === "business_creation") {
    return "business_creation";
  }
  return null;
}

function normalizeRedirectPath(
  value: unknown,
  businessCreated: boolean,
): string {
  if (typeof value !== "string" || !value.trim()) {
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

function normalizeOnboardingStatus(raw: unknown): OnboardingStatus {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const businessId = parseOptionalId(record.businessId);
  const businessCreated = Boolean(record.businessCreated);

  return {
    businessId,
    twoFactorCompleted: Boolean(record.twoFactorCompleted ?? true),
    businessCreated,
    onboardingCompleted: Boolean(record.onboardingCompleted),
    nextStep: normalizeNextStep(record.nextStep),
    redirectPath: normalizeRedirectPath(record.redirectPath, businessCreated),
  };
}

export async function getOnboardingStatus(
  businessId?: number,
): Promise<OnboardingStatus> {
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
  return normalizeOnboardingStatus(data);
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
  }
  return fallback;
}
