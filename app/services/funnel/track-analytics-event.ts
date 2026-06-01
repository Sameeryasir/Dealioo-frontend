import { getApiBaseUrl } from "@/app/lib/api";
import type { AnalyticsEventType } from "@/app/lib/analytics-event-types";

export type TrackAnalyticsEventPayload = {
  funnelId: number;
  visitorId: string;
  eventType: AnalyticsEventType;
  pageName?: string;
  elementName?: string;
  customerId?: number;
  metadata?: Record<string, unknown>;
};

export async function trackAnalyticsEvent(
  payload: TrackAnalyticsEventPayload,
): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/funnel-event/track-analytics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Analytics event track failed (${res.status})`);
  }
}
