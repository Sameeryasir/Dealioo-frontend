import { getApiBaseUrl } from "@/app/lib/api";

export type TrackProductMetaEventPayload = {
  eventId: string;
  eventName: string;
  eventTime?: number;
  eventSourceUrl?: string;
  actionSource?: string;
  fbp?: string | null;
  fbc?: string | null;
  fbclid?: string | null;
  email?: string;
  phone?: string;
  externalId?: string;
  customData?: Record<string, unknown>;
  userAgent?: string;
};

export async function postProductMetaEvent(
  payload: TrackProductMetaEventPayload,
): Promise<void> {
  const url = `${getApiBaseUrl()}/product-meta-tracking/events`;
  const body = JSON.stringify({
    eventId: payload.eventId,
    eventName: payload.eventName,
    eventTime: payload.eventTime,
    eventSourceUrl: payload.eventSourceUrl,
    actionSource: payload.actionSource ?? "website",
    fbp: payload.fbp ?? undefined,
    fbc: payload.fbc ?? undefined,
    fbclid: payload.fbclid ?? undefined,
    email: payload.email,
    phone: payload.phone,
    externalId: payload.externalId,
    customData: payload.customData,
    userAgent:
      payload.userAgent ??
      (typeof navigator !== "undefined" ? navigator.userAgent : undefined),
  });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
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
