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

function persistFunnelPagesLocally(
  campaignId: number,
  funnelId: number | null,
  pages: TemplatePagesState,
): void {
  const key = String(campaignId);
  void saveFunnelTemplatePagesAsync(key, pages).then(() =>
    mirrorFunnelTemplatePagesToFunnelId(key, funnelId, pages),
  );
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
    const token = getSetupAccessToken().trim();
    const local = await loadFunnelTemplatePagesAsync(String(id));
    const baseline = local ?? cloneTemplatePages();

    if (local && !signal.cancelled) {
      setState({
        pages: local,
        pagesBaseline: clonePages(local),
        funnelId: null,
        isLoading: Boolean(token),
        loadError: null,
        isHydrated: true,
      });
    } else if (!signal.cancelled) {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        loadError: null,
        isHydrated: false,
      }));
    }

    if (!token) {
      if (signal.cancelled) return;
      setState({
        pages: baseline,
        pagesBaseline: clonePages(baseline),
        funnelId: null,
        isLoading: false,
        loadError: local
          ? null
          : "Sign in to load funnel data from the server.",
        isHydrated: true,
      });
      return;
    }

    try {
      const result = await loadTemplatePagesForCampaign(id, token, baseline);
      if (signal.cancelled) return;

      setState({
        pages: result.pages,
        pagesBaseline: clonePages(result.pages),
        funnelId: result.funnelId,
        isLoading: false,
        loadError: null,
        isHydrated: true,
      });

      persistFunnelPagesLocally(id, result.funnelId, result.pages);
    } catch (e) {
      const loadError =
        e instanceof Error ? e.message : "Could not load funnel from server.";
      if (signal.cancelled) return;

      const cached = local ?? (await loadFunnelTemplatePagesAsync(String(id)));
      setState({
        pages: cached ?? baseline,
        pagesBaseline: clonePages(cached ?? baseline),
        funnelId: null,
        isLoading: false,
        loadError: cached ? loadError : loadError,
        isHydrated: true,
      });
    }
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
      persistFunnelPagesLocally(campaignId, funnelId, pages);
    }, 320);

    return () => window.clearTimeout(timer);
  }, [campaignId, funnelId, pages, canPersistDraft]);
}
