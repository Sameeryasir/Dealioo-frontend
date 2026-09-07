"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadFunnelTemplatePagesAsync,
  mirrorFunnelTemplatePagesToFunnelId,
  saveFunnelTemplatePagesAsync,
} from "@/app/components/crm-template-editor/funnel-template-storage";
import { cloneTemplatePages } from "@/app/lib/clone-template-pages";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import {
  loadTemplatePagesForCampaign,
  peekCachedFunnelId,
} from "@/app/services/funnel/get-funnel-by-campaign";
import type { TemplatePagesState } from "@/app/components/crm-template-editor/template-types";

export type CampaignFunnelLoaderState = {
  pages: TemplatePagesState;
  pagesBaseline: TemplatePagesState;
  funnelId: number | null;
  published: boolean;
  isLoading: boolean;
  loadError: string | null;
  isHydrated: boolean;
  markSaved: (pages: TemplatePagesState, options?: { published?: boolean }) => void;
  setPublished: (published: boolean) => void;
};

const IDLE_PAGES = cloneTemplatePages();

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
  const [pages, setPages] = useState<TemplatePagesState>(IDLE_PAGES);
  const [pagesBaseline, setPagesBaseline] =
    useState<TemplatePagesState>(IDLE_PAGES);
  const [funnelId, setFunnelId] = useState<number | null>(null);
  const [published, setPublishedState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(true);

  const markSaved = useCallback(
    (savedPages: TemplatePagesState, options?: { published?: boolean }) => {
      const next = clonePages(savedPages);
      setPages(next);
      setPagesBaseline(clonePages(next));
      if (options?.published !== undefined) {
        setPublishedState(options.published);
      }
      if (campaignId != null) {
        persistFunnelPagesLocally(campaignId, funnelId, next);
      }
    },
    [campaignId, funnelId],
  );

  const setPublished = useCallback((next: boolean) => {
    setPublishedState(next);
  }, []);

  const load = useCallback(async (id: number, signal: { cancelled: boolean }) => {
    const token = getSetupAccessToken().trim();
    const local = await loadFunnelTemplatePagesAsync(String(id));
    const baseline = local ?? cloneTemplatePages();
    const cachedFunnelId = peekCachedFunnelId(id);

    if (local && !signal.cancelled) {
      setPages(baseline);
      setPagesBaseline(clonePages(baseline));
      setFunnelId(cachedFunnelId);
      setIsLoading(Boolean(token));
      setLoadError(null);
      setIsHydrated(true);
    } else if (!signal.cancelled) {
      setIsLoading(true);
      setLoadError(null);
      setIsHydrated(false);
    }

    if (!token) {
      if (signal.cancelled) return;
      setPages(baseline);
      setPagesBaseline(clonePages(baseline));
      setFunnelId(cachedFunnelId);
      setIsLoading(false);
      setLoadError(
        local ? null : "Sign in to load funnel data from the server.",
      );
      setIsHydrated(true);
      return;
    }

    try {
      const result = await loadTemplatePagesForCampaign(id, token, baseline);
      if (signal.cancelled) return;

      setPages(result.pages);
      setPagesBaseline(clonePages(result.pages));
      setFunnelId(result.funnelId ?? cachedFunnelId);
      setPublishedState(result.published);
      setIsLoading(false);
      setLoadError(null);
      setIsHydrated(true);

      persistFunnelPagesLocally(
        id,
        result.funnelId ?? cachedFunnelId,
        result.pages,
      );
    } catch (e) {
      const nextError =
        e instanceof Error ? e.message : "Could not load funnel from server.";
      if (signal.cancelled) return;

      const cached = local ?? (await loadFunnelTemplatePagesAsync(String(id)));
      setPages(cached ?? baseline);
      setPagesBaseline(clonePages(cached ?? baseline));
      setFunnelId(cachedFunnelId);
      setIsLoading(false);
      setLoadError(nextError);
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (campaignId == null) {
      setPages(IDLE_PAGES);
      setPagesBaseline(IDLE_PAGES);
      setFunnelId(null);
      setPublishedState(false);
      setIsLoading(false);
      setLoadError(null);
      setIsHydrated(true);
      return;
    }

    const signal = { cancelled: false };
    void load(campaignId, signal);
    return () => {
      signal.cancelled = true;
    };
  }, [campaignId, load]);

  return {
    pages,
    pagesBaseline,
    funnelId,
    published,
    isLoading,
    loadError,
    isHydrated,
    markSaved,
    setPublished,
  };
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
