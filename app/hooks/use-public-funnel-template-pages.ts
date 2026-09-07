"use client";

import { useEffect, useState } from "react";
import { INITIAL_TEMPLATE_PAGES } from "@/app/components/crm-template-editor/template-data";
import type { TemplatePagesState } from "@/app/components/crm-template-editor/template-types";
import {
  loadFunnelTemplatePagesAsync,
  saveFunnelTemplatePagesAsync,
} from "@/app/components/crm-template-editor/funnel-template-storage";
import {
  getFunnelPreviewTokenFromSearch,
  isFunnelDesignPreviewSearch,
} from "@/app/lib/funnel-public-path";
import { isPositiveInt } from "@/app/lib/numbers";
import {
  mapFunnelApiPagesToTemplateState,
  type FunnelByCampaignResponse,
} from "@/app/services/funnel/get-funnel-by-campaign";
import {
  fetchPublicFunnelById,
  type PublicFunnelResponse,
  type PublicFunnelStep,
} from "@/app/services/funnel/get-public-funnel";

function mergeStepPages(
  prev: TemplatePagesState,
  apiPages: NonNullable<FunnelByCampaignResponse["pages"]>,
): TemplatePagesState {
  const mapped = mapFunnelApiPagesToTemplateState(apiPages);
  return {
    landing: apiPages.landing ? mapped.landing : prev.landing,
    signup: apiPages.signup ? mapped.signup : prev.signup,
    payment: apiPages.payment ? mapped.payment : prev.payment,
    confirmation: apiPages.confirmation
      ? mapped.confirmation
      : prev.confirmation,
  };
}

export function usePublicFunnelTemplatePages(
  funnelIdSegment: string,
  businessId?: number | null,
  step: PublicFunnelStep = "landing",
) {
  const [pages, setPages] = useState<TemplatePagesState>(INITIAL_TEMPLATE_PAGES);
  const [isLoading, setIsLoading] = useState(true);
  const [publicFunnel, setPublicFunnel] = useState<PublicFunnelResponse | null>(
    null,
  );
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const funnelId = Number.parseInt(funnelIdSegment, 10);
    const search =
      typeof window !== "undefined" ? window.location.search : "";
    const isPreview = isFunnelDesignPreviewSearch(search);
    const previewToken = getFunnelPreviewTokenFromSearch(search);
    const checkoutToken =
      new URLSearchParams(
        search.startsWith("?") ? search.slice(1) : search,
      ).get("checkoutToken")?.trim() || null;

    async function load() {
      setIsLoading(true);
      setUnavailable(false);
      try {
        const cached = await loadFunnelTemplatePagesAsync(funnelIdSegment);
        if (!cancelled && cached) {
          setPages(cached);
        }

        if (isPositiveInt(funnelId)) {
          const loaded = await fetchPublicFunnelById(funnelId, {
            businessId,
            step,
            preview: isPreview,
            previewToken,
            checkoutToken,
          });
          if (cancelled) return;
          if (!loaded) {
            setPublicFunnel(null);
            setUnavailable(true);
            if (!isPreview) {
              setPages(INITIAL_TEMPLATE_PAGES);
            } else if (cached) {
              setPages(cached);
            }
            return;
          }
          setPublicFunnel(loaded);
          setUnavailable(false);
          if (loaded?.pages) {
            const apiPages = loaded.pages as NonNullable<
              FunnelByCampaignResponse["pages"]
            >;
            setPages((prev) => {
              const next = mergeStepPages(prev, apiPages);
              void saveFunnelTemplatePagesAsync(funnelIdSegment, next);
              return next;
            });
            return;
          }
        }

        if (cancelled) return;
        setPublicFunnel(null);
        setPages(cached ?? INITIAL_TEMPLATE_PAGES);
      } catch {
        if (cancelled) return;
        try {
          const cached = await loadFunnelTemplatePagesAsync(funnelIdSegment);
          if (cancelled) return;
          setPublicFunnel(null);
          setPages(cached ?? INITIAL_TEMPLATE_PAGES);
        } catch {
          if (!cancelled) {
            setPublicFunnel(null);
            setPages(INITIAL_TEMPLATE_PAGES);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [funnelIdSegment, businessId, step]);

  return { pages, isLoading, publicFunnel, unavailable };
}
