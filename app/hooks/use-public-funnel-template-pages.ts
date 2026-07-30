"use client";

import { useEffect, useState } from "react";
import { INITIAL_TEMPLATE_PAGES } from "@/app/components/crm-template-editor/template-data";
import type { TemplatePagesState } from "@/app/components/crm-template-editor/template-types";
import {
  loadFunnelTemplatePagesAsync,
  saveFunnelTemplatePagesAsync,
} from "@/app/components/crm-template-editor/funnel-template-storage";
import { isPositiveInt } from "@/app/lib/numbers";
import {
  mapFunnelApiPagesToTemplateState,
  type FunnelByCampaignResponse,
} from "@/app/services/funnel/get-funnel-by-campaign";
import { fetchPublicFunnelById } from "@/app/services/funnel/get-public-funnel";

export function usePublicFunnelTemplatePages(funnelIdSegment: string) {
  const [pages, setPages] = useState<TemplatePagesState>(INITIAL_TEMPLATE_PAGES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const funnelId = Number.parseInt(funnelIdSegment, 10);

    async function load() {
      setIsLoading(true);
      try {
        if (isPositiveInt(funnelId)) {
          const publicFunnel = await fetchPublicFunnelById(funnelId);
          if (cancelled) return;
          if (publicFunnel?.pages) {
            const mapped = mapFunnelApiPagesToTemplateState(
              publicFunnel.pages as NonNullable<
                FunnelByCampaignResponse["pages"]
              >,
            );
            setPages(mapped);
            void saveFunnelTemplatePagesAsync(funnelIdSegment, mapped);
            return;
          }
        }

        const cached = await loadFunnelTemplatePagesAsync(funnelIdSegment);
        if (cancelled) return;
        setPages(cached ?? INITIAL_TEMPLATE_PAGES);
      } catch {
        if (cancelled) return;
        try {
          const cached = await loadFunnelTemplatePagesAsync(funnelIdSegment);
          if (cancelled) return;
          setPages(cached ?? INITIAL_TEMPLATE_PAGES);
        } catch {
          if (!cancelled) setPages(INITIAL_TEMPLATE_PAGES);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [funnelIdSegment]);

  return { pages, isLoading };
}
