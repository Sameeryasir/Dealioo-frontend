/**
 * Change: Helpers to keep campaign list + detail data in the React Query client.
 * Why: Avoid blank/stale UI after create/edit/delete and reuse list data for detail views.
 * Related: use-campaigns-by-business-query.ts, BusinessCampaignsPanel.tsx, EditCampaignModal.tsx
 */

import type { QueryClient } from "@tanstack/react-query";
import { funnelQueryKeys } from "@/app/services/funnel/funnel-query-keys";
import type {
  Funnel,
  PaginatedCampaignsResponse,
} from "@/app/services/funnel/get-campaigns-by-business";

function isCampaignListResponse(
  value: unknown,
): value is PaginatedCampaignsResponse {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    Array.isArray((value as PaginatedCampaignsResponse).data) &&
    Boolean((value as PaginatedCampaignsResponse).meta)
  );
}

/** Store each campaign under its detail key so later screens can reuse it. */
export function seedCampaignDetailCache(
  queryClient: QueryClient,
  campaigns: Funnel[],
): void {
  for (const campaign of campaigns) {
    if (!Number.isFinite(campaign.id) || campaign.id < 1) continue;
    queryClient.setQueryData(funnelQueryKeys.campaignById(campaign.id), campaign);
  }
}

/** Write / refresh one campaign in every matching business list cache + detail cache. */
export function upsertCampaignInQueryClient(
  queryClient: QueryClient,
  businessId: number,
  campaign: Funnel,
  options?: { prepend?: boolean },
): void {
  seedCampaignDetailCache(queryClient, [campaign]);

  queryClient.setQueriesData<PaginatedCampaignsResponse>(
    { queryKey: [...funnelQueryKeys.campaigns(), businessId] },
    (previous) => {
      if (!isCampaignListResponse(previous)) return previous;

      const existingIndex = previous.data.findIndex(
        (row) => row.id === campaign.id,
      );
      let nextData: Funnel[];
      let totalDelta = 0;

      if (existingIndex >= 0) {
        nextData = previous.data.map((row, index) =>
          index === existingIndex ? { ...row, ...campaign } : row,
        );
      } else if (options?.prepend) {
        nextData = [campaign, ...previous.data];
        totalDelta = 1;
      } else {
        nextData = [...previous.data, campaign];
        totalDelta = 1;
      }

      const total = Math.max(0, previous.meta.total + totalDelta);
      const totalPages =
        previous.meta.limit > 0
          ? Math.max(1, Math.ceil(total / previous.meta.limit))
          : previous.meta.totalPages;

      return {
        ...previous,
        data: nextData,
        meta: {
          ...previous.meta,
          total,
          totalPages,
        },
      };
    },
  );
}

/** Remove a campaign from list caches and drop its detail entry. */
export function removeCampaignFromQueryClient(
  queryClient: QueryClient,
  businessId: number,
  campaignId: number,
): void {
  queryClient.removeQueries({
    queryKey: funnelQueryKeys.campaignById(campaignId),
  });

  queryClient.setQueriesData<PaginatedCampaignsResponse>(
    { queryKey: [...funnelQueryKeys.campaigns(), businessId] },
    (previous) => {
      if (!isCampaignListResponse(previous)) return previous;
      if (!previous.data.some((row) => row.id === campaignId)) return previous;

      const nextData = previous.data.filter((row) => row.id !== campaignId);
      const total = Math.max(0, previous.meta.total - 1);
      const totalPages =
        previous.meta.limit > 0
          ? total === 0
            ? 0
            : Math.max(1, Math.ceil(total / previous.meta.limit))
          : previous.meta.totalPages;

      return {
        ...previous,
        data: nextData,
        meta: {
          ...previous.meta,
          total,
          totalPages,
        },
      };
    },
  );
}
