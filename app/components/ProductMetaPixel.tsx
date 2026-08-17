"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AUTH_SESSION_CHANGED_EVENT,
  hasAuthSession,
} from "@/app/lib/auth-session";
import { captureFbclidFromUrl } from "@/app/lib/product-meta-attribution";
import {
  clearProductMetaLandingPageViewGuard,
  stripLandingSectionHashFromUrl,
  trackProductMetaLandingPageViewOnce,
} from "@/app/lib/product-meta-pixel";
import { syncProductMetaAttributionAfterAuth } from "@/app/lib/sync-product-meta-attribution";

export function ProductMetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const skipAttributionSync =
    Boolean(pathname?.startsWith("/business/")) ||
    Boolean(pathname?.startsWith("/dashboard"));

  useEffect(() => {
    if (!hasAuthSession()) {
      captureFbclidFromUrl(search ? `?${search}` : undefined);
      return;
    }

    const params = new URLSearchParams(search ? `?${search}` : window.location.search);
    if (params.get("fbclid")?.trim()) {
      captureFbclidFromUrl(search ? `?${search}` : undefined);
      if (!skipAttributionSync) {
        void syncProductMetaAttributionAfterAuth();
      }
    }
  }, [search, skipAttributionSync]);

  useEffect(() => {
    if (skipAttributionSync) return;

    const syncIfAuthed = () => {
      if (hasAuthSession()) {
        void syncProductMetaAttributionAfterAuth();
      }
    };

    syncIfAuthed();
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncIfAuthed);
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncIfAuthed);
    };
  }, [pathname, skipAttributionSync]);

  useEffect(() => {
    if (pathname !== "/") {
      clearProductMetaLandingPageViewGuard();
      return;
    }

    stripLandingSectionHashFromUrl();
    trackProductMetaLandingPageViewOnce();
  }, [pathname]);

  return null;
}
