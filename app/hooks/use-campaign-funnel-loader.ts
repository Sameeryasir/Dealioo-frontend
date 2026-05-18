"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadFunnelTemplatePagesAsync,
  mirrorFunnelTemplatePagesToFunnelId,
  saveFunnelTemplatePagesAsync,
} from "@/app/components/crm-template-editor/funnel-template-storage";
import { cloneTemplatePages } from "@/app/lib/clone-template-pages";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { loadTemplatePagesForCampaign } from "@/app/services/funnel/get-funnel-by-campaign";
import type { TemplatePagesState } from "@/app/components/crm-template-editor/template-types";

export type CampaignFunnelLoaderState = {
  pages: TemplatePagesState;
  funnelId: number | null;
  isLoading: boolean;
  loadError: string | null;
  isHydrated: boolean;
};

const IDLE: CampaignFunnelLoaderState = {
  pages: cloneTemplatePages(),
  funnelId: null,
  isLoading: false,
  loadError: null,
  isHydrated: true,
};

export function useCampaignFunnelLoader(
  campaignId: number | undefined,
): CampaignFunnelLoaderState {
  const [state, setState] = useState<CampaignFunnelLoaderState>(() =>
    campaignId == null
      ? IDLE
      : {
          ...IDLE,
          isLoading: true,
          isHydrated: false,
        },
  );

  const load = useCallback(async (id: number, signal: { cancelled: boolean }) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      loadError: null,
      isHydrated: false,
    }));

    const token = getSetupAccessToken().trim();
    let pages = cloneTemplatePages();
    let funnelId: number | null = null;
    let loadError: string | null = null;

    if (token) {
      try {
        const result = await loadTemplatePagesForCampaign(id, token);
        pages = result.pages;
        funnelId = result.funnelId;

        await saveFunnelTemplatePagesAsync(String(id), pages);
        await mirrorFunnelTemplatePagesToFunnelId(String(id), funnelId, pages);

        if (!result.fromApi) {
          const local = await loadFunnelTemplatePagesAsync(String(id));
          if (local) pages = local;
        }
      } catch (e) {
        loadError =
          e instanceof Error ? e.message : "Could not load funnel from server.";
        const local = await loadFunnelTemplatePagesAsync(String(id));
        if (local) pages = local;
      }
    } else {
      const local = await loadFunnelTemplatePagesAsync(String(id));
      if (local) pages = local;
      loadError = "Sign in to load funnel data from the server.";
    }

    if (signal.cancelled) return;

    setState({
      pages,
      funnelId,
      isLoading: false,
      loadError,
      isHydrated: true,
    });
  }, []);

  useEffect(() => {
    if (campaignId == null) {
      setState(IDLE);
      return;
    }

    const signal = { cancelled: false };
    void load(campaignId, signal);
    return () => {
      signal.cancelled = true;
    };
  }, [campaignId, load]);

  return state;
}

export function usePersistCampaignFunnelDraft(
  campaignId: number | undefined,
  funnelId: number | null,
  pages: TemplatePagesState,
  isHydrated: boolean,
): void {
  useEffect(() => {
    if (!isHydrated || campaignId == null) return;

    const timer = window.setTimeout(() => {
      void (async () => {
        const key = String(campaignId);
        await saveFunnelTemplatePagesAsync(key, pages);
        await mirrorFunnelTemplatePagesToFunnelId(key, funnelId, pages);
      })();
    }, 320);

    return () => window.clearTimeout(timer);
  }, [campaignId, funnelId, pages, isHydrated]);
}
