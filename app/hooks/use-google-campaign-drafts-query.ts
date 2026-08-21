"use client";

import { useQuery } from "@tanstack/react-query";
import { hasAuthSession } from "@/app/lib/auth-session";
import { isPositiveInt } from "@/app/lib/numbers";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import {
  listGoogleCampaignDrafts,
  type GoogleCampaignDraftListItem,
} from "@/app/services/google-ads/google-campaign-draft";

const EMPTY_DRAFTS: GoogleCampaignDraftListItem[] = [];

export const googleCampaignDraftQueryKeys = {
  all: ["google-campaign-drafts"] as const,
  byBusiness: (businessId: number) =>
    [...googleCampaignDraftQueryKeys.all, businessId] as const,
};

export function useGoogleCampaignDraftsQuery(
  businessId: number | null | undefined,
  options?: { enabled?: boolean },
) {
  const enabled =
    (options?.enabled ?? true) &&
    isPositiveInt(businessId) &&
    hasAuthSession();

  const query = useQuery({
    queryKey:
      businessId != null
        ? googleCampaignDraftQueryKeys.byBusiness(businessId)
        : googleCampaignDraftQueryKeys.all,
    queryFn: async () => {
      if (!isPositiveInt(businessId)) {
        throw new Error("Invalid business.");
      }
      return listGoogleCampaignDrafts(businessId);
    },
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
  });

  return {
    data: query.data ?? EMPTY_DRAFTS,
    isLoading: query.isLoading && query.data == null,
    isFetching: query.isFetching,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not load Google campaign drafts.")
      : null,
    refetch: query.refetch,
  };
}
