"use client";

import {
  scheduleFunnelEditorIdleWarmup,
  warmupFunnelEditor,
} from "@/app/lib/funnel-editor-warmup";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export function useFunnelEditorWarmup(
  enabled: boolean,
  href: string | null | undefined,
) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !href) return;
    return scheduleFunnelEditorIdleWarmup(
      (nextHref) => router.prefetch(nextHref),
      href,
    );
  }, [enabled, href, router]);

  return useCallback(() => {
    if (!href) return;
    warmupFunnelEditor((nextHref) => router.prefetch(nextHref), href);
  }, [href, router]);
}
