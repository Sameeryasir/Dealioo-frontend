"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { parsePositiveInt } from "@/app/lib/numbers";

function readRouteSegment(raw: string | string[] | undefined): string {
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && raw[0]) return raw[0];
  return "";
}

/**
 * Guest funnel pages live at `/funnel/[funnelId]/…`.
 * The dynamic segment is the funnel record id; `campaignId` is an optional query param.
 */
export function useFunnelGuestRoute() {
  const params = useParams();
  const searchParams = useSearchParams();

  const funnelIdSegment = useMemo(
    () => readRouteSegment(params.campaignId),
    [params.campaignId],
  );

  const funnelId = useMemo(
    () => parsePositiveInt(funnelIdSegment),
    [funnelIdSegment],
  );

  const campaignId = useMemo(
    () => parsePositiveInt(searchParams.get("campaignId")),
    [searchParams],
  );

  const restaurantId = useMemo(() => {
    const fromQuery = parsePositiveInt(searchParams.get("restaurantId"));
    if (fromQuery != null) return fromQuery;
    return parsePositiveInt(
      process.env.NEXT_PUBLIC_FUNNEL_PAYMENT_RESTAURANT_ID ?? null,
    );
  }, [searchParams]);

  return {
    funnelIdSegment,
    funnelId,
    campaignId,
    restaurantId,
  };
}
