import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export const INTEGRATION_AUDIT_PAGE_SIZE = 10;

export type IntegrationAuditLogItem = {
  id: string;
  provider: string;
  eventType: string;
  status: string | null;
  errorMessage: string | null;
  metadata: Record<string, string>;
  createdAt: string;
};

export type PaginatedIntegrationAuditResponse = {
  data: IntegrationAuditLogItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type IntegrationAuditListOptions = {
  page?: number;
  provider?: string;
  eventType?: string;
  from?: string;
  to?: string;
};

export function integrationAuditQueryKey(
  businessId: number,
  options: IntegrationAuditListOptions & { refreshKey?: number } = {},
) {
  return [
    "integration-audit",
    "local-day-v2",
    businessId,
    options.page ?? 1,
    options.provider ?? "",
    options.eventType ?? "",
    options.from ?? "",
    options.to ?? "",
    options.refreshKey ?? 0,
  ] as const;
}

export async function getIntegrationAuditLogs(
  businessId: number,
  options: IntegrationAuditListOptions = {},
): Promise<PaginatedIntegrationAuditResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId)) {
    throw new Error("Valid business id is required.");
  }

  const q = new URLSearchParams({
    page: String(options.page ?? 1),
  });
  if (options.provider) q.set("provider", options.provider);
  if (options.eventType) q.set("eventType", options.eventType);
  if (options.from) q.set("from", options.from);
  if (options.to) q.set("to", options.to);
  q.set("tzOffset", String(new Date().getTimezoneOffset()));

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/integration-audit/business/${encodeURIComponent(String(businessId))}?${q.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load connection activity."),
    );
  }

  const json = (await res.json()) as PaginatedIntegrationAuditResponse;
  return {
    ...json,
    data: (json.data ?? []).map((row) => ({
      ...row,
      metadata: row.metadata ?? {},
    })),
  };
}
