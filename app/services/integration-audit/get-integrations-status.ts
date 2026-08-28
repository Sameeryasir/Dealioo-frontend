import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type IntegrationsStatus = {
  stripe: {
    connected: boolean;
    status: string | null;
  };
  facebook: {
    connected: boolean;
    status: string | null;
    metaOauthScopes: string[];
    missingRequiredScopes: string[];
    metaAdAccountId: string | null;
  };
  googleAds: {
    connected: boolean;
    status: string | null;
    googleOauthScopes: string[];
    missingRequiredScopes: string[];
  };
};

export function integrationsStatusQueryKey(businessId: number) {
  return ["integration-status", businessId] as const;
}

export async function getIntegrationsStatus(
  businessId: number,
): Promise<IntegrationsStatus> {
  if (!Number.isFinite(businessId) || businessId < 1) {
    throw new Error("Business is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/integrations/status/${encodeURIComponent(String(businessId))}`,
    { method: "GET" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not load integration connection status.",
      ),
    );
  }

  const json = (await res.json()) as IntegrationsStatus;
  return {
    stripe: {
      connected: Boolean(json.stripe?.connected),
      status: json.stripe?.status ?? null,
    },
    facebook: {
      connected: Boolean(json.facebook?.connected),
      status: json.facebook?.status ?? null,
      metaOauthScopes: json.facebook?.metaOauthScopes ?? [],
      missingRequiredScopes: json.facebook?.missingRequiredScopes ?? [],
      metaAdAccountId: json.facebook?.metaAdAccountId?.trim() || null,
    },
    googleAds: {
      connected: Boolean(json.googleAds?.connected),
      status: json.googleAds?.status ?? null,
      googleOauthScopes: json.googleAds?.googleOauthScopes ?? [],
      missingRequiredScopes: json.googleAds?.missingRequiredScopes ?? [],
    },
  };
}
