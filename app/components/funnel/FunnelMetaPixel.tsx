"use client";

import { useEffect } from "react";
import { captureFunnelFbclidFromUrl } from "@/app/lib/funnel-meta-attribution";
import { trackMetaPixelPageView } from "@/app/lib/meta-pixel";

type FunnelMetaPixelProps = {
  pixelId?: string | null;
  businessId?: number | null;
  funnelId?: number | null;
  stepKey?: string;
};

export function FunnelMetaPixel({
  pixelId,
  businessId,
  funnelId,
  stepKey,
}: FunnelMetaPixelProps) {
  useEffect(() => {
    const id = pixelId?.trim();
    if (!id) return;
    if (businessId == null || !Number.isFinite(businessId) || businessId <= 0) {
      return;
    }

    captureFunnelFbclidFromUrl();
    trackMetaPixelPageView(id, {
      businessId,
      funnelId,
      dedupeKey: `PageView|${id}|${funnelId ?? ""}|${stepKey ?? ""}`,
      eventSourceUrl: window.location.href,
    });
  }, [pixelId, businessId, funnelId, stepKey]);

  return null;
}
