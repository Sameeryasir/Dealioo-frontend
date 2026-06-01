"use client";

import { useCallback, useEffect, useRef } from "react";
import { ANALYTICS_EVENT_TYPES } from "@/app/lib/analytics-event-types";
import { getFunnelCheckoutCustomerId } from "@/app/lib/funnel-checkout-storage";
import { getOrCreateVisitorId } from "@/app/lib/funnel-visitor-id";
import { trackAnalyticsEvent } from "@/app/services/funnel/track-analytics-event";

export function useFunnelAnalyticsTracking(
  funnelId: number | null | undefined,
  pageName: string,
) {
  const lastPageViewKey = useRef<string | null>(null);

  useEffect(() => {
    if (funnelId == null || funnelId < 1) return;

    const viewKey = `${funnelId}:${pageName}`;
    if (lastPageViewKey.current === viewKey) return;
    lastPageViewKey.current = viewKey;

    const customerId = getFunnelCheckoutCustomerId();

    void trackAnalyticsEvent({
      funnelId,
      visitorId: getOrCreateVisitorId(),
      eventType: ANALYTICS_EVENT_TYPES.PAGE_VIEW,
      pageName,
      ...(customerId != null ? { customerId } : {}),
    }).catch((err) => {
      console.warn("[Analytics] page_view track failed", err);
    });
  }, [funnelId, pageName]);

  const trackButtonClick = useCallback(
    (elementName: string) => {
      if (funnelId == null || funnelId < 1) return;

      const customerId = getFunnelCheckoutCustomerId();

      void trackAnalyticsEvent({
        funnelId,
        visitorId: getOrCreateVisitorId(),
        eventType: ANALYTICS_EVENT_TYPES.BUTTON_CLICK,
        pageName,
        elementName,
        ...(customerId != null ? { customerId } : {}),
      }).catch((err) => {
        console.warn("[Analytics] button_click track failed", err);
      });
    },
    [funnelId, pageName],
  );

  return { trackButtonClick };
}
