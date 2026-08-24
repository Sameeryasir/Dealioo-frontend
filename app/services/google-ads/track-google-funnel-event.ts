import { getApiBaseUrl } from "@/app/lib/api";

export type TrackGoogleFunnelEventPayload = {
  eventId: string;
  eventName: string;
  businessId: number;
  funnelId?: number | null;
  googleAdsId: string;
  conversionLabel?: string | null;
  sendTo?: string | null;
  eventTime?: number;
  eventSourceUrl?: string;
  value?: number;
  currency?: string;
  transactionId?: string;
  gclid?: string | null;
  customData?: Record<string, unknown>;
  userAgent?: string;
};

export async function postGoogleFunnelEvent(
  payload: TrackGoogleFunnelEventPayload,
): Promise<void> {
  const url = `${getApiBaseUrl()}/google-funnel-tracking/events`;
  const body = JSON.stringify({
    eventId: payload.eventId,
    eventName: payload.eventName,
    businessId: payload.businessId,
    funnelId: payload.funnelId ?? undefined,
    googleAdsId: payload.googleAdsId,
    conversionLabel: payload.conversionLabel ?? undefined,
    sendTo: payload.sendTo ?? undefined,
    eventTime: payload.eventTime,
    eventSourceUrl: payload.eventSourceUrl,
    value: payload.value,
    currency: payload.currency,
    transactionId: payload.transactionId,
    gclid: payload.gclid ?? undefined,
    customData: payload.customData,
    userAgent:
      payload.userAgent ??
      (typeof navigator !== "undefined" ? navigator.userAgent : undefined),
  });

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.sendBeacon === "function"
  ) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon(url, blob)) {
      return;
    }
  }

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}
