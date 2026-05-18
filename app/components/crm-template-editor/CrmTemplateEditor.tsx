"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, Save as SaveIcon } from "lucide-react";
import { DiscardChangesDialog } from "@/app/components/crm-template-editor/DiscardChangesDialog";
import {
  buildFunnelPublicPath,
  resolveFunnelRouteId,
} from "@/app/lib/funnel-public-path";
import { getFunnelCheckoutEmail } from "@/app/lib/funnel-checkout-storage";
import { parseNonNegativeInt, parsePositiveInt } from "@/app/lib/numbers";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import type { FunnelStripePaymentContext } from "@/app/components/funnel/FunnelStripePaymentForm";
import {
  buildCreateFunnelRequestBody,
  createFunnel,
} from "@/app/services/funnel/create-funnel";
import {
  useCampaignFunnelLoader,
  usePersistCampaignFunnelDraft,
} from "@/app/hooks/use-campaign-funnel-loader";
import { TemplateEditorSidebar } from "@/app/components/crm-template-editor/TemplateEditorSidebar";
import { TemplatePageList } from "@/app/components/crm-template-editor/TemplatePageList";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import type {
  TemplatePage,
  TemplatePageId,
  TemplatePagePatch,
  TemplatePagesState,
} from "@/app/components/crm-template-editor/template-types";

export type CrmTemplateEditorProps = {
  restaurantId?: number;
  campaignId?: number;
  initialPageId?: TemplatePageId;
  interactivePreview?: boolean;
};

