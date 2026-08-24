import {
  getFunnelMetaAttribution,
} from "@/app/lib/funnel-meta-attribution";
import { postFunnelMetaEvent } from "@/app/services/meta/track-funnel-meta-event";

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: (...args: unknown[]) => void;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
    __rpMetaPixelInitialized?: string;
  }
}

const STANDARD_META_EVENTS = new Set([
  "PageView",
  "Lead",
  "CompleteRegistration",
  "Purchase",
  "Subscribe",
  "StartTrial",
  "Contact",
  "Schedule",
  "SubmitApplication",
  "ViewContent",
  "Search",
  "AddToCart",
  "InitiateCheckout",
]);

const sentFunnelMetaKeys = new Set<string>();

export type FunnelMetaTrackOptions = {
  params?: Record<string, unknown>;
  pixelId?: string | null;
  businessId?: number | null;
  funnelId?: number | null;
  email?: string;
  phone?: string;
  externalId?: string;
  eventId?: string;
  eventSourceUrl?: string;
  skipBrowser?: boolean;
  skipServer?: boolean;
  dedupeKey?: string;
};

function newEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `fn_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function ensureFbqStub(): FbqFn {
  if (typeof window.fbq === "function") {
    return window.fbq;
  }

  const fbq = function (...args: unknown[]) {
    const self = fbq as FbqFn;
    if (self.callMethod) {
      self.callMethod(...args);
    } else {
      (self.queue = self.queue || []).push(args);
    }
  } as FbqFn;

  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;
  return fbq;
}

function ensurePixelScript() {
  if (document.getElementById("meta-pixel-base")) return;
  if (document.querySelector('script[src*="fbevents.js"]')) return;

  const script = document.createElement("script");
  script.id = "meta-pixel-base";
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}

export function ensureMetaPixel(pixelId: string | null | undefined): boolean {
  if (typeof window === "undefined") return false;

  const id = pixelId?.trim();
  if (!id) return false;

  const fbq = ensureFbqStub();
  ensurePixelScript();

  if (window.__rpMetaPixelInitialized !== id) {
    fbq("init", id);
    window.__rpMetaPixelInitialized = id;
  }

  return true;
}

export function trackMetaPixelEvent(
  eventName: string,
  options: FunnelMetaTrackOptions = {},
): string | null {
  if (typeof window === "undefined") return null;

  const name = eventName.trim();
  if (!name) return null;

  const id =
    options.pixelId?.trim() || window.__rpMetaPixelInitialized || "";
  if (!id) return null;

  const attribution = getFunnelMetaAttribution();

  const dedupeKey =
    options.dedupeKey?.trim() ||
    `${name}|${id}|${options.businessId ?? ""}|${options.funnelId ?? ""}|${window.location.pathname}`;
  const isRepeatable = name === "ButtonClicked";
  if (!isRepeatable) {
    if (sentFunnelMetaKeys.has(dedupeKey)) {
      return null;
    }
    sentFunnelMetaKeys.add(dedupeKey);
  }

  ensureMetaPixel(id);

  const eventId = options.eventId?.trim() || newEventId();
  const eventTime = Math.floor(Date.now() / 1000);
  const params = options.params;

  if (!options.skipBrowser) {
    const method = STANDARD_META_EVENTS.has(name)
      ? "trackSingle"
      : "trackSingleCustom";

    if (params && Object.keys(params).length > 0) {
      window.fbq?.(method, id, name, params, { eventID: eventId });
    } else {
      window.fbq?.(method, id, name, {}, { eventID: eventId });
    }
  }

  const businessId = options.businessId;
  if (
    !options.skipServer &&
    Boolean(attribution.fbclid?.trim()) &&
    businessId != null &&
    Number.isFinite(businessId) &&
    businessId > 0
  ) {
    void postFunnelMetaEvent({
      eventId,
      eventName: name,
      businessId,
      funnelId: options.funnelId,
      pixelId: id,
      eventTime,
      eventSourceUrl:
        options.eventSourceUrl ?? window.location.href,
      fbp: attribution.fbp,
      fbc: attribution.fbc,
      fbclid: attribution.fbclid,
      email: options.email,
      phone: options.phone,
      externalId: options.externalId,
      customData: params,
    }).catch((err) => {
      console.warn("[Funnel Meta] backend event track failed", err);
      if (!isRepeatable) {
        sentFunnelMetaKeys.delete(dedupeKey);
      }
    });
  } else if (!options.skipServer) {
    console.warn(
      "[Funnel Meta] skipped backend save — missing businessId",
      { eventName: name, pixelId: id, businessId },
    );
  }

  return eventId;
}

export function trackMetaPixelPageView(
  pixelId: string | null | undefined,
  options: Omit<FunnelMetaTrackOptions, "pixelId"> = {},
): string | null {
  return trackMetaPixelEvent("PageView", {
    ...options,
    pixelId,
  });
}

export function claimFunnelMetaEventKey(dedupeKey: string): boolean {
  if (sentFunnelMetaKeys.has(dedupeKey)) {
    return false;
  }
  sentFunnelMetaKeys.add(dedupeKey);
  return true;
}

export function releaseFunnelMetaEventKey(dedupeKey: string): void {
  sentFunnelMetaKeys.delete(dedupeKey);
}

export function createFunnelMetaEventId(): string {
  return newEventId();
}
