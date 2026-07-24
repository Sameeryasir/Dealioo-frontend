"use client";

import { useQuery } from "@tanstack/react-query";
import { hasAuthSession } from "@/app/lib/auth-session";
import { isPositiveInt } from "@/app/lib/numbers";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import type { MetaCampaignDraft } from "@/app/lib/meta-campaign-builder-types";
import { listMetaCampaignDrafts } from "@/app/services/facebook/meta-campaign-draft";

const EMPTY_DRAFTS: MetaCampaignDraft[] = [];

export const metaCampaignDraftQueryKeys = {
  all: ["meta-campaign-drafts"] as const,
  byBusiness: (businessId: number) =>
    [...metaCampaignDraftQueryKeys.all, businessId] as const,
};

export function useMetaCampaignDraftsQuery(
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
        ? metaCampaignDraftQueryKeys.byBusiness(businessId)
        : metaCampaignDraftQueryKeys.all,
    queryFn: async () => {
      if (!isPositiveInt(businessId)) {
        throw new Error("Invalid business.");
      }
      return listMetaCampaignDrafts(businessId);
    },
    enabled,
  });

  return {
    data: query.data ?? EMPTY_DRAFTS,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error
      ? getApiErrorMessage(query.error, "Could not load campaign drafts.")
      : null,
    refetch: query.refetch,
  };
}