export function CrmTemplateEditor({
  restaurantId,
  campaignId,
  initialPageId = "landing",
  interactivePreview = false,
}: CrmTemplateEditorProps) {
  const funnelLoader = useCampaignFunnelLoader(campaignId);

  const [pages, setPages] = useState<TemplatePagesState>(funnelLoader.pages);
  const [activeId, setActiveId] = useState<TemplatePageId>(initialPageId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  type SaveStatus = "idle" | "saving" | "saved" | "error";
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavId, setPendingNavId] = useState<TemplatePageId | null>(null);
  const editSnapshotRef = useRef<TemplatePagesState | null>(null);

  const { funnelId, isLoading: isLoadingFunnel, loadError, isHydrated } =
    funnelLoader;

  const activePage = pages[activeId];

  useEffect(() => {
    if (!isHydrated) return;
    setPages(funnelLoader.pages);
  }, [funnelLoader.pages, isHydrated]);

  usePersistCampaignFunnelDraft(campaignId, funnelId, pages, isHydrated);

  const handleSave = useCallback(async () => {
    if (campaignId == null) {
      setSaveStatus("error");
      setSaveError("Missing campaign id.");
      return;
    }
    const token = getSetupAccessToken().trim();
    if (!token) {
      setSaveStatus("error");
      setSaveError("You're signed out. Sign in again to save.");
      return;
    }
    setSaveStatus("saving");
    setSaveError(null);
    try {
      await createFunnel(
        token,
        buildCreateFunnelRequestBody(campaignId, pages, [activeId]),
      );
      setSaveStatus("saved");
      setIsDirty(false);
      editSnapshotRef.current = JSON.parse(JSON.stringify(pages)) as TemplatePagesState;
    } catch (e) {
      setSaveStatus("error");
      setSaveError(e instanceof Error ? e.message : "Could not save changes.");
    }
  }, [campaignId, pages, activeId]);

  const previewRestaurantId = useMemo(
    () =>
      restaurantId ??
      parsePositiveInt(process.env.NEXT_PUBLIC_FUNNEL_PAYMENT_RESTAURANT_ID),
    [restaurantId],
  );
  const previewCampaignId = useMemo(
    () => (campaignId != null && campaignId >= 1 ? campaignId : null),
    [campaignId],
  );

  const previewRouteId = useMemo(
    () => resolveFunnelRouteId(funnelId, previewCampaignId),
    [funnelId, previewCampaignId],
  );

  const previewSignupNextHref =
    interactivePreview && previewRouteId != null
      ? buildFunnelPublicPath({
          funnelId: previewRouteId,
          step: "payment",
          query: {
            restaurantId: previewRestaurantId,
            campaignId: previewCampaignId,
          },
        })
      : undefined;
  const previewSignupBackHref =
    interactivePreview && previewRouteId != null
      ? buildFunnelPublicPath({
          funnelId: previewRouteId,
          step: "landing",
          query: {
            restaurantId: previewRestaurantId,
            campaignId: previewCampaignId,
          },
        })
      : undefined;

  const paymentStripeCheckout = useMemo((): FunnelStripePaymentContext | null => {
    if (!interactivePreview || activeId !== "payment") {
      return null;
    }
    if (previewRestaurantId == null) {
      return null;
    }
    const email =
      getFunnelCheckoutEmail()?.trim() ||
      process.env.NEXT_PUBLIC_FUNNEL_PAYMENT_PREVIEW_EMAIL?.trim() ||
      null;
    if (!email) return null;

    const applicationFeeAmount = parseNonNegativeInt(
      process.env.NEXT_PUBLIC_FUNNEL_PAYMENT_APPLICATION_FEE,
      200,
    );
    const currency =
      process.env.NEXT_PUBLIC_FUNNEL_PAYMENT_CURRENCY?.trim().toLowerCase() ||
      "usd";

    if (funnelId == null || funnelId < 1) return null;

    return {
      funnelId,
      restaurantId: previewRestaurantId,
      applicationFeeAmount,
      currency,
      customerEmail: email,
    };
  }, [interactivePreview, previewRestaurantId, funnelId, activeId]);

  const pageList = useMemo(
    () =>
      (Object.keys(pages) as TemplatePageId[]).map((id) => ({
        id,
        label: pages[id].label,
      })),
    [pages],
  );

  const patchPage = useCallback((patch: TemplatePagePatch) => {
    setSaveStatus((s) => (s === "saved" ? "idle" : s));
    setSaveError(null);
    setIsDirty(true);
    setPages((prev) => {
      const updated = { ...prev[activeId], ...patch } as TemplatePage;
      const next: TemplatePagesState = {
        ...prev,
        [activeId]: updated,
      };
      if (activeId === "landing") {
        const L = next.landing;
        next.signup = {
          ...next.signup,
          imageUrl: L.imageUrl,
          imageScale: L.imageScale,
        } as TemplatePage;
        next.payment = {
          ...next.payment,
          imageUrl: L.imageUrl,
          imageScale: L.imageScale,
        } as TemplatePage;
      }
      return next;
    });
  }, [activeId]);

  const beginEditSession = useCallback(
    (id: TemplatePageId, sourcePages: TemplatePagesState) => {
      setActiveId(id);
      setSidebarOpen(true);
      setSaveStatus("idle");
      setSaveError(null);
      setIsDirty(false);
      editSnapshotRef.current = JSON.parse(
        JSON.stringify(sourcePages),
      ) as TemplatePagesState;
    },
    [],
  );

  const openEditorForPage = useCallback(
    (id: TemplatePageId) => {
      if (sidebarOpen && isDirty && id !== activeId) {
        setPendingNavId(id);
        return;
      }
      beginEditSession(id, pages);
    },
    [sidebarOpen, isDirty, activeId, pages, beginEditSession],
  );

  const requestSwitchActive = useCallback(
    (id: TemplatePageId) => {
      if (id === activeId) return;
      if (sidebarOpen && isDirty) {
        setPendingNavId(id);
        return;
      }
      if (sidebarOpen) {
        beginEditSession(id, pages);
      } else {
        setActiveId(id);
      }
    },
    [activeId, sidebarOpen, isDirty, pages, beginEditSession],
  );

  const cancelDiscard = useCallback(() => {
    setPendingNavId(null);
  }, []);

  const confirmDiscard = useCallback(() => {
    const target = pendingNavId;
    const snapshot = editSnapshotRef.current;
    if (snapshot) {
      setPages(snapshot);
    }
    setIsDirty(false);
    setSaveStatus("idle");
    setSaveError(null);
    setPendingNavId(null);
    if (target) {
      beginEditSession(target, snapshot ?? pages);
    }
  }, [pendingNavId, pages, beginEditSession]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-zinc-100 text-zinc-900">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 shadow-sm">
        <h1 className="min-w-0 truncate text-sm font-semibold sm:text-base">
          {activePage.label}
        </h1>
        {sidebarOpen ? (
          <div className="flex shrink-0 items-center gap-2">
            {saveStatus === "error" && saveError ? (
              <span
                className="hidden max-w-[14rem] truncate text-[0.7rem] font-medium text-red-700 sm:inline"
                title={saveError}
              >
                {saveError}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saveStatus === "saving"}
              className="group inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-black/90 bg-gradient-to-b from-zinc-800 to-black px-4 text-[0.78rem] font-semibold tracking-tight text-white shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_1px_2px_rgba(0,0,0,0.25)] ring-1 ring-white/5 transition-all duration-150 ease-out hover:from-zinc-700 hover:to-zinc-900 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_4px_12px_-2px_rgba(0,0,0,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 active:translate-y-px active:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              aria-live="polite"
            >
              <span className="flex size-4 shrink-0 items-center justify-center">
                {saveStatus === "saving" ? (
                  <Loader2
                    className="size-4 animate-spin text-white/90"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                ) : saveStatus === "error" ? (
                  <AlertCircle
                    className="size-4 text-rose-300"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                ) : (
                  <SaveIcon
                    className="size-4 text-white/90 transition-transform duration-150 group-hover:-translate-y-px"
                    strokeWidth={2}
                    aria-hidden
                  />
                )}
              </span>
              <span className="leading-none">
                {saveStatus === "saving"
                  ? "Saving"
                  : saveStatus === "saved"
                    ? "Saved"
                    : saveStatus === "error"
                      ? "Retry"
                      : "Save changes"}
              </span>
            </button>
          </div>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex min-h-0 w-[min(100%,20rem)] shrink-0 flex-col border-r border-zinc-200 bg-white shadow-sm">
          <TemplatePageList
            pages={pageList}
            activeId={activeId}
            onSelect={requestSwitchActive}
            onEditPage={openEditorForPage}
          />
          {sidebarOpen ? (
            <>
              <div className="flex shrink-0 items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2">
                <span className="truncate text-xs font-semibold text-zinc-700">
                  Editing: {activePage.label}
                </span>
              </div>
              <TemplateEditorSidebar
                key={activeId}
                page={activePage}
                onChange={patchPage}
              />
            </>
          ) : (
            <div className="min-h-0 flex-1 border-t border-zinc-100 bg-white" />
          )}
        </aside>

        <main
          className={`relative min-h-0 min-w-0 flex-1 overflow-y-auto bg-zinc-100/90 p-4 sm:p-6 ${
            interactivePreview
              ? "flex flex-col justify-center"
              : ""
          }`}
        >
          {loadError ? (
            <p
              className="mx-auto mb-3 max-w-[390px] rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
              role="status"
            >
              {loadError}
            </p>
          ) : null}
          {isLoadingFunnel ? (
            <div className="mx-auto flex max-w-[390px] items-center justify-center gap-2 py-16 text-sm text-zinc-500">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Loading funnel…
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[390px] shrink-0">
              <TemplatePreview
                page={activePage}
                landingPage={pages.landing}
                interactiveForms={interactivePreview}
                signupNextHref={previewSignupNextHref}
                signupBackHref={previewSignupBackHref}
                editorStepPreviewChrome
                paymentStripeCheckout={paymentStripeCheckout}
              />
            </div>
          )}
        </main>
      </div>

      <DiscardChangesDialog
        open={pendingNavId !== null}
        pageLabel={activePage.label}
        onCancel={cancelDiscard}
        onDiscard={confirmDiscard}
      />
    </div>
  );
}
