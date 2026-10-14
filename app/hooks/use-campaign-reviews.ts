"use client";

import { useCallback, useState } from "react";
import { usePaginatedAsyncResource } from "@/app/hooks/use-paginated-async-resource";
import {
  CAMPAIGN_REVIEWS_PAGE_SIZE,
  getCampaignReviews,
  type CampaignReviewRecord,
  type CampaignReviewSummary,
  type PaginatedCampaignReviewsResponse,
} from "@/app/services/campaign-review/campaign-review-api";

const EMPTY_SUMMARY: CampaignReviewSummary = {
  totalReviews: 0,
  averageRating: null,
  requestsSent: 0,
};

export function useCampaignReviews(
  businessId: number | null | undefined,
  campaignId: number | null | undefined,
  pageSize: number = CAMPAIGN_REVIEWS_PAGE_SIZE,
  range?: {
    from?: string;
    to?: string;
    q?: string;
    rating?: number;
  } | null,
) {
  const enabled =
    businessId != null &&
    campaignId != null &&
    Number.isFinite(businessId) &&
    Number.isFinite(campaignId);
  const limit =
    Number.isFinite(pageSize) && pageSize > 0
      ? Math.min(Math.floor(pageSize), 50)
      : CAMPAIGN_REVIEWS_PAGE_SIZE;
  const from = range?.from;
  const to = range?.to;
  const q = range?.q?.trim() || undefined;
  const ratingRaw = Math.floor(Number(range?.rating));
  const rating =
    Number.isFinite(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 5
      ? ratingRaw
      : undefined;

  const [summary, setSummary] = useState<CampaignReviewSummary>(EMPTY_SUMMARY);

  const fetchPage = useCallback(
    async (page: number) => {
      const result = await getCampaignReviews({
        businessId: businessId!,
        campaignId: campaignId!,
        page,
        limit,
        from,
        to,
        q,
        rating,
      });
      setSummary(result.summary);
      return {
        data: result.data,
        meta: result.meta,
      } satisfies Pick<PaginatedCampaignReviewsResponse, "data" | "meta">;
    },
    [businessId, campaignId, limit, from, to, q, rating],
  );

  const resource = usePaginatedAsyncResource<
    CampaignReviewRecord,
    PaginatedCampaignReviewsResponse["meta"]
  >(
    enabled,
    fetchPage,
    [businessId, campaignId, enabled, limit, from, to, q, rating],
    {
      fallbackError: "Could not load reviews.",
      resetWhenDisabled: { data: [], meta: null },
    },
  );

  return {
    ...resource,
    summary: enabled ? summary : EMPTY_SUMMARY,
  };
}
