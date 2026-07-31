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

export function trackMetaPixelPageView(pixelId: string | null | undefined) {
  if (!ensureMetaPixel(pixelId)) return;
  window.fbq?.("track", "PageView");
}

export function trackMetaPixelEvent(
  eventName: string,
  params?: Record<string, unknown>,
  pixelId?: string | null,
) {
  if (typeof window === "undefined") return;

  const ready =
    Boolean(window.__rpMetaPixelInitialized) || ensureMetaPixel(pixelId);
  if (!ready) return;

  const name = eventName.trim();
  if (!name) return;

  if (params && Object.keys(params).length > 0) {
    window.fbq?.("track", name, params);
  } else {
    window.fbq?.("track", name);
  }
}
