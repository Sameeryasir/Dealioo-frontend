import { getApiBaseUrl } from "@/app/lib/api";
import type { AnalyticsEventType } from "@/app/lib/analytics-event-types";
import { resolveFunnelClientAdSource } from "@/app/lib/funnel-ad-source";
import { captureFunnelUtmAttribution } from "@/app/lib/funnel-utm-attribution";

export type TrackAnalyticsEventPayload = {
  eventType: AnalyticsEventType;
  funnelId: number;
  visitorId?: string;
  customerId?: number;
  sessionId?: string;
  pagePath?: string;
  stepName?: string;
  stepOrder?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  adSource?: "meta" | "google" | "utm";
  adSourceLabel?: string;
  adSourceDetail?: string;
  metadata?: Record<string, unknown>;
};

export async function trackAnalyticsEvent(
  payload: TrackAnalyticsEventPayload,
): Promise<void> {
  const utm = captureFunnelUtmAttribution();
  const adSource =
    payload.adSource != null
      ? {
          adSource: payload.adSource,
          adSourceLabel: payload.adSourceLabel,
          adSourceDetail: payload.adSourceDetail,
        }
      : resolveFunnelClientAdSource();

  const res = await fetch(`${getApiBaseUrl()}/funnel-event/track-analytics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      utmSource: payload.utmSource ?? utm.utmSource,
      utmMedium: payload.utmMedium ?? utm.utmMedium,
      utmCampaign: payload.utmCampaign ?? utm.utmCampaign,
      referrer: payload.referrer ?? utm.referrer,
      ...(adSource ?? {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Analytics event track failed (${res.status})`);
  }
}
