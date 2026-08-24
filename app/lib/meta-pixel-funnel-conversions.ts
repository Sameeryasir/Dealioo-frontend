import { getFunnelMetaAttribution } from "@/app/lib/funnel-meta-attribution";
import {
  claimFunnelMetaEventKey,
  createFunnelMetaEventId,
  ensureMetaPixel,
  releaseFunnelMetaEventKey,
  type FunnelMetaTrackOptions,
} from "@/app/lib/meta-pixel";
import { postFunnelMetaEvent } from "@/app/services/meta/track-funnel-meta-event";

export async function trackMetaPixelCompleteRegistration(
  options: FunnelMetaTrackOptions & { customerId: number | string },
): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const customerId = String(options.customerId);
  const pixelId =
    options.pixelId?.trim() || window.__rpMetaPixelInitialized || "";
  if (!pixelId) {
    console.warn(
      "[Funnel Meta] CompleteRegistration skipped — missing pixelId",
    );
    return null;
  }

  const dedupeKey =
    options.dedupeKey?.trim() ||
    `CompleteRegistration|${pixelId}|${options.funnelId ?? ""}|${customerId}`;

  if (!claimFunnelMetaEventKey(dedupeKey)) {
    return null;
  }

  ensureMetaPixel(pixelId);

  const eventId = options.eventId?.trim() || createFunnelMetaEventId();
  const eventTime = Math.floor(Date.now() / 1000);
  const attribution = getFunnelMetaAttribution();
  const params = {
    funnel_step: "signup",
    status: "completed",
    ...options.params,
  };

  window.fbq?.("trackSingle", pixelId, "CompleteRegistration", params, {
    eventID: eventId,
  });

  const businessId = options.businessId;
  if (
    businessId != null &&
    Number.isFinite(businessId) &&
    businessId > 0 &&
    Boolean(attribution.fbclid?.trim())
  ) {
    try {
      await postFunnelMetaEvent({
        eventId,
        eventName: "CompleteRegistration",
        businessId,
        funnelId: options.funnelId,
        pixelId,
        eventTime,
        eventSourceUrl: options.eventSourceUrl ?? window.location.href,
        fbp: attribution.fbp,
        fbc: attribution.fbc,
        fbclid: attribution.fbclid,
        email: options.email,
        phone: options.phone,
        externalId: customerId,
        customData: params,
      });
    } catch (err) {
      console.warn(
        "[Funnel Meta] CompleteRegistration backend save failed",
        err,
      );
      releaseFunnelMetaEventKey(dedupeKey);
    }
  } else {
    console.warn(
      "[Funnel Meta] CompleteRegistration skipped backend save — missing businessId",
      { pixelId, businessId },
    );
  }

  return eventId;
}

export async function trackMetaPixelPurchaseSuccess(
  options: FunnelMetaTrackOptions & {
    paymentId: number | string;
    value?: number | null;
    currency?: string | null;
    customerId?: number | string | null;
  },
): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const paymentId = String(options.paymentId);
  const pixelId =
    options.pixelId?.trim() || window.__rpMetaPixelInitialized || "";
  if (!pixelId) {
    console.warn("[Funnel Meta] Purchase skipped — missing pixelId");
    return null;
  }

  const dedupeKey =
    options.dedupeKey?.trim() ||
    `Purchase|${pixelId}|${options.funnelId ?? ""}|${paymentId}`;

  if (!claimFunnelMetaEventKey(dedupeKey)) {
    return null;
  }

  ensureMetaPixel(pixelId);

  const eventId = options.eventId?.trim() || createFunnelMetaEventId();
  const eventTime = Math.floor(Date.now() / 1000);
  const attribution = getFunnelMetaAttribution();
  const currency = options.currency?.trim().toUpperCase() || "USD";
  const params: Record<string, unknown> = {
    funnel_step: "confirmation",
    status: "completed",
    payment_status: "paid",
    currency,
    order_id: paymentId,
    ...options.params,
  };
  if (options.value != null && Number.isFinite(options.value)) {
    params.value = options.value;
  }

  window.fbq?.("trackSingle", pixelId, "Purchase", params, {
    eventID: eventId,
  });

  const businessId = options.businessId;
  const externalId =
    options.customerId != null
      ? String(options.customerId)
      : paymentId;

  if (
    businessId != null &&
    Number.isFinite(businessId) &&
    businessId > 0 &&
    Boolean(attribution.fbclid?.trim())
  ) {
    try {
      await postFunnelMetaEvent({
        eventId,
        eventName: "Purchase",
        businessId,
        funnelId: options.funnelId,
        pixelId,
        eventTime,
        eventSourceUrl: options.eventSourceUrl ?? window.location.href,
        fbp: attribution.fbp,
        fbc: attribution.fbc,
        fbclid: attribution.fbclid,
        externalId,
        customData: params,
      });
    } catch (err) {
      console.warn("[Funnel Meta] Purchase backend save failed", err);
      releaseFunnelMetaEventKey(dedupeKey);
    }
  } else {
    console.warn(
      "[Funnel Meta] Purchase skipped backend save — missing businessId",
      { pixelId, businessId },
    );
  }

  return eventId;
}
