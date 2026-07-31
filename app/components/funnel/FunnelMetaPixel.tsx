"use client";

import { useEffect } from "react";
import { trackMetaPixelPageView } from "@/app/lib/meta-pixel";

type FunnelMetaPixelProps = {
  pixelId?: string | null;
  stepKey?: string;
};

export function FunnelMetaPixel({ pixelId, stepKey }: FunnelMetaPixelProps) {
  useEffect(() => {
    trackMetaPixelPageView(pixelId);
  }, [pixelId, stepKey]);

  return null;
}
