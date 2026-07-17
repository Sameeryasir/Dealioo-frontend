"use client";

import { useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getOrCreateVisitorId } from "@/app/lib/funnel-visitor-id";
import { parsePositiveInt } from "@/app/lib/numbers";
import { readBusinessIdFromSearchParams } from "@/app/lib/business-id-params";

function readRouteSegment(raw: string | string[] | undefined): string {
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && raw[0]) return raw[0];
  return "";
}

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

  const businessId = useMemo(() => {
    const fromQuery = readBusinessIdFromSearchParams(searchParams);
    if (fromQuery != null) return fromQuery;
    return parsePositiveInt(
      process.env.NEXT_PUBLIC_FUNNEL_PAYMENT_BUSINESS_ID ??
        process.env.NEXT_PUBLIC_FUNNEL_PAYMENT_RESTAURANT_ID ??
        null,
    );
  }, [searchParams]);

  useEffect(() => {
    getOrCreateVisitorId();
  }, [funnelId]);

  return {
    funnelIdSegment,
    funnelId,
    campaignId,
    businessId,
  };
}
