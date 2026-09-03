import type { QueryClient } from "@tanstack/react-query";
import { funnelQueryKeys } from "@/app/services/funnel/funnel-query-keys";
import {
  CAMPAIGNS_PAGE_SIZE,
  type Funnel,
  type PaginatedCampaignsResponse,
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

function mergeCampaignIntoList(
  previous: PaginatedCampaignsResponse | undefined,
  campaign: Funnel,
  options?: { prepend?: boolean },
): PaginatedCampaignsResponse {
  if (!isCampaignListResponse(previous)) {
    return {
      data: [campaign],
      meta: {
        page: 1,
        limit: CAMPAIGNS_PAGE_SIZE,
        total: 1,
        totalPages: 1,
      },
    };
  }

  const existingIndex = previous.data.findIndex((row) => row.id === campaign.id);
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
}

export function seedCampaignDetailCache(
  queryClient: QueryClient,
  campaigns: Funnel[],
): void {
  for (const campaign of campaigns) {
    if (!Number.isFinite(campaign.id) || campaign.id < 1) continue;
    queryClient.setQueryData(funnelQueryKeys.campaignById(campaign.id), campaign);
  }
}

export function upsertCampaignInQueryClient(
  queryClient: QueryClient,
  businessId: number,
  campaign: Funnel,
  options?: { prepend?: boolean },
): void {
  seedCampaignDetailCache(queryClient, [campaign]);

  const listKeyPrefix = [...funnelQueryKeys.campaigns(), businessId] as const;

  queryClient.setQueriesData<PaginatedCampaignsResponse>(
    { queryKey: listKeyPrefix },
    (previous) => {
      if (!isCampaignListResponse(previous)) return previous;
      return mergeCampaignIntoList(previous, campaign, options);
    },
  );

  const primaryKey = funnelQueryKeys.campaignsByRestaurant(businessId, 1, "");
  queryClient.setQueryData<PaginatedCampaignsResponse>(primaryKey, (previous) =>
    mergeCampaignIntoList(
      isCampaignListResponse(previous) ? previous : undefined,
      campaign,
      options,
    ),
  );
}

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
