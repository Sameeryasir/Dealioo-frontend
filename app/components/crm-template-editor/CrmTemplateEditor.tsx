"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CanvasWorkspace } from "@/app/components/crm-template-editor/CanvasWorkspace";
import { DiscardChangesDialog } from "@/app/components/crm-template-editor/DiscardChangesDialog";
import { EditorLeftSidebar } from "@/app/components/crm-template-editor/EditorLeftSidebar";
import { EditorShell } from "@/app/components/crm-template-editor/EditorShell";
import { SettingsPanel } from "@/app/components/crm-template-editor/SettingsPanel";
import { TopNavigation } from "@/app/components/crm-template-editor/TopNavigation";
import type { EditorSaveStatus } from "@/app/components/crm-template-editor/editor-status";
import { FunnelPageTemplateGallery } from "@/app/components/crm-template-editor/FunnelPageTemplateGallery";
import type { FunnelLandingCopyTemplate } from "@/app/components/crm-template-editor/funnel-landing-copy-templates";
import type { FunnelPageDesignTemplate } from "@/app/components/crm-template-editor/funnel-page-templates";
import { getLandingDesignStyle } from "@/app/components/crm-template-editor/landing-designs/registry";
import { TemplatePreview } from "@/app/components/crm-template-editor/TemplatePreview";
import {
  buildFunnelPublicPath,
  resolveFunnelRouteId,
} from "@/app/lib/funnel-public-path";
import {
  parseCampaignPrice,
  type CampaignPricing,
} from "@/app/lib/campaign-price";
import { parsePositiveInt } from "@/app/lib/numbers";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import type { FunnelStripePaymentContext } from "@/app/components/funnel/FunnelStripePaymentForm";
import { mergePagesForSave } from "@/app/lib/merge-funnel-pages";
import {
  buildCreateFunnelRequestBody,
  createFunnel,
} from "@/app/services/funnel/create-funnel";
import {
  useCampaignFunnelLoader,
  usePersistCampaignFunnelDraft,
} from "@/app/hooks/use-campaign-funnel-loader";
import { useEditorKeyboardShortcuts } from "@/app/hooks/use-editor-keyboard-shortcuts";
import { useUndoRedo } from "@/app/hooks/use-undo-redo";
import type {
  LandingTemplatePage,
  PaymentTemplatePage,
  SignUpTemplatePage,
  TemplatePage,
  TemplatePageId,
  TemplatePagePatch,
  TemplatePagesState,
} from "@/app/components/crm-template-editor/template-types";

export type CrmTemplateEditorProps = {
  restaurantId?: number;
  campaignId?: number;
  campaignName?: string;
  campaignPrice?: number | string;
  campaignOffer?: string;
  initialPageId?: TemplatePageId;
  interactivePreview?: boolean;
};

