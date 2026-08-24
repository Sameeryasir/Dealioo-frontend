"use client";

import { useEffect } from "react";
import { GoogleAdsTag } from "@/app/components/funnel/GoogleAdsTag";
import { trackGoogleAdsPageView } from "@/app/lib/google-ads-tag";

type FunnelGoogleAdsTrackingProps = {
  googleAdsId?: string | null;
  businessId?: number | null;
  funnelId?: number | null;
  stepKey?: string;
};

export function FunnelGoogleAdsTracking({
  googleAdsId,
  businessId,
  funnelId,
  stepKey,
}: FunnelGoogleAdsTrackingProps) {
  const id = googleAdsId?.trim() ?? "";

  useEffect(() => {
    if (!id) return;
    if (businessId == null || !Number.isFinite(businessId) || businessId <= 0) {
      return;
    }

    window.__rpGoogleAdsTagInitialized = id;

    trackGoogleAdsPageView({
      googleAdsId: id,
      businessId,
      funnelId,
      dedupeKey: `page_view|${id}|${funnelId ?? ""}|${stepKey ?? ""}`,
      eventSourceUrl: window.location.href,
      params: { funnel_step: stepKey ?? "unknown" },
    });
  }, [id, businessId, funnelId, stepKey]);

  return <GoogleAdsTag googleAdsId={id} />;
}
