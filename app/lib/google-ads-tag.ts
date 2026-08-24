import { getGoogleAdsAttribution, hasGoogleAdsGclid } from "@/app/lib/google-ads-funnel-tracking";
import { postGoogleFunnelEvent } from "@/app/services/google-ads/track-google-funnel-event";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    __rpGoogleAdsTagInitialized?: string;
  }
}

const sentGoogleAdsKeys = new Set<string>();

export type GoogleAdsTrackOptions = {
  googleAdsId?: string | null;
  conversionLabel?: string | null;
  businessId?: number | null;
  funnelId?: number | null;
  value?: number;
  currency?: string;
  transactionId?: string;
  params?: Record<string, unknown>;
  dedupeKey?: string;
  skipBrowser?: boolean;
  skipServer?: boolean;
  eventSourceUrl?: string;
};

function newEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ga_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function normalizeId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function trackGoogleAdsConversion(
  options: GoogleAdsTrackOptions = {},
): string | null {
  if (typeof window === "undefined") return null;

  const googleAdsId =
    normalizeId(options.googleAdsId) || window.__rpGoogleAdsTagInitialized;
  const conversionLabel = normalizeId(options.conversionLabel);

  if (!googleAdsId || !conversionLabel) return null;

  const sendTo = `${googleAdsId}/${conversionLabel}`;
  const dedupeKey =
    options.dedupeKey?.trim() ||
    `conversion|${sendTo}|${options.funnelId ?? ""}|${window.location.pathname}`;

  if (sentGoogleAdsKeys.has(dedupeKey)) {
    return null;
  }
  sentGoogleAdsKeys.add(dedupeKey);

  const eventId = newEventId();
  const eventTime = Math.floor(Date.now() / 1000);
  const { gclid } = getGoogleAdsAttribution();

  const payload: Record<string, unknown> = { send_to: sendTo };
  if (options.value != null && Number.isFinite(options.value)) {
    payload.value = options.value;
  }
  if (options.currency?.trim()) {
    payload.currency = options.currency.trim().toUpperCase();
  }
  if (options.transactionId?.trim()) {
    payload.transaction_id = options.transactionId.trim();
  }

  if (!options.skipBrowser && typeof window.gtag === "function") {
    window.gtag("event", "conversion", payload);
  }

  const businessId = options.businessId;
  if (
    !options.skipServer &&
    hasGoogleAdsGclid() &&
    businessId != null &&
    Number.isFinite(businessId) &&
    businessId > 0
  ) {
    void postGoogleFunnelEvent({
      eventId,
      eventName: "conversion",
      businessId,
      funnelId: options.funnelId,
      googleAdsId,
      conversionLabel,
      sendTo,
      eventTime,
      eventSourceUrl: options.eventSourceUrl ?? window.location.href,
      value: options.value,
      currency: options.currency,
      transactionId: options.transactionId,
      gclid,
    }).catch(() => {});
  }

  return eventId;
}

function trackGoogleAdsStandardEvent(
  eventName: string,
  options: GoogleAdsTrackOptions & { gtagEventName?: string },
): string | null {
  if (typeof window === "undefined") return null;

  const googleAdsId =
    normalizeId(options.googleAdsId) || window.__rpGoogleAdsTagInitialized;
  if (!googleAdsId) return null;

  const dedupeKey =
    options.dedupeKey?.trim() ||
    `${eventName}|${googleAdsId}|${options.funnelId ?? ""}|${window.location.pathname}`;

  if (sentGoogleAdsKeys.has(dedupeKey)) {
    return null;
  }
  sentGoogleAdsKeys.add(dedupeKey);

  const eventId = newEventId();
  const eventTime = Math.floor(Date.now() / 1000);
  const { gclid } = getGoogleAdsAttribution();
  const params = options.params;
  const gtagEventName = options.gtagEventName ?? eventName;

  if (!options.skipBrowser && typeof window.gtag === "function") {
    if (params && Object.keys(params).length > 0) {
      window.gtag("event", gtagEventName, params);
    } else {
      window.gtag("event", gtagEventName);
    }
  }

  const businessId = options.businessId;
  if (
    !options.skipServer &&
    hasGoogleAdsGclid() &&
    businessId != null &&
    Number.isFinite(businessId) &&
    businessId > 0
  ) {
    void postGoogleFunnelEvent({
      eventId,
      eventName,
      businessId,
      funnelId: options.funnelId,
      googleAdsId,
      eventTime,
      eventSourceUrl: options.eventSourceUrl ?? window.location.href,
      value: options.value,
      currency: options.currency,
      transactionId: options.transactionId,
      gclid,
      customData: params,
    }).catch(() => {});
  }

  return eventId;
}