export function CrmTemplateEditor({
  restaurantId,
  campaignId,
  campaignName,
  campaignPrice,
  campaignOffer,
  initialPageId = "landing",
  interactivePreview = false,
}: CrmTemplateEditorProps) {
  const funnelLoader = useCampaignFunnelLoader(campaignId);
  const {
    funnelId,
    isLoading: isLoadingFunnel,
    loadError,
    isHydrated,
    pagesBaseline,
  } = funnelLoader;

  const {
    present: pages,
    commit: commitPages,
    reset: resetPagesHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<TemplatePagesState>(funnelLoader.pages);

  const [activeId, setActiveId] = useState<TemplatePageId>(initialPageId);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<EditorSaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavId, setPendingNavId] = useState<TemplatePageId | null>(null);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const editSnapshotRef = useRef<TemplatePagesState | null>(null);

  const activePage = pages[activeId];

  useEffect(() => {
    if (!isHydrated) return;
    resetPagesHistory(funnelLoader.pages);
    setIsDirty(false);
    setSaveStatus("idle");
  }, [isHydrated, funnelLoader.pages, resetPagesHistory]);

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
        buildCreateFunnelRequestBody(campaignId, pagesToSave),
      );
      setSaveStatus("saved");
      setIsDirty(false);
      editSnapshotRef.current = JSON.parse(
        JSON.stringify(pages),
      ) as TemplatePagesState;
    } catch (e) {
      setSaveStatus("error");
      setSaveError(e instanceof Error ? e.message : "Could not save changes.");
    }
  }, [campaignId, pages, pagesBaseline]);

  useEditorKeyboardShortcuts({
    onSave: () => void handleSave(),
    onUndo: undo,
    onRedo: redo,
  });

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

  const campaignPricing = useMemo((): CampaignPricing => {
    const subtotal = parseCampaignPrice(campaignPrice);
    return {
      subtotal,
      fees: 0,
      offer: campaignOffer?.trim() || null,
    };
  }, [campaignPrice, campaignOffer]);

  const funnelLinkQuery = useMemo(
    () => ({
      restaurantId: previewRestaurantId,
      campaignId: previewCampaignId,
      price: campaignPricing.subtotal ?? campaignPrice ?? undefined,
    }),
    [
      previewRestaurantId,
      previewCampaignId,
      campaignPricing.subtotal,
      campaignPrice,
    ],
  );

  const previewSignupNextHref =
    interactivePreview && previewRouteId != null
      ? buildFunnelPublicPath({
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
    if (previewRestaurantId == null) return null;
    const email =
      process.env.NEXT_PUBLIC_FUNNEL_PAYMENT_PREVIEW_EMAIL?.trim() || null;
    if (!email || funnelId == null || funnelId < 1) return null;
    return {
      funnelId,
      restaurantId: previewRestaurantId,
      currency:
        process.env.NEXT_PUBLIC_FUNNEL_PAYMENT_CURRENCY?.trim().toLowerCase() ||
        "usd",
      customerEmail: email,
    };
  }, [interactivePreview, previewRestaurantId, funnelId, activeId]);

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
      if (settingsOpen && isDirty && id !== activeId) {
        setPendingNavId(id);
        return;
      }
      beginEditSession(id, pages);
    },
    [settingsOpen, isDirty, activeId, pages, beginEditSession],
  );

  const requestSwitchActive = useCallback(
    (id: TemplatePageId) => {
      if (id === activeId) return;
      if (settingsOpen && isDirty) {
        setPendingNavId(id);
        return;
      }
      setActiveId(id);
    },
    [activeId, settingsOpen, isDirty],
  );

  const handlePreview = useCallback(() => {
    if (previewRouteId == null) return;
    const url = buildFunnelPublicPath({
      funnelId: previewRouteId,
      step: activeId === "confirmation" ? "confirmation" : activeId,
      query: funnelLinkQuery,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }, [
    previewRouteId,
    activeId,
    funnelLinkQuery,
  ]);

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
  const activeCopyTemplateId = landingPage?.copyTemplateId ?? null;

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
          },
        };
      });
      setTemplateGalleryOpen(false);
    },
    [commitPages],
  );

  const applyFunnelLandingCopy = useCallback(
    (template: FunnelLandingCopyTemplate) => {
      setSaveStatus("idle");
      setSaveError(null);
      setIsDirty(true);
      commitPages((prev) => {
        const landing = prev.landing as LandingTemplatePage;
        return {
          ...prev,
          landing: {
            ...landing,
            copyTemplateId: template.id,
            heading: template.copy.heading,
            subheading: template.copy.subheading,
            body: template.copy.body,
            buttonText: template.copy.buttonText,
          },
        };
      });
      setTemplateGalleryOpen(false);
    },
    [commitPages],
  );

  return (
    <>
      <EditorShell
        navbar={
          <TopNavigation
            campaignName={campaignName ?? "Campaign"}
            pageLabel={activePage.label}
            saveStatus={displaySaveStatus}
            isDirty={isDirty}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onSave={() => void handleSave()}
            onPreview={previewRouteId != null ? handlePreview : undefined}
            isSaving={saveStatus === "saving"}
            saveError={saveError}
          />
        }
        leftSidebar={
          <EditorLeftSidebar
            activeId={activeId}
            onSelect={requestSwitchActive}
            onEditPage={openEditorForPage}
          />
        }
        canvas={
          <CanvasWorkspace isLoading={isLoadingFunnel} loadError={loadError}>
            <TemplatePreview
              page={activePage}
              landingPage={pages.landing}
              interactiveForms={interactivePreview}
              signupNextHref={previewSignupNextHref}
              signupBackHref={previewSignupBackHref}
              editorStepPreviewChrome
              paymentStripeCheckout={paymentStripeCheckout}
              campaignPricing={campaignPricing}
            />
          </CanvasWorkspace>
        }
        settingsPanel={
          <SettingsPanel
            open={settingsOpen}
            page={activePage}
            onChange={patchPage}
            onBrowseTemplates={() => setTemplateGalleryOpen(true)}
          />
        }
      />

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
      activeCopyTemplateId={activeCopyTemplateId}
      onApplyDesign={applyFunnelPageDesign}
      onApplyCopy={applyFunnelLandingCopy}
    />
    </>
  );
}
