const FBCLID_STORAGE_KEY = "rp_funnel_meta_fbclid";
const ANON_ATTRIBUTION_KEY = "rp_funnel_meta_anon_attribution";
const FBC_COOKIE = "_fbc";
const FBP_COOKIE = "_fbp";

export type FunnelMetaAttributionSignals = {
  fbclid: string | null;
  fbp: string | null;
  fbc: string | null;
  eventSourceUrl?: string;
  capturedAt?: string | null;
};

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

function persistAnonymousPackage(signals: FunnelMetaAttributionSignals) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      ANON_ATTRIBUTION_KEY,
      JSON.stringify({
        fbclid: signals.fbclid,
        fbc: signals.fbc,
        fbp: signals.fbp,
        capturedAt: signals.capturedAt ?? new Date().toISOString(),
        landingUrl: signals.eventSourceUrl ?? window.location.href,
      }),
    );
  } catch {
    /* ignore */
  }
}

function readAnonymousPackage(): FunnelMetaAttributionSignals | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ANON_ATTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      fbclid?: string | null;
      fbc?: string | null;
      fbp?: string | null;
      capturedAt?: string | null;
      landingUrl?: string | null;
    };
    return {
      fbclid: parsed.fbclid?.trim() || null,
      fbc: parsed.fbc?.trim() || null,
      fbp: parsed.fbp?.trim() || null,
      capturedAt: parsed.capturedAt ?? null,
      eventSourceUrl: parsed.landingUrl ?? undefined,
    };
  } catch {
    return null;
  }
}

export function captureFunnelFbclidFromUrl(search?: string): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(search ?? window.location.search);
  const fbclid = params.get("fbclid")?.trim();
  if (!fbclid) {
    try {
      return localStorage.getItem(FBCLID_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  try {
    localStorage.setItem(FBCLID_STORAGE_KEY, fbclid);
  } catch {
    /* ignore */
  }

  const existingFbc = readCookie(FBC_COOKIE);
  let fbc = existingFbc;
  if (!existingFbc) {
    const ts = Math.floor(Date.now() / 1000);
    fbc = `fb.1.${ts}.${fbclid}`;
    writeCookie(FBC_COOKIE, fbc, 90 * 24 * 60 * 60);
  }

  persistAnonymousPackage({
    fbclid,
    fbc: fbc ?? getFunnelFbc(),
    fbp: getFunnelFbp(),
    eventSourceUrl: window.location.href,
    capturedAt: new Date().toISOString(),
  });

  return fbclid;
}

export function getFunnelFbp(): string | null {
  return readCookie(FBP_COOKIE);
}

export function getFunnelFbc(): string | null {
  return readCookie(FBC_COOKIE);
}

export function getStoredFunnelFbclid(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(FBCLID_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getFunnelMetaAttribution(): FunnelMetaAttributionSignals {
  const packaged = readAnonymousPackage();
  const fbclid =
    captureFunnelFbclidFromUrl() ||
    packaged?.fbclid ||
    getStoredFunnelFbclid();
  const fbc = getFunnelFbc() || packaged?.fbc || null;
  const fbp = getFunnelFbp() || packaged?.fbp || null;

  const currentUrl =
    typeof window !== "undefined" ? window.location.href : undefined;

  if (fbclid || fbc || fbp) {
    persistAnonymousPackage({
      fbclid,
      fbc,
      fbp,
      capturedAt: packaged?.capturedAt ?? new Date().toISOString(),
      eventSourceUrl: packaged?.eventSourceUrl ?? currentUrl,
    });
  }

  return {
    fbclid,
    fbp,
    fbc,
    capturedAt: packaged?.capturedAt ?? null,
    eventSourceUrl: currentUrl,
  };
}

export function hasFunnelFbclid(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("fbclid")?.trim()) return true;
  return Boolean(getFunnelMetaAttribution().fbclid?.trim());
}
