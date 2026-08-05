import { hasAuthSession } from "@/app/lib/auth-session";
import {
  getAnonymousProductMetaAttribution,
  type ProductMetaAttributionSignals,
} from "@/app/lib/product-meta-attribution";

export type BackendFacebookAttribution = {
  hasAttribution: boolean;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  capturedAt: string | null;
  source: string | null;
  landingUrl: string | null;
};

let cachedAttribution: BackendFacebookAttribution | null = null;
let cacheLoaded = false;
let loadPromise: Promise<BackendFacebookAttribution | null> | null = null;

export function setBackendProductMetaAttributionCache(
  value: BackendFacebookAttribution | null,
): void {
  cachedAttribution = value;
  cacheLoaded = true;
}

export function clearBackendProductMetaAttributionCache(): void {
  cachedAttribution = null;
  cacheLoaded = false;
  loadPromise = null;
}

export function getCachedBackendProductMetaAttribution(): BackendFacebookAttribution | null {
  return cacheLoaded ? cachedAttribution : null;
}

export function isBackendProductMetaAttributionCacheReady(): boolean {
  return cacheLoaded;
}

export function setBackendAttributionLoadPromise(
  promise: Promise<BackendFacebookAttribution | null> | null,
): void {
  loadPromise = promise;
}

export function getBackendAttributionLoadPromise(): Promise<BackendFacebookAttribution | null> | null {
  return loadPromise;
}

export function resolveProductMetaAttribution(): ProductMetaAttributionSignals {
  if (typeof window === "undefined") {
    return { fbclid: null, fbp: null, fbc: null };
  }

  if (hasAuthSession()) {
    const backend = getCachedBackendProductMetaAttribution();
    if (backend?.hasAttribution) {
      return {
        fbclid: backend.fbclid,
        fbp: backend.fbp,
        fbc: backend.fbc,
        eventSourceUrl: window.location.href,
        capturedAt: backend.capturedAt,
      };
    }
    return {
      fbclid: null,
      fbp: null,
      fbc: null,
      eventSourceUrl: window.location.href,
    };
  }

  return getAnonymousProductMetaAttribution();
}
