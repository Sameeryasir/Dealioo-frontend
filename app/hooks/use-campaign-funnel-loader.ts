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
  pagesBaseline: TemplatePagesState;
  funnelId: number | null;
  isLoading: boolean;
  loadError: string | null;
  isHydrated: boolean;
};

const IDLE: CampaignFunnelLoaderState = {
  pages: cloneTemplatePages(),
  pagesBaseline: cloneTemplatePages(),
  funnelId: null,
  isLoading: false,
  loadError: null,
  isHydrated: true,
};

function clonePages(pages: TemplatePagesState): TemplatePagesState {
  return JSON.parse(JSON.stringify(pages)) as TemplatePagesState;
}

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

    const local = await loadFunnelTemplatePagesAsync(String(id));
    if (local) {
      pages = local;
    }

    let loadedFrom: "api" | "indexeddb" | "defaults" = local
      ? "indexeddb"
      : "defaults";

    if (token) {
      try {
        const result = await loadTemplatePagesForCampaign(id, token, pages);
        pages = result.pages;
        funnelId = result.funnelId;
        loadedFrom = result.fromApi ? "api" : loadedFrom;

        console.group("[Funnel Editor] Loaded from API → syncing to IndexedDB");
        console.log("campaignId:", id);
        console.log("funnelId:", funnelId);
        console.log("api page keys:", result.apiPageKeys);
        console.log("pages shown in editor:", pages);
        console.groupEnd();

        await saveFunnelTemplatePagesAsync(String(id), pages);
        await mirrorFunnelTemplatePagesToFunnelId(String(id), funnelId, pages);

        const cached = await loadFunnelTemplatePagesAsync(String(id));
        console.log("[Funnel Editor] IndexedDB after sync (campaign key):", cached);
      } catch (e) {
        loadError =
          e instanceof Error ? e.message : "Could not load funnel from server.";
        const cached = await loadFunnelTemplatePagesAsync(String(id));
        if (cached) {
          pages = cached;
          loadedFrom = "indexeddb";
        }
        console.warn("[Funnel Editor] API failed, using IndexedDB cache", {
          campaignId: id,
          error: loadError,
          pages,
        });
      }
    } else {
      if (local) {
        pages = local;
        loadedFrom = "indexeddb";
      }
      loadError = "Sign in to load funnel data from the server.";
      console.warn("[Funnel Editor] No auth token, IndexedDB only", {
        campaignId: id,
        pages,
      });
    }

    if (signal.cancelled) return;

    console.log("[Funnel Editor] Ready to display", {
      campaignId: id,
      funnelId,
      loadedFrom,
      loadError,
    });

    setState({
      pages,
      pagesBaseline: clonePages(pages),
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
  canPersistDraft: boolean,
): void {
  useEffect(() => {
    if (!canPersistDraft || campaignId == null) return;

    const timer = window.setTimeout(() => {
      void (async () => {
        const key = String(campaignId);
        await saveFunnelTemplatePagesAsync(key, pages);
        await mirrorFunnelTemplatePagesToFunnelId(key, funnelId, pages);
      })();
    }, 320);

    return () => window.clearTimeout(timer);
  }, [campaignId, funnelId, pages, canPersistDraft]);
}
