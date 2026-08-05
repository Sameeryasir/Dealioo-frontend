import {
  clearAnonymousProductMetaAttribution,
  getAnonymousProductMetaAttribution,
  hasAnonymousFbclid,
} from "@/app/lib/product-meta-attribution";
import {
  clearBackendProductMetaAttributionCache,
  getBackendAttributionLoadPromise,
  getCachedBackendProductMetaAttribution,
  isBackendProductMetaAttributionCacheReady,
  setBackendAttributionLoadPromise,
  setBackendProductMetaAttributionCache,
  type BackendFacebookAttribution,
} from "@/app/lib/product-meta-attribution-store";
import { hasAuthSession } from "@/app/lib/auth-session";
import {
  claimProductMetaAttribution,
  fetchProductMetaAttribution,
} from "@/app/services/meta/claim-product-meta-attribution";

let syncGeneration = 0;

export async function syncProductMetaAttributionAfterAuth(): Promise<BackendFacebookAttribution | null> {
  if (typeof window === "undefined" || !hasAuthSession()) {
    return null;
  }

  if (isBackendProductMetaAttributionCacheReady()) {
    const cached = getCachedBackendProductMetaAttribution();
    if (cached?.hasAttribution) return cached;
    if (!hasAnonymousFbclid()) return cached;
    clearBackendProductMetaAttributionCache();
  }

  const existing = getBackendAttributionLoadPromise();
  if (existing) return existing;

  const generation = ++syncGeneration;

  const promise = (async (): Promise<BackendFacebookAttribution | null> => {
    try {
      if (hasAnonymousFbclid()) {
        const anon = getAnonymousProductMetaAttribution();
        const claimResult = await claimProductMetaAttribution({
          fbclid: anon.fbclid,
          fbc: anon.fbc,
          fbp: anon.fbp,
          landingUrl: anon.eventSourceUrl,
          source: "anonymous_browser_claim",
        });

        if (generation !== syncGeneration) return null;

        setBackendProductMetaAttributionCache(claimResult.attribution);
        clearAnonymousProductMetaAttribution();
        return claimResult.attribution;
      }

      const attribution = await fetchProductMetaAttribution();
      if (generation !== syncGeneration) return null;

      setBackendProductMetaAttributionCache(attribution);
      clearAnonymousProductMetaAttribution();
      return attribution;
    } catch {
      return null;
    } finally {
      if (generation === syncGeneration) {
        setBackendAttributionLoadPromise(null);
      }
    }
  })();

  setBackendAttributionLoadPromise(promise);
  return promise;
}

export function resetProductMetaAttributionOnLogout(): void {
  syncGeneration += 1;
  setBackendAttributionLoadPromise(null);
  clearBackendProductMetaAttributionCache();
  clearAnonymousProductMetaAttribution();
}
