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

    const step = stepKey?.trim() || "unknown";
    trackMetaPixelPageView(id, {
      businessId,
      funnelId,
      dedupeKey: `PageView|${id}|${funnelId ?? ""}|${step}`,
      eventSourceUrl: window.location.href,
      params: { funnel_step: step },
    });
  }, [pixelId, businessId, funnelId, stepKey]);

  return null;
}
