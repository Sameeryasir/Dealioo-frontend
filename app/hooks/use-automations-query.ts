"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAutomations,
  mapAutomationToListItem,
  type AutomationsListPage,
} from "@/app/services/automation/automation-api";
import { automationQueryKeys } from "@/app/services/automation/automation-query-keys";
import type { AutomationFilter } from "@/app/components/automation/types";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";

const EMPTY_PAGE: AutomationsListPage = {
  data: [],
  meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
};

/**
 * What changed: paginated list query keyed by page/campaign/search/status.
 * Why: server-side pagination keeps the automation list fast for large businesses.
 * Related: getAutomations, AutomationListPage, OffsetPagination
 * MCP Context 7: React Query list key includes all filter params used by the request.
 */
export function useAutomationsQuery(
  businessId: number | null | undefined,
  opts: {
    page: number;
    limit?: number;
    campaignId?: number | null;
    q?: string;
    status?: AutomationFilter;
  },
) {
  const page = opts.page >= 1 ? opts.page : 1;
  const limit = opts.limit ?? 10;
  const campaignId =
    opts.campaignId != null && opts.campaignId >= 1 ? opts.campaignId : undefined;
  const q = opts.q?.trim() || undefined;
  const status =
    opts.status === "active" || opts.status === "draft" ? opts.status : undefined;

  const query = useQuery({
    queryKey:
      businessId != null
        ? automationQueryKeys.listPage(businessId, {
            page,
            limit,
            campaignId: campaignId ?? null,
            q: q ?? "",
            status: status ?? "all",
          })
        : automationQueryKeys.lists(),
    queryFn: async (): Promise<AutomationsListPage> => {
      if (businessId == null) {
        throw new Error("Business id is missing from the URL.");
      }
      const response = await getAutomations({
        businessId,
        campaignId,
        q,
        status,
        page,
        limit,
      });
      return {
        data: response.data.map((automation) =>
          mapAutomationToListItem(automation),
        ),
        meta: response.meta,
      };
    },
    enabled: businessId != null,
    staleTime: 0,
    placeholderData: (previous) => previous,
  });

  return {
    data: query.data ?? EMPTY_PAGE,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not load automations.")
      : null,
    refetch: query.refetch,
  };
}
