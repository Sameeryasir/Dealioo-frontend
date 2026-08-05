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

  useEffect(() => {
    if (!hasAuthSession()) {
      captureFbclidFromUrl(search ? `?${search}` : undefined);
      return;
    }

    const params = new URLSearchParams(search ? `?${search}` : window.location.search);
    if (params.get("fbclid")?.trim()) {
      captureFbclidFromUrl(search ? `?${search}` : undefined);
      void syncProductMetaAttributionAfterAuth();
    }
  }, [search]);

  useEffect(() => {
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
  }, [pathname]);

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
