import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type BusinessOnboardingDraftPayload = {
  name?: string;
  phoneNumber?: string;
  email?: string;
  description?: string;
  websiteUrl?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  branchCount?: number;
};

export type BusinessOnboardingDraft = {
  step: string;
  payload: BusinessOnboardingDraftPayload;
  logoUrl: string | null;
  updatedAt: string;
};

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

function normalizeDraft(raw: unknown): BusinessOnboardingDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const payload =
    row.payload && typeof row.payload === "object"
      ? (row.payload as BusinessOnboardingDraftPayload)
      : {};
  return {
    step: typeof row.step === "string" ? row.step : "basics",
    payload,
    logoUrl: typeof row.logoUrl === "string" ? row.logoUrl : null,
    updatedAt:
      typeof row.updatedAt === "string"
        ? row.updatedAt
        : new Date().toISOString(),
  };
}

export async function getBusinessOnboardingDraft(): Promise<BusinessOnboardingDraft | null> {
  const url = `${getApiBaseUrl()}/onboarding/business-draft`;
  const res = await authenticatedFetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(
      await parseApiMessageFromResponse(res, "Could not load business draft."),
    );
  }

  const data: unknown = await res.json();
  if (data == null) return null;
  return normalizeDraft(data);
}

export async function saveBusinessOnboardingDraft(input: {
  step?: string;
  payload?: BusinessOnboardingDraftPayload;
  logoUrl?: string | null;
}): Promise<BusinessOnboardingDraft> {
  const url = `${getApiBaseUrl()}/onboarding/business-draft`;
  const res = await authenticatedFetch(url, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(
      await parseApiMessageFromResponse(res, "Could not save business draft."),
    );
  }

  const data: unknown = await res.json();
  const draft = normalizeDraft(data);
  if (!draft) {
    throw new Error("Invalid draft response from server.");
  }
  return draft;
}