async function trackGoogleAdsStandardEventAsync(
  eventName: string,
  options: GoogleAdsTrackOptions & { gtagEventName?: string },
): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const googleAdsId =
    normalizeId(options.googleAdsId) || window.__rpGoogleAdsTagInitialized;
  if (!googleAdsId) return null;

  const dedupeKey =
    options.dedupeKey?.trim() ||
    `${eventName}|${googleAdsId}|${options.funnelId ?? ""}|${window.location.pathname}`;

  if (sentGoogleAdsKeys.has(dedupeKey)) {
    return null;
  }
  sentGoogleAdsKeys.add(dedupeKey);

  const eventId = newEventId();
  const eventTime = Math.floor(Date.now() / 1000);
  const { gclid } = getGoogleAdsAttribution();
  const params = options.params;
  const gtagEventName = options.gtagEventName ?? eventName;

  if (!options.skipBrowser && typeof window.gtag === "function") {
    if (params && Object.keys(params).length > 0) {
      window.gtag("event", gtagEventName, params);
    } else {
      window.gtag("event", gtagEventName);
    }
  }

  const businessId = options.businessId;
  if (
    !options.skipServer &&
    hasGoogleAdsGclid() &&
    businessId != null &&
    Number.isFinite(businessId) &&
    businessId > 0
  ) {
    try {
      await postGoogleFunnelEvent({
        eventId,
        eventName,
        businessId,
        funnelId: options.funnelId,
        googleAdsId,
        eventTime,
        eventSourceUrl: options.eventSourceUrl ?? window.location.href,
        value: options.value,
        currency: options.currency,
        transactionId: options.transactionId,
        gclid,
        customData: params,
      });
    } catch {
      sentGoogleAdsKeys.delete(dedupeKey);
    }
  }

  return eventId;
}

export type GoogleAdsPaymentTrackOptions = {
  googleAdsId?: string | null;
  businessId?: number | null;
  funnelId?: number | null;
  value?: number;
  currency?: string;
  transactionId?: string;
  purchaseConversionLabel?: string | null;
  dedupeKey?: string;
  eventSourceUrl?: string;
};

export function trackGoogleAdsBeginCheckout(
  options: GoogleAdsPaymentTrackOptions = {},
): void {
  const googleAdsId =
    normalizeId(options.googleAdsId) || window.__rpGoogleAdsTagInitialized;
  const businessId = options.businessId;
  if (!googleAdsId || businessId == null || businessId <= 0) return;

  const currency = options.currency?.trim().toUpperCase() || "USD";
  const checkoutParams: Record<string, unknown> = {
    currency,
    funnel_step: "payment",
  };
  if (options.value != null && Number.isFinite(options.value)) {
    checkoutParams.value = options.value;
  }

  trackGoogleAdsStandardEvent("begin_checkout", {
    googleAdsId,
    businessId,
    funnelId: options.funnelId,
    gtagEventName: "begin_checkout",
    params: checkoutParams,
    value: options.value,
    currency,
    dedupeKey:
      options.dedupeKey ??
      `begin_checkout|${googleAdsId}|${options.funnelId ?? ""}|${businessId}`,
    eventSourceUrl: options.eventSourceUrl,
  });
}

export async function trackGoogleAdsPurchaseSuccess(
  options: GoogleAdsPaymentTrackOptions = {},
): Promise<void> {
  const googleAdsId =
    normalizeId(options.googleAdsId) || window.__rpGoogleAdsTagInitialized;
  const businessId = options.businessId;
  if (!googleAdsId || businessId == null || businessId <= 0) return;

  const currency = options.currency?.trim().toUpperCase() || "USD";
  const transactionId = options.transactionId?.trim();
  const purchaseParams: Record<string, unknown> = {
    currency,
    funnel_step: "confirmation",
    status: "completed",
    payment_status: "paid",
  };
  if (options.value != null && Number.isFinite(options.value)) {
    purchaseParams.value = options.value;
  }
  if (transactionId) {
    purchaseParams.transaction_id = transactionId;
  }

  await trackGoogleAdsStandardEventAsync("purchase", {
    googleAdsId,
    businessId,
    funnelId: options.funnelId,
    gtagEventName: "purchase",
    params: purchaseParams,
    value: options.value,
    currency,
    transactionId,
    dedupeKey:
      options.dedupeKey ??
      `purchase|${googleAdsId}|${options.funnelId ?? ""}|${businessId}|${transactionId ?? ""}`,
    eventSourceUrl: options.eventSourceUrl,
  });

  if (options.purchaseConversionLabel?.trim()) {
    trackGoogleAdsConversion({
      googleAdsId,
      conversionLabel: options.purchaseConversionLabel,
      businessId,
      funnelId: options.funnelId,
      value: options.value,
      currency,
      transactionId,
      dedupeKey: `conversion|purchase|${googleAdsId}|${options.purchaseConversionLabel}|${options.funnelId ?? ""}|${transactionId ?? ""}`,
      eventSourceUrl: options.eventSourceUrl,
    });
  }
}

