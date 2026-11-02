"use client";

import {
  getIntegrationsStatus,
  integrationsStatusQueryKey,
} from "@/app/services/integration-audit/get-integrations-status";
import { useQuery } from "@tanstack/react-query";

export function useIntegrationsConnectionStatus(
  businessId: number | null | undefined,
  enabled: boolean,
) {
  const resolvedId =
    businessId != null && Number.isFinite(businessId) && businessId >= 1
      ? businessId
      : null;

  const statusQuery = useQuery({
    queryKey:
      resolvedId != null
        ? integrationsStatusQueryKey(resolvedId)
        : (["integration-status", "disabled"] as const),
    queryFn: () => getIntegrationsStatus(resolvedId!),
    enabled: enabled && resolvedId != null,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return {
    statusReady: statusQuery.isFetched,
    metaConnected: Boolean(statusQuery.data?.facebook.connected),
    googleConnected: Boolean(statusQuery.data?.googleAds.connected),
  };
}
