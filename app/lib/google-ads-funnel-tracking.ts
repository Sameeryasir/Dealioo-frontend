import type { PublicFunnelResponse } from "@/app/services/funnel/get-public-funnel";

const GCLID_STORAGE_KEY = "rp_funnel_google_gclid";
const ANON_ATTRIBUTION_KEY = "rp_funnel_google_anon_attribution";
const GCLID_COOKIE = "rp_gclid";

export type GoogleAdsFunnelTracking = {
  tagId: string | null;
  signupConversionLabel: string | null;
  purchaseConversionLabel: string | null;
  leadConversionLabel: string | null;
};

export type GoogleAdsAttributionSignals = {
  gclid: string | null;
  capturedAt?: string | null;
  eventSourceUrl?: string;
};

export function readGoogleAdsFunnelTracking(
  publicFunnel: PublicFunnelResponse | null | undefined,
): GoogleAdsFunnelTracking {
  return {
    tagId: publicFunnel?.googleTagManagerId?.trim() || null,
    signupConversionLabel:
      publicFunnel?.googleAdsSignupConversionLabel?.trim() || null,
    purchaseConversionLabel:
      publicFunnel?.googleAdsPurchaseConversionLabel?.trim() || null,
    leadConversionLabel:
      publicFunnel?.googleAdsLeadConversionLabel?.trim() || null,
  };
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rest.join("=") || "");
    }
  }
  return null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function persistAnonymousPackage(signals: GoogleAdsAttributionSignals) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      ANON_ATTRIBUTION_KEY,
      JSON.stringify({
        gclid: signals.gclid,
        capturedAt: signals.capturedAt ?? new Date().toISOString(),
        landingUrl: signals.eventSourceUrl ?? window.location.href,
      }),
    );
  } catch {
    /* ignore */
  }
}

function readAnonymousPackage(): GoogleAdsAttributionSignals | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ANON_ATTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      gclid?: string | null;
      capturedAt?: string | null;
      landingUrl?: string | null;
    };
    return {
      gclid: parsed.gclid?.trim() || null,
      capturedAt: parsed.capturedAt ?? null,
      eventSourceUrl: parsed.landingUrl ?? undefined,
    };
  } catch {
    return null;
  }
}

export function captureGoogleAdsGclidFromUrl(search?: string): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(search ?? window.location.search);
  const gclid = params.get("gclid")?.trim();
  if (!gclid) {
    try {
      return localStorage.getItem(GCLID_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  try {
    localStorage.setItem(GCLID_STORAGE_KEY, gclid);
  } catch {
    /* ignore */
  }
  writeCookie(GCLID_COOKIE, gclid, 90 * 24 * 60 * 60);

  persistAnonymousPackage({
    gclid,
    eventSourceUrl: window.location.href,
    capturedAt: new Date().toISOString(),
  });

  return gclid;
}

export function getStoredGoogleAdsGclid(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(GCLID_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getGoogleAdsAttribution(): GoogleAdsAttributionSignals {
  const packaged = readAnonymousPackage();
  const gclid =
    captureGoogleAdsGclidFromUrl() ||
    packaged?.gclid ||
    getStoredGoogleAdsGclid() ||
    readCookie(GCLID_COOKIE);

  const currentUrl =
    typeof window !== "undefined" ? window.location.href : undefined;

  if (gclid) {
    persistAnonymousPackage({
      gclid,
      capturedAt: packaged?.capturedAt ?? new Date().toISOString(),
      eventSourceUrl: packaged?.eventSourceUrl ?? currentUrl,
    });
  }

  return {
    gclid,
    capturedAt: packaged?.capturedAt ?? null,
    eventSourceUrl: currentUrl,
  };
}

export function hasGoogleAdsGclid(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("gclid")?.trim()) return true;
  return Boolean(getGoogleAdsAttribution().gclid?.trim());
}
