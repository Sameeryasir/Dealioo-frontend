"use client";

import { useCallback, useEffect, useRef } from "react";
import { ANALYTICS_EVENT_TYPES } from "@/app/lib/analytics-event-types";
import {
  resolveFunnelStepContext,
  resolvePagePath,
} from "@/app/lib/funnel-analytics-steps";
import { useCheckoutContext } from "@/app/contexts/checkout-context";
import { getOrCreateFunnelSessionId } from "@/app/lib/funnel-session-id";
import { getOrCreateVisitorId } from "@/app/lib/funnel-visitor-id";
import { trackAnalyticsEvent } from "@/app/services/funnel/track-analytics-event";

function buildAnalyticsContext(pageKey: string) {
  const step = resolveFunnelStepContext(pageKey);
  return {
    ...step,
    pagePath: resolvePagePath(step.pagePath),
    visitorId: getOrCreateVisitorId(),
    sessionId: getOrCreateFunnelSessionId(),
  };
}

function isCheckoutPage(pageName: string): boolean {
  const key = pageName.trim().toLowerCase();
  return key === "payment" || key === "checkout";
}

export function useFunnelAnalyticsTracking(
  funnelId: number | null | undefined,
  pageName: string,
) {
  const { session } = useCheckoutContext();
  const lastPageViewKey = useRef<string | null>(null);
  const lastCheckoutOpenKey = useRef<string | null>(null);

  const resolveCustomerId = useCallback(() => {
    return session?.customerId ?? null;
  }, [session?.customerId]);

  useEffect(() => {
    if (funnelId == null || funnelId < 1) return;

    const viewKey = `${funnelId}:${pageName}`;
    if (lastPageViewKey.current === viewKey) return;
    lastPageViewKey.current = viewKey;

    const customerId = resolveCustomerId();
    const ctx = buildAnalyticsContext(pageName);

    void trackAnalyticsEvent({
      funnelId,
      eventType: ANALYTICS_EVENT_TYPES.PAGE_VIEW,
      visitorId: ctx.visitorId,
      sessionId: ctx.sessionId,
      pagePath: ctx.pagePath,
      stepName: ctx.stepName,
      stepOrder: ctx.stepOrder,
      ...(customerId != null ? { customerId } : {}),
    }).catch((err) => {
      console.warn("[Analytics] page_view track failed", err);
    });

    // Why: checkout opens is the simple “reached payment” metric (replaces sessions).
    if (isCheckoutPage(pageName)) {
      const checkoutKey = `${funnelId}:${ctx.sessionId}:checkout`;
      if (lastCheckoutOpenKey.current !== checkoutKey) {
        lastCheckoutOpenKey.current = checkoutKey;
        void trackAnalyticsEvent({
          funnelId,
          eventType: ANALYTICS_EVENT_TYPES.CHECKOUT_OPEN,
          visitorId: ctx.visitorId,
          sessionId: ctx.sessionId,
          pagePath: ctx.pagePath,
          stepName: ctx.stepName,
          stepOrder: ctx.stepOrder,
          ...(customerId != null ? { customerId } : {}),
        }).catch((err) => {
          console.warn("[Analytics] checkout_open track failed", err);
        });
      }
    }
  }, [funnelId, pageName, resolveCustomerId]);

  const trackButtonClick = useCallback(
    (elementName: string, section = "CTA") => {
      if (funnelId == null || funnelId < 1) return;

      const customerId = resolveCustomerId();
      const ctx = buildAnalyticsContext(pageName);

      void trackAnalyticsEvent({
        funnelId,
        eventType: ANALYTICS_EVENT_TYPES.BUTTON_CLICK,
        visitorId: ctx.visitorId,
        sessionId: ctx.sessionId,
        pagePath: ctx.pagePath,
        stepName: ctx.stepName,
        stepOrder: ctx.stepOrder,
        metadata: {
          buttonText: elementName,
          section,
        },
        ...(customerId != null ? { customerId } : {}),
      }).catch((err) => {
        console.warn("[Analytics] button_click track failed", err);
      });
    },
    [funnelId, pageName, resolveCustomerId],
  );

  return { trackButtonClick };
}
