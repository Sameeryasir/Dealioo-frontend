import { hasAuthSession } from "@/app/lib/auth-session";
import { hasAnonymousFbclid } from "@/app/lib/product-meta-attribution";
import {
  getCachedBackendProductMetaAttribution,
  resolveProductMetaAttribution,
} from "@/app/lib/product-meta-attribution-store";
import { postProductMetaEvent } from "@/app/services/meta/track-product-meta-event";

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
    __rpProductMetaPixelInitialized?: string;
    __rpProductMetaPixelPageViewSent?: boolean;
    __rpProductMetaLandingPageViewSent?: boolean;
    __rpProductMetaPixelImpressionSent?: boolean;
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

export function getProductMetaPixelId(): string {
  return process.env.NEXT_PUBLIC_RP_META_PIXEL_ID?.trim() ?? "";
}

function newEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `rp_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
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

export function ensureProductMetaPixel(): boolean {
  if (typeof window === "undefined") return false;

  const id = getProductMetaPixelId();
  if (!id) return false;

  const fbq = ensureFbqStub();
  ensurePixelScript();

  if (window.__rpProductMetaPixelInitialized !== id) {
    fbq("set", "autoConfig", false, id);
    fbq("init", id);
    window.__rpProductMetaPixelInitialized = id;
  }

  return true;
}

type TrackOptions = {
  eventId?: string;
  params?: Record<string, unknown>;
  email?: string;
  phone?: string;
  externalId?: string;
  eventSourceUrl?: string;
  skipBrowser?: boolean;
  skipServer?: boolean;
  allowAuthenticatedConversion?: boolean;
};

export function shouldTrackProductMetaActivity(
  options?: Pick<TrackOptions, "allowAuthenticatedConversion">,
): boolean {
  if (typeof window === "undefined") return false;
  if (hasAuthSession() && !options?.allowAuthenticatedConversion) return false;
  return true;
}

function hasFbclidForProductMetaTracking(): boolean {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get("fbclid")?.trim()) return true;

  if (hasAuthSession()) {
    const backend = getCachedBackendProductMetaAttribution();
    return Boolean(backend?.fbclid?.trim());
  }

  return hasAnonymousFbclid();
}

export function trackProductMetaPixelEvent(
  eventName: string,
  options: TrackOptions = {},
): string | null {
  if (typeof window === "undefined") return null;

  if (
    !shouldTrackProductMetaActivity({
      allowAuthenticatedConversion: options.allowAuthenticatedConversion,
    })
  ) {
    return null;
  }

  if (!hasFbclidForProductMetaTracking()) {
    return null;
  }

  const name = eventName.trim();
  if (!name) return null;

  const id = getProductMetaPixelId();
  if (!id) return null;

  ensureProductMetaPixel();

  const eventId = options.eventId?.trim() || newEventId();
  const eventTime = Math.floor(Date.now() / 1000);
  const attribution = resolveProductMetaAttribution();
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

  if (!options.skipServer) {
    void postProductMetaEvent({
      eventId,
      eventName: name,
      eventTime,
      eventSourceUrl: options.eventSourceUrl ?? attribution.eventSourceUrl,
      fbp: attribution.fbp,
      fbc: attribution.fbc,
      fbclid: attribution.fbclid,
      email: options.email,
      phone: options.phone,
      externalId: options.externalId,
      customData: params,
    }).catch(() => {});
  }

  return eventId;
}

let landingPageViewSentThisVisit = false;

export function clearProductMetaLandingPageViewGuard() {
  landingPageViewSentThisVisit = false;
  if (typeof window !== "undefined") {
    window.__rpProductMetaLandingPageViewSent = false;
  }
}

export function stripLandingSectionHashFromUrl() {
  if (typeof window === "undefined") return;
  if (!window.location.hash) return;

  const clean = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, "", clean || "/");
}

export function trackProductMetaLandingPageViewOnce(options?: TrackOptions) {
  if (typeof window === "undefined") return null;

  if (landingPageViewSentThisVisit || window.__rpProductMetaLandingPageViewSent) {
    return null;
  }

  landingPageViewSentThisVisit = true;
  window.__rpProductMetaLandingPageViewSent = true;

  const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;

  return trackProductMetaPixelEvent("PageView", {
    ...options,
    allowAuthenticatedConversion: true,
    eventSourceUrl: options?.eventSourceUrl ?? cleanUrl,
  });
}

export function trackProductMetaPixelPageView(options?: TrackOptions) {
  return trackProductMetaLandingPageViewOnce(options);
}

export function trackProductLandingImpression() {
  if (typeof window === "undefined") return null;
  if (window.__rpProductMetaPixelImpressionSent) return null;
  window.__rpProductMetaPixelImpressionSent = true;
  return trackProductMetaPixelEvent("Impression", {
    params: { content_name: "landing" },
  });
}

export function trackProductButtonClick(
  buttonName: string,
  location = "landing",
) {
  const name = buttonName.trim();
  if (!name) return null;

  return trackProductMetaPixelEvent("ButtonClicked", {
    params: {
      button_name: name,
      content_name: location,
    },
  });
}

export function trackProductSectionViewed(
  section: string,
  location = "landing_nav",
) {
  const id = section.trim().replace(/^#/, "");
  if (!id) return null;

  const eventSourceUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}${window.location.search}#${id}`
      : undefined;

  return trackProductMetaPixelEvent("SectionViewed", {
    eventSourceUrl,
    params: {
      content_name: id,
      content_category: "landing_section",
      section: id,
      location,
    },
  });
}

