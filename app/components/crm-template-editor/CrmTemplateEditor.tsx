"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { CanvasWorkspace } from "@/app/components/crm-template-editor/CanvasWorkspace";
import { DiscardChangesDialog } from "@/app/components/crm-template-editor/DiscardChangesDialog";
import { EditorLeftSidebar } from "@/app/components/crm-template-editor/EditorLeftSidebar";
import { EditorShell } from "@/app/components/crm-template-editor/EditorShell";
import { SettingsPanel } from "@/app/components/crm-template-editor/SettingsPanel";
import { TopNavigation } from "@/app/components/crm-template-editor/TopNavigation";
import { FunnelTrackingLinkDialog } from "@/app/components/campaign/FunnelTrackingLinkDialog";
import type { EditorSaveStatus } from "@/app/components/crm-template-editor/editor-status";
import type { FunnelPageDesignTemplate } from "@/app/components/crm-template-editor/funnel-page-templates";
import { getLandingDesignStyle, syncCheckoutThemeWithLandingDesign } from "@/app/components/crm-template-editor/landing-designs/registry";
import { DEFAULT_CHECKOUT_THEME } from "@/app/components/crm-template-editor/checkout-template-types";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import {
  buildFunnelLandingTrackingUrl,
  buildFunnelPaymentConfirmationPath,
  buildFunnelPublicPath,
  openFunnelDesignPreview,
  resolveFunnelRouteId,
} from "@/app/lib/funnel-public-path";
import { automationEase } from "@/app/lib/motion";
import {
  parseCampaignPrice,
  type CampaignPricing,
} from "@/app/lib/campaign-price";
import { parsePositiveInt } from "@/app/lib/numbers";
import { isGrowthAiSubscription } from "@/app/lib/plan-limits";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import type { FunnelStripePaymentContext } from "@/app/components/funnel/FunnelStripePaymentForm";
import { mergePagesForSave } from "@/app/lib/merge-funnel-pages";
import { applyCampaignOfferToLandingPages } from "@/app/lib/clone-template-pages";
import {
  buildCreateFunnelRequestBody,
  createFunnel,
} from "@/app/services/funnel/create-funnel";
import {
  mergeApiPagesIntoTemplateState,
  type FunnelByCampaignResponse,
} from "@/app/services/funnel/get-funnel-by-campaign";
import {
  useCampaignFunnelLoader,
  usePersistCampaignFunnelDraft,
} from "@/app/hooks/use-campaign-funnel-loader";
import { useCampaignByIdQuery } from "@/app/hooks/use-campaigns-by-business-query";
import { useEditorKeyboardShortcuts } from "@/app/hooks/use-editor-keyboard-shortcuts";
import { useMyUserSubscription } from "@/app/hooks/use-my-user-subscription";
import { useUndoRedo } from "@/app/hooks/use-undo-redo";
import { funnelPageOrderForCampaignType } from "@/app/components/crm-template-editor/TemplatePageList";
import type {
  LandingTemplatePage,
  PaymentTemplatePage,
  SignUpTemplatePage,
  TemplatePage,
  TemplatePageId,
  TemplatePagePatch,
  TemplatePagesState,
} from "@/app/components/crm-template-editor/template-types";

const FunnelAiAssistantSidebar = dynamic(
  () =>
    import("@/app/components/crm-template-editor/FunnelAiAssistantSidebar").then(
      (mod) => mod.FunnelAiAssistantSidebar,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[12rem] items-center justify-center bg-white text-sm text-slate-500">
        Loading AI assistant…
      </div>
    ),
  },
);

const FunnelPageTemplateGallery = dynamic(
  () =>
    import("@/app/components/crm-template-editor/FunnelPageTemplateGallery").then(
      (mod) => mod.FunnelPageTemplateGallery,
    ),
  { ssr: false },
);

export type CrmTemplateEditorProps = {
  businessId?: number;
  campaignId?: number;
  campaignName?: string;
  campaignPrice?: number | string;
  campaignOriginalPrice?: number | string | null;
  campaignOffer?: string;
  campaignType?: "prepaid" | "postpaid";
  initialPageId?: TemplatePageId;
  interactivePreview?: boolean;
  embedded?: boolean;
};