export type GoogleAdsSignupTrackOptions = {
  googleAdsId?: string | null;
  businessId?: number | null;
  funnelId?: number | null;
  customerId?: number | string | null;
  email?: string;
  phone?: string;
  eventSourceUrl?: string;
};

export async function trackGoogleAdsSignupSuccess(
  options: GoogleAdsSignupTrackOptions = {},
): Promise<void> {
  const googleAdsId =
    normalizeId(options.googleAdsId) || window.__rpGoogleAdsTagInitialized;
  const businessId = options.businessId;
  if (!googleAdsId || businessId == null || businessId <= 0) return;

  const customerKey =
    options.customerId != null ? String(options.customerId) : "unknown";
  const signupParams = {
    funnel_step: "signup",
    status: "completed",
    ...(options.email?.trim() ? { email: options.email.trim() } : {}),
    ...(options.phone?.trim() ? { phone: options.phone.trim() } : {}),
    customer_id: customerKey,
  };

  await trackGoogleAdsStandardEventAsync("sign_up", {
    googleAdsId,
    businessId,
    funnelId: options.funnelId,
    gtagEventName: "sign_up",
    params: signupParams,
    dedupeKey: `sign_up|${googleAdsId}|${options.funnelId ?? ""}|${customerKey}`,
    eventSourceUrl: options.eventSourceUrl,
  });
}

export function trackGoogleAdsButtonClick(
  options: Omit<GoogleAdsTrackOptions, "conversionLabel"> = {},
): string | null {
  if (typeof window === "undefined") return null;

  const googleAdsId =
    normalizeId(options.googleAdsId) || window.__rpGoogleAdsTagInitialized;
  if (!googleAdsId) return null;

  const eventId = newEventId();
  const eventTime = Math.floor(Date.now() / 1000);
  const { gclid } = getGoogleAdsAttribution();
  const params = options.params;

  if (!options.skipBrowser && typeof window.gtag === "function") {
    if (params && Object.keys(params).length > 0) {
      window.gtag("event", "ButtonClicked", params);
    } else {
      window.gtag("event", "ButtonClicked");
    }
  }

  const businessId = options.businessId;
  if (
    !options.skipServer &&
    hasGoogleAdsGclid() &&
    businessId != null &&
    Number.isFinite(businessId) &&
    businessId > 0
  ) {
    void postGoogleFunnelEvent({
      eventId,
      eventName: "button_click",
      businessId,
      funnelId: options.funnelId,
      googleAdsId,
      eventTime,
      eventSourceUrl: options.eventSourceUrl ?? window.location.href,
      gclid,
      customData: params,
    }).catch(() => {});
  }

  return eventId;
}

export function trackGoogleAdsPageView(
  options: Omit<GoogleAdsTrackOptions, "conversionLabel"> = {},
): string | null {
  if (typeof window === "undefined") return null;

  const googleAdsId =
    normalizeId(options.googleAdsId) || window.__rpGoogleAdsTagInitialized;
  if (!googleAdsId) return null;

  const dedupeKey =
    options.dedupeKey?.trim() ||
    `page_view|${googleAdsId}|${options.funnelId ?? ""}|${window.location.pathname}`;

  if (sentGoogleAdsKeys.has(dedupeKey)) {
    return null;
  }
  sentGoogleAdsKeys.add(dedupeKey);

  const eventId = newEventId();
  const eventTime = Math.floor(Date.now() / 1000);
  const { gclid } = getGoogleAdsAttribution();

  if (!options.skipBrowser && typeof window.gtag === "function") {
    window.gtag("event", "page_view");
  }

  const step = options.params?.funnel_step;
  const pageParams =
    typeof step === "string" && step.length > 0
      ? { funnel_step: step }
      : options.params;

  const businessId = options.businessId;
  if (
    !options.skipServer &&
    hasGoogleAdsGclid() &&
    businessId != null &&
    Number.isFinite(businessId) &&
    businessId > 0
  ) {
    void postGoogleFunnelEvent({
      eventId,
      eventName: "page_view",
      businessId,
      funnelId: options.funnelId,
      googleAdsId,
      eventTime,
      eventSourceUrl: options.eventSourceUrl ?? window.location.href,
      gclid,
      customData: pageParams ?? undefined,
    }).catch(() => {});
  }

  return eventId;
}