export function sectionIdFromHref(href: string): string | null {
  const hashIndex = href.indexOf("#");
  if (hashIndex < 0) return null;
  const id = href.slice(hashIndex + 1).trim();
  return id || null;
}

export function trackProductFormSubmission(
  formName = "book_meeting",
  identity?: { email?: string; phone?: string },
) {
  return trackProductMetaPixelEvent("Lead", {
    params: {
      content_name: formName,
      content_category: "form_submission",
    },
    email: identity?.email,
    phone: identity?.phone,
  });
}

export function trackProductLead(
  source: string,
  identity?: { email?: string; phone?: string },
) {
  return trackProductMetaPixelEvent("Lead", {
    params: {
      content_name: source,
      content_category: "signup",
    },
    email: identity?.email,
    phone: identity?.phone,
  });
}

export function trackProductCompleteRegistration(identity?: {
  email?: string;
  phone?: string;
  externalId?: string;
  isNewCustomer?: boolean;
}) {
  if (identity?.isNewCustomer !== true) {
    return null;
  }

  return trackProductMetaPixelEvent("CompleteRegistration", {
    params: {
      content_name: "account_created",
      status: true,
    },
    email: identity?.email,
    phone: identity?.phone,
    externalId: identity?.externalId,
    allowAuthenticatedConversion: true,
  });
}

export function trackProductSubscription(params?: {
  planId?: string;
  billing?: string;
  value?: number;
  currency?: string;
  email?: string;
  externalId?: string;
}) {
  const payload: Record<string, unknown> = {
    content_name: params?.planId ?? "subscription",
    content_category: params?.billing ?? "plan",
  };
  if (params?.value != null) payload.value = params.value;
  if (params?.currency) payload.currency = params.currency;

  const shared = {
    email: params?.email,
    externalId: params?.externalId,
  };

  const conversionOpts = {
    params: payload,
    ...shared,
    allowAuthenticatedConversion: true,
  };

  void (async () => {
    if (hasAuthSession()) {
      const { syncProductMetaAttributionAfterAuth } = await import(
        "@/app/lib/sync-product-meta-attribution"
      );
      await syncProductMetaAttributionAfterAuth();
    }
    trackProductMetaPixelEvent("Subscribe", conversionOpts);
    trackProductMetaPixelEvent("Purchase", conversionOpts);
    trackProductMetaPixelEvent("SubscriptionStarted", conversionOpts);
  })();
}