export function CrmTemplateEditor({
  businessId,
  campaignId,
  campaignName,
  campaignPrice,
  campaignOriginalPrice,
  campaignOffer,
  campaignType: campaignTypeProp,
  initialPageId = "landing",
  interactivePreview = false,
  embedded = false,
}: CrmTemplateEditorProps) {
  const { subscription } = useMyUserSubscription();
  const showAiAssistant = isGrowthAiSubscription(subscription);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  const { data: campaignDetail } = useCampaignByIdQuery(campaignId);
  const campaignType =
    campaignTypeProp ?? campaignDetail?.campaignType ?? undefined;
  const isPostpaid = campaignType === "postpaid";
  const pageOrder = funnelPageOrderForCampaignType(campaignType);

  const funnelLoader = useCampaignFunnelLoader(campaignId);
  const {
    funnelId,
    published,
    isLoading: isLoadingFunnel,
    loadError,
    isHydrated,
    pagesBaseline,
    markSaved,
  } = funnelLoader;

  const {
    present: pages,
    commit: commitPages,
    reset: resetPagesHistory,
    undo,
    redo,
    canUndo,
  } = useUndoRedo<TemplatePagesState>(funnelLoader.pages);

  const [activeId, setActiveId] = useState<TemplatePageId>(initialPageId);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<EditorSaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavId, setPendingNavId] = useState<TemplatePageId | null>(null);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [trackingCopyDone, setTrackingCopyDone] = useState(false);
  const [trackingPortalReady, setTrackingPortalReady] = useState(false);
  const editSnapshotRef = useRef<TemplatePagesState | null>(null);

  const activePage = pages[activeId];

  const resolvedCampaignOffer =
    campaignOffer?.trim() || campaignDetail?.offer?.trim() || "";

  useEffect(() => {
    if (!isHydrated) return;
    resetPagesHistory(
      applyCampaignOfferToLandingPages(
        funnelLoader.pages,
        resolvedCampaignOffer,
      ),
    );
    setIsDirty(false);
    setSaveStatus("idle");
  }, [
    isHydrated,
    funnelLoader.pages,
    resolvedCampaignOffer,
    resetPagesHistory,
  ]);

  usePersistCampaignFunnelDraft(
    campaignId,
    funnelId,
    pages,
    isHydrated && !isLoadingFunnel,
  );

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
      const pagesToSave = mergePagesForSave(pagesBaseline, pages);
      await createFunnel(
        token,
        buildCreateFunnelRequestBody(campaignId, pagesToSave, {
          includePaymentPage: !isPostpaid,
        }),
      );
      markSaved(pagesToSave);
      resetPagesHistory(pagesToSave);
      setSaveStatus("saved");
      setIsDirty(false);
      editSnapshotRef.current = JSON.parse(
        JSON.stringify(pagesToSave),
      ) as TemplatePagesState;
    } catch (e) {
      setSaveStatus("error");
      setSaveError(e instanceof Error ? e.message : "Could not save changes.");
    }
  }, [
    campaignId,
    pages,
    pagesBaseline,
    isPostpaid,
    markSaved,
    resetPagesHistory,
  ]);

  const handleSetPublished = useCallback(
    async (nextPublished: boolean) => {
      if (campaignId == null) {
        setSaveStatus("error");
        setSaveError("Missing campaign id.");
        return;
      }
      const token = getSetupAccessToken().trim();
      if (!token) {
        setSaveStatus("error");
        setSaveError("You're signed out. Sign in again to publish.");
        return;
      }
      setSaveStatus("saving");
      setSaveError(null);
      try {
        const pagesToSave = mergePagesForSave(pagesBaseline, pages);
        await createFunnel(
          token,
          buildCreateFunnelRequestBody(campaignId, pagesToSave, {
            includePaymentPage: !isPostpaid,
            published: nextPublished,
          }),
        );
        markSaved(pagesToSave, { published: nextPublished });
        resetPagesHistory(pagesToSave);
        setSaveStatus("saved");
        setIsDirty(false);
        editSnapshotRef.current = JSON.parse(
          JSON.stringify(pagesToSave),
        ) as TemplatePagesState;
      } catch (e) {
        setSaveStatus("error");
        setSaveError(
          e instanceof Error
            ? e.message
            : nextPublished
              ? "Could not publish funnel."
              : "Could not unpublish funnel.",
        );
      }
    },
    [
      campaignId,
      pages,
      pagesBaseline,
      isPostpaid,
      markSaved,
      resetPagesHistory,
    ],
  );

  useEffect(() => {
    if (!isPostpaid) return;
    if (activeId !== "payment") return;
    setActiveId("landing");
  }, [isPostpaid, activeId]);

  useEditorKeyboardShortcuts({
    onSave: () => void handleSave(),
    onUndo: undo,
    onRedo: redo,
  });

  const previewBusinessId = useMemo(
    () =>
      businessId ??
      parsePositiveInt(process.env.NEXT_PUBLIC_FUNNEL_PAYMENT_RESTAURANT_ID) ??
      parsePositiveInt(process.env.NEXT_PUBLIC_FUNNEL_PAYMENT_BUSINESS_ID),
    [businessId],
  );
  const previewCampaignId = useMemo(
    () => (campaignId != null && campaignId >= 1 ? campaignId : null),
    [campaignId],
  );
  const previewRouteId = useMemo(
    () => resolveFunnelRouteId(funnelId),
    [funnelId],
  );

  const campaignPricing = useMemo((): CampaignPricing => {
    const subtotal = parseCampaignPrice(campaignPrice);
    const originalPrice = parseCampaignPrice(
      campaignOriginalPrice ?? campaignDetail?.originalPrice,
    );
    return {
      subtotal,
      originalPrice,
      fees: 0,
      offer: resolvedCampaignOffer || null,
    };
  }, [
    campaignPrice,
    campaignOriginalPrice,
    campaignDetail?.originalPrice,
    resolvedCampaignOffer,
  ]);

  const landingTrackingUrl = useMemo(() => {
    return buildFunnelLandingTrackingUrl({
      funnelId,
      campaignId,
      businessId: previewBusinessId,
      price: campaignPrice,
      originalPrice: campaignPricing.originalPrice,
      campaignType:
        campaignType === "prepaid" || campaignType === "postpaid"
          ? campaignType
          : undefined,
    });
  }, [
    funnelId,
    campaignId,
    previewBusinessId,
    campaignPrice,
    campaignPricing.originalPrice,
    campaignType,
  ]);

  const campaignTitleForTracking =
    campaignName?.trim() || resolvedCampaignOffer || "Campaign";

  useEffect(() => {
    setTrackingPortalReady(true);
  }, []);

  useEffect(() => {
    if (!trackingDialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTrackingDialogOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [trackingDialogOpen]);

  const handleOpenTrackingLink = useCallback(() => {
    setTrackingCopyDone(false);
    setTrackingDialogOpen(true);
  }, []);

  const handleCopyTrackingUrl = useCallback(async () => {
    if (!landingTrackingUrl) return;
    try {
      await navigator.clipboard.writeText(landingTrackingUrl);
      setTrackingCopyDone(true);
      window.setTimeout(() => setTrackingCopyDone(false), 2000);
    } catch {
      setTrackingCopyDone(false);
    }
  }, [landingTrackingUrl]);

  const aiPagePayload = useMemo((): Record<string, unknown> | undefined => {
    if (campaignId == null || campaignId < 1) return undefined;
    const allPages = buildCreateFunnelRequestBody(campaignId, pages, {
      includePaymentPage: !isPostpaid,
    }).pages as Record<string, unknown>;
    const activePage = allPages[activeId];
    if (
      typeof activePage !== "object" ||
      activePage === null ||
      Array.isArray(activePage)
    ) {
      return {};
    }
    return activePage as Record<string, unknown>;
  }, [campaignId, pages, activeId, isPostpaid]);

  const handleAiSchemaApplied = useCallback(
    (schema: Record<string, unknown>) => {
      const apiPages = schema as NonNullable<FunnelByCampaignResponse["pages"]>;
      const nextPages = mergeApiPagesIntoTemplateState(pages, apiPages);
      commitPages(nextPages);

      const alreadyPersisted = funnelId != null && funnelId >= 1;
      if (alreadyPersisted) {
        setIsDirty(false);
        setSaveStatus("saved");
        editSnapshotRef.current = JSON.parse(
          JSON.stringify(nextPages),
        ) as TemplatePagesState;
      } else {
        setIsDirty(true);
        setSaveStatus("idle");
      }
      setSaveError(null);
    },
    [commitPages, funnelId, pages],
  );

  const handleLandingHeroUrlApplied = useCallback(
    (imageUrl: string) => {
      const nextUrl = imageUrl.trim();
      const nextScale = nextUrl ? pages.landing.imageScale : 1;
      const nextPages: TemplatePagesState = {
        ...pages,
        landing: {
          ...pages.landing,
          imageUrl: nextUrl,
          imageScale: nextScale,
        },
        signup: {
          ...pages.signup,
          imageUrl: nextUrl,
          imageScale: nextScale,
        },
        payment: {
          ...pages.payment,
          imageUrl: nextUrl,
          imageScale: nextScale,
        },
      };
      commitPages(nextPages);
      setIsDirty(true);
      setSaveStatus("idle");
      setSaveError(null);
    },
    [commitPages, pages],
  );

  const handleAiUndo = useCallback((): boolean => {
    if (!canUndo) return false;
    undo();
    setIsDirty(true);
    setSaveStatus("idle");
    setSaveError(null);
    return true;
  }, [canUndo, undo]);

  const funnelLinkQuery = useMemo(
    () => ({
      businessId: previewBusinessId,
      campaignId: previewCampaignId,
      price: campaignPricing.subtotal ?? campaignPrice ?? undefined,
      campaignType:
        campaignType === "prepaid" || campaignType === "postpaid"
          ? campaignType
          : undefined,
    }),
    [
      previewBusinessId,
      previewCampaignId,
      campaignPricing.subtotal,
      campaignPrice,
      campaignType,
    ],
  );

  const previewSignupNextHref =
    interactivePreview && previewRouteId != null
      ? isPostpaid
        ? buildFunnelPaymentConfirmationPath(previewRouteId, funnelLinkQuery, {
            paymentConfirmed: true,
          })
        : buildFunnelPublicPath({
            funnelId: previewRouteId,
            step: "payment",
            query: funnelLinkQuery,
          })
      : undefined;
  const previewSignupBackHref =
    interactivePreview && previewRouteId != null
      ? buildFunnelPublicPath({
          funnelId: previewRouteId,
          step: "landing",
          query: funnelLinkQuery,
        })
      : undefined;

  const paymentStripeCheckout = useMemo((): FunnelStripePaymentContext | null => {
    if (!interactivePreview || activeId !== "payment") return null;
    if (previewBusinessId == null) return null;
    const email =
      process.env.NEXT_PUBLIC_FUNNEL_PAYMENT_PREVIEW_EMAIL?.trim() || null;
    if (!email || funnelId == null || funnelId < 1) return null;
    return {
      funnelId,
      businessId: previewBusinessId,
      currency:
        process.env.NEXT_PUBLIC_FUNNEL_PAYMENT_CURRENCY?.trim().toLowerCase() ||
        "usd",
      customerEmail: email,
    };
  }, [interactivePreview, previewBusinessId, funnelId, activeId]);

  const patchPage = useCallback(
    (patch: TemplatePagePatch) => {
      setSaveStatus((s) => (s === "saved" ? "idle" : s));
      setSaveError(null);
      setIsDirty(true);
      commitPages((prev) => {
        const updated = { ...prev[activeId], ...patch } as TemplatePage;
        const next: TemplatePagesState = { ...prev, [activeId]: updated };
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
    },
    [activeId, commitPages],
  );

  const beginEditSession = useCallback(
    (id: TemplatePageId, sourcePages: TemplatePagesState) => {
      setActiveId(id);
      setSettingsOpen(true);
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
      if (isPostpaid && id === "payment") return;
      if (settingsOpen && isDirty && id !== activeId) {
        setPendingNavId(id);
        return;
      }
      beginEditSession(id, pages);
    },
    [settingsOpen, isDirty, activeId, pages, beginEditSession, isPostpaid],
  );

  const requestSwitchActive = useCallback(
    (id: TemplatePageId) => {
      if (isPostpaid && id === "payment") return;
      if (id === activeId) return;
      if (settingsOpen && isDirty) {
        setPendingNavId(id);
        return;
      }
      setActiveId(id);
    },
    [activeId, settingsOpen, isDirty, isPostpaid],
  );

  const handlePreview = useCallback(() => {
    if (previewRouteId == null) return;
    const step =
      isPostpaid && activeId === "payment"
        ? "confirmation"
        : activeId === "confirmation"
          ? "confirmation"
          : activeId;
    void openFunnelDesignPreview(previewRouteId, step);
  }, [previewRouteId, activeId, isPostpaid]);

  const handlePreviewPage = useCallback(
    (pageId: TemplatePageId) => {
      if (previewRouteId == null) return;
      if (isPostpaid && pageId === "payment") return;
      const step = pageId === "confirmation" ? "confirmation" : pageId;
      void openFunnelDesignPreview(previewRouteId, step);
    },
    [previewRouteId, isPostpaid],
  );

  const cancelDiscard = useCallback(() => setPendingNavId(null), []);

  const confirmDiscard = useCallback(() => {
    const target = pendingNavId;
    const snapshot = editSnapshotRef.current;
    if (snapshot) resetPagesHistory(snapshot);
    setIsDirty(false);
    setSaveStatus("idle");
    setSaveError(null);
    setPendingNavId(null);
    if (target) beginEditSession(target, snapshot ?? pages);
  }, [pendingNavId, pages, beginEditSession, resetPagesHistory]);

  const displaySaveStatus: EditorSaveStatus =
    saveStatus === "idle" && !isDirty && isHydrated ? "draft" : saveStatus;

  const landingPage =
    pages.landing.id === "landing" ? (pages.landing as LandingTemplatePage) : null;
  const activeDesignTemplateId = landingPage?.pageTemplateId ?? null;

  const applyFunnelPageDesign = useCallback(
    (template: FunnelPageDesignTemplate) => {
      const tokens = getLandingDesignStyle(template.landingDesign);
      setSaveStatus("idle");
      setSaveError(null);
      setIsDirty(true);
      commitPages((prev) => {
        const landing = prev.landing as LandingTemplatePage;
        const signup = prev.signup as SignUpTemplatePage;
        const payment = prev.payment as PaymentTemplatePage;
        const nextLanding: LandingTemplatePage = {
          ...landing,
          pageTemplateId: template.id,
          landingDesign: template.landingDesign,
          heroDesign: template.heroDesign,
          layoutType: template.layoutType,
          backgroundColor: tokens.backgroundDefault,
        };
        return {
          ...prev,
          landing: nextLanding,
          signup: {
            ...signup,
            formDesign: template.formDesign,
            layoutType: template.layoutType,
            imageUrl: nextLanding.imageUrl,
            imageScale: nextLanding.imageScale,
          },
          payment: {
            ...payment,
            checkoutTemplate: template.checkoutTemplate,
            formDesign: template.formDesign,
            layoutType: template.layoutType,
            checkoutTheme: syncCheckoutThemeWithLandingDesign(
              payment.checkoutTheme ?? DEFAULT_CHECKOUT_THEME,
              template.landingDesign,
            ),
          },
        };
      });
      setTemplateGalleryOpen(false);
    },
    [commitPages],
  );

  return (
    <>
      <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <EditorShell
        embedded={embedded}
        navbar={
          embedded ? undefined : (
            <TopNavigation
              campaignName={campaignName ?? "Campaign"}
              pageLabel={activePage.label}
              saveStatus={displaySaveStatus}
              isDirty={isDirty}
              onSave={() => void handleSave()}
              onPublish={() => void handleSetPublished(true)}
              onUnpublish={() => void handleSetPublished(false)}
              published={published}
              onPreview={previewRouteId != null ? handlePreview : undefined}
              onTrackingLink={handleOpenTrackingLink}
              isSaving={saveStatus === "saving"}
              saveError={saveError}
            />
          )
        }
        leftSidebar={
          <EditorLeftSidebar
            activeId={activeId}
            onSelect={openEditorForPage}
            onPreviewPage={
              previewRouteId != null ? handlePreviewPage : undefined
            }
            compact={embedded}
            pageOrder={pageOrder}
          />
        }
        canvas={
          <CanvasWorkspace
            isLoading={isLoadingFunnel}
            loadError={loadError}
            embedded={embedded}
          >
            <TemplatePreview
              page={activePage}
              landingPage={pages.landing}
              interactiveForms={interactivePreview}
              signupNextHref={previewSignupNextHref}
              signupBackHref={previewSignupBackHref}
              editorStepPreviewChrome
              paymentStripeCheckout={paymentStripeCheckout}
              campaignPricing={campaignPricing}
              skipPaymentStep={isPostpaid}
              campaignType={campaignType ?? null}
            />
          </CanvasWorkspace>
        }
        settingsPanel={
          <SettingsPanel
            open={settingsOpen}
            page={activePage}
            onChange={patchPage}
            onBrowseTemplates={() => setTemplateGalleryOpen(true)}
            embedded={embedded}
            toolbar={
              embedded ? (
                <TopNavigation
                  campaignName={campaignName ?? "Campaign"}
                  pageLabel={activePage.label}
                  saveStatus={displaySaveStatus}
                  isDirty={isDirty}
                  onSave={() => void handleSave()}
                  onPublish={() => void handleSetPublished(true)}
                  onUnpublish={() => void handleSetPublished(false)}
                  published={published}
                  onTrackingLink={handleOpenTrackingLink}
                  isSaving={saveStatus === "saving"}
                  saveError={saveError}
                  embedded
                  docked
                  showPreview={false}
                />
              ) : undefined
            }
          />
        }
        assistantPanel={
          showAiAssistant &&
          aiAssistantOpen &&
          previewBusinessId != null ? (
            <FunnelAiAssistantSidebar
              pageId={activeId}
              businessId={previewBusinessId}
              campaignId={previewCampaignId ?? undefined}
              funnelId={funnelId}
              pagePayload={aiPagePayload}
              onSchemaApplied={handleAiSchemaApplied}
              onLandingHeroUrlApplied={handleLandingHeroUrlApplied}
              onUndoLastChange={handleAiUndo}
              onClose={() => setAiAssistantOpen(false)}
            />
          ) : undefined
        }
        assistantLauncher={
          showAiAssistant && !aiAssistantOpen && previewBusinessId != null ? (
            <button
              type="button"
              onClick={() => setAiAssistantOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1877f2] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1877f2]/30 transition hover:bg-[#166fe5]"
            >
              <Sparkles className="size-4" strokeWidth={2.25} aria-hidden />
              AI assistant
            </button>
          ) : undefined
        }
      />
      </div>

      <DiscardChangesDialog
        open={pendingNavId !== null}
        pageLabel={activePage.label}
        onCancel={cancelDiscard}
        onDiscard={confirmDiscard}
      />

    <FunnelPageTemplateGallery
      open={templateGalleryOpen}
      onClose={() => setTemplateGalleryOpen(false)}
      activeDesignTemplateId={activeDesignTemplateId}
      onApplyDesign={applyFunnelPageDesign}
    />

    {trackingPortalReady
      ? createPortal(
          <AnimatePresence>
            {trackingDialogOpen ? (
              <motion.div
                key="funnel-tracking-link-dialog"
                className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto p-3 sm:items-center sm:p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                role="presentation"
              >
                <button
                  type="button"
                  aria-label="Close dialog"
                  onClick={() => setTrackingDialogOpen(false)}
                  className="absolute inset-0 cursor-default bg-slate-900/25 backdrop-blur-[2px]"
                />

                {campaignId != null && landingTrackingUrl && funnelId != null && funnelId >= 1 ? (
                  <FunnelTrackingLinkDialog
                    campaignTitle={campaignTitleForTracking}
                    funnelLive={published}
                    landingTrackingUrl={landingTrackingUrl}
                    funnelId={funnelId}
                    copyDone={trackingCopyDone}
                    onClose={() => setTrackingDialogOpen(false)}
                    onCopy={() => void handleCopyTrackingUrl()}
                  />
                ) : (
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="tracking-link-dialog-title"
                    className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_50px_-16px_rgba(15,23,42,0.18)]"
                    initial={{ opacity: 0, scale: 0.96, y: 18 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.28, ease: automationEase }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Ad tracking link
                      </p>
                      <h2
                        id="tracking-link-dialog-title"
                        className="mt-2 text-xl font-semibold text-slate-900"
                      >
                        Tracking link unavailable
                      </h2>
                    </div>
                    <div className="px-5 py-4 sm:px-6">
                      <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/80 px-3.5 py-3 text-sm text-amber-800">
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-400" />
                        <p>
                          Save this funnel first so a tracking link can be built
                          for your ads.
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
                      <button
                        type="button"
                        onClick={() => setTrackingDialogOpen(false)}
                        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
                      >
                        Done
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
      : null}
    </>
  );
}
