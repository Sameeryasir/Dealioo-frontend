const FBCLID_STORAGE_KEY = "rp_meta_fbclid";
const ANON_ATTRIBUTION_KEY = "rp_meta_anon_attribution";
const FBC_COOKIE = "_fbc";
const FBP_COOKIE = "_fbp";

export type ProductMetaAttributionSignals = {
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

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

function persistAnonymousPackage(signals: ProductMetaAttributionSignals) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      fbclid: signals.fbclid,
      fbc: signals.fbc,
      fbp: signals.fbp,
      capturedAt: signals.capturedAt ?? new Date().toISOString(),
      landingUrl: signals.eventSourceUrl ?? window.location.href,
    };
    localStorage.setItem(ANON_ATTRIBUTION_KEY, JSON.stringify(payload));
  } catch {}
}

function readAnonymousPackage(): ProductMetaAttributionSignals | null {
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

export function captureFbclidFromUrl(search?: string): string | null {
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
  } catch {}

  const existingFbc = readCookie(FBC_COOKIE);
  let fbc = existingFbc;
  if (!existingFbc) {
    const ts = Math.floor(Date.now() / 1000);
    fbc = `fb.1.${ts}.${fbclid}`;
    writeCookie(FBC_COOKIE, fbc, 90 * 24 * 60 * 60);
  }

  persistAnonymousPackage({
    fbclid,
    fbc: fbc ?? getFbc(),
    fbp: getFbp(),
    eventSourceUrl: window.location.href,
    capturedAt: new Date().toISOString(),
  });

  return fbclid;
}

export function getFbp(): string | null {
  return readCookie(FBP_COOKIE);
}

export function getFbc(): string | null {
  return readCookie(FBC_COOKIE);
}

export function getStoredFbclid(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(FBCLID_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getAnonymousProductMetaAttribution(): ProductMetaAttributionSignals {
  const packaged = readAnonymousPackage();
  const fbclid =
    captureFbclidFromUrl() ||
    packaged?.fbclid ||
    getStoredFbclid();
  const fbc = getFbc() || packaged?.fbc || null;
  const fbp = getFbp() || packaged?.fbp || null;

  if (fbclid || fbc || fbp) {
    persistAnonymousPackage({
      fbclid,
      fbc,
      fbp,
      capturedAt: packaged?.capturedAt ?? new Date().toISOString(),
      eventSourceUrl:
        packaged?.eventSourceUrl ??
        (typeof window !== "undefined" ? window.location.href : undefined),
    });
  }

  return {
    fbclid,
    fbp,
    fbc,
    capturedAt: packaged?.capturedAt ?? null,
    eventSourceUrl:
      packaged?.eventSourceUrl ??
      (typeof window !== "undefined" ? window.location.href : undefined),
  };
}

export function getProductMetaAttribution(): ProductMetaAttributionSignals {
  return getAnonymousProductMetaAttribution();
}

export function hasAnonymousProductMetaAttribution(): boolean {
  const a = getAnonymousProductMetaAttribution();
  return Boolean(a.fbclid || a.fbc || a.fbp);
}

export function hasAnonymousFbclid(): boolean {
  const a = getAnonymousProductMetaAttribution();
  return Boolean(a.fbclid?.trim());
}

export function clearAnonymousProductMetaAttribution(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(FBCLID_STORAGE_KEY);
    localStorage.removeItem(ANON_ATTRIBUTION_KEY);
  } catch {}

  deleteCookie(FBC_COOKIE);
  deleteCookie(FBP_COOKIE);
}
