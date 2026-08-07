"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  BuilderLoadingBanner,
  metaBuilderShellClass,
} from "@/app/components/campaign/meta-builder/builder-ui";
import type {
  AdCreativeStepData,
  AdSetStepData,
  CampaignStepData,
  MetaCampaignDraft,
  MetaCampaignObjective,
} from "@/app/lib/meta-campaign-builder-types";
import {
  buildMetaAdsManagerUrl,
  openMetaAdsManager,
  shouldOpenMetaAdsManagerAfterPublish,
} from "@/app/lib/meta-campaign-builder-types";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { isPusherConfigured } from "@/app/lib/pusher-meta-publish";
import { subscribeMetaPublishProgress } from "@/app/lib/pusher-client";
import {
  DEFAULT_META_ACCOUNT_CURRENCY,
  normalizeMetaCurrencyCode,
} from "@/app/lib/meta-account-currency";
import { getFacebookAdAccounts } from "@/app/services/facebook/get-facebook-ad-accounts";
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";
import { AdCreativeSetupStep } from "@/app/components/campaign/meta-builder/AdCreativeSetupStep";
import { AdSetSetupStep } from "@/app/components/campaign/meta-builder/AdSetSetupStep";
import { BuilderStepNav } from "@/app/components/campaign/meta-builder/BuilderStepNav";
import { CampaignSetupStep } from "@/app/components/campaign/meta-builder/CampaignSetupStep";
import { PlaceholderBuilderStep } from "@/app/components/campaign/meta-builder/PlaceholderBuilderStep";
import { ReviewPublishStep } from "@/app/components/campaign/meta-builder/ReviewPublishStep";
import {
  clearMetaDraftLocalState,
  readMetaDraftRecovery,
  writeActiveMetaDraftId,
  writeMetaDraftRecovery,
} from "@/app/lib/meta-active-draft-storage";
import {
  autosaveMetaCampaignDraft,
  getMetaCampaignDraft,
  getMetaPublishStatus,
  MetaDraftConflictError,
  pollMetaPublishUntilDone,
  publishMetaCampaignDraft,
  saveAdCreativeStep,
  saveAdSetStep,
  saveCampaignStep,
  type PublishMetaCampaignResult,
} from "@/app/services/facebook/meta-campaign-draft";

type AutosaveUiState = "idle" | "saving" | "saved" | "error";

type MetaCampaignBuilderProps = {
  open: boolean;
  businessId: number;
  defaultName?: string;
  defaultWebsiteUrl?: string;
  initialObjective?: MetaCampaignObjective | null;
  draftId?: string | null;
  initialDraft?: MetaCampaignDraft | null;
  
  autoStartPublish?: boolean;
  onClose: () => void;
  onDraftSaved?: (draft: MetaCampaignDraft) => void;
};

function initialStepFromDraft(draft: MetaCampaignDraft | null | undefined): number {
  if (!draft) return 1;
  const status = (draft.status ?? "").toLowerCase();
  const publishStatus = (draft.publishStatus ?? "").toUpperCase();
  const isPublishing =
    status === "publishing" ||
    publishStatus === "QUEUED" ||
    publishStatus === "PUBLISHING" ||
    publishStatus === "RUNNING";
  const isFailed =
    status === "failed" || publishStatus === "FAILED";
  
  if (
    (isPublishing || isFailed) &&
    draft.campaignData &&
    draft.adSetData &&
    draft.adCreativeData
  ) {
    return 4;
  }
  if (draft.currentStep && draft.currentStep > 1) {
    return Math.min(draft.currentStep, 4);
  }
  return 1;
}

function applyDraftToPartialMeta(draft: MetaCampaignDraft) {
  if (draft.metaCampaignId && !draft.metaAdId) {
    return {
      metaCampaignId: draft.metaCampaignId,
      metaAdsetId: draft.metaAdsetId,
      metaCreativeId: draft.metaCreativeId,
      previousError: draft.errorMessage,
    };
  }
  return null;
}

export function MetaCampaignBuilder({
  open,
  businessId,
  defaultName = "",
  defaultWebsiteUrl,
  initialObjective = null,
  draftId: initialDraftId = null,
  initialDraft = null,
  autoStartPublish = false,
  onClose,
  onDraftSaved,
}: MetaCampaignBuilderProps) {
  const [currentStep, setCurrentStep] = useState(() =>
    initialStepFromDraft(initialDraft),
  );
  const [draftId, setDraftId] = useState<string | null>(
    initialDraftId ?? initialDraft?.id ?? null,
  );
  const [draftVersion, setDraftVersion] = useState<number>(
    initialDraft?.version ?? 1,
  );
  const [campaignData, setCampaignData] = useState<CampaignStepData | null>(
    initialDraft?.campaignData ?? null,
  );
  const [adSetData, setAdSetData] = useState<AdSetStepData | null>(
    initialDraft?.adSetData ?? null,
  );
  const [adCreativeData, setAdCreativeData] = useState<AdCreativeStepData | null>(
    initialDraft?.adCreativeData ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [autosaveState, setAutosaveState] = useState<AutosaveUiState>("idle");
  const [publishing, setPublishing] = useState(false);
  const [publishPhase, setPublishPhase] = useState<string | null>(
    initialDraft?.publishStatus ?? null,
  );
  const [publishStep, setPublishStep] = useState<string | null>(
    initialDraft?.publishStep ?? null,
  );
  const [publishProgress, setPublishProgress] = useState(
    initialDraft?.publishProgress ?? 0,
  );
  const [error, setError] = useState<string | null>(
    initialDraft?.status === "failed" ? initialDraft.errorMessage : null,
  );
  const [publishSuccess, setPublishSuccess] =
    useState<PublishMetaCampaignResult | null>(null);
  const [partialMeta, setPartialMeta] = useState<{
    metaCampaignId?: string | null;
    metaAdsetId?: string | null;
    metaCreativeId?: string | null;
    previousError?: string | null;
  } | null>(
    initialDraft ? applyDraftToPartialMeta(initialDraft) : null,
  );

  const [refreshingPublishStatus, setRefreshingPublishStatus] = useState(false);
  const [accountCurrency, setAccountCurrency] = useState(
    DEFAULT_META_ACCOUNT_CURRENCY,
  );

  const publishStartedRef = useRef(false);
  const resumeHandledRef = useRef(false);
  const sessionHydratedRef = useRef(false);
  const stepScrollRef = useRef<HTMLElement | null>(null);
  const autosaveSkipRef = useRef(true);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutosavePayloadRef = useRef<string>("");

  useEffect(() => {
    stepScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [currentStep]);

  useEffect(() => {
    if (!open || publishSuccess) return;
    if (!draftId && !campaignData && !adSetData && !adCreativeData) return;

    writeMetaDraftRecovery(businessId, {
      draftId,
      currentStep,
      campaignData,
      adSetData,
      adCreativeData,
      updatedAt: new Date().toISOString(),
    });
    if (draftId) {
      writeActiveMetaDraftId(businessId, draftId);
    }
  }, [
    open,
    businessId,
    draftId,
    currentStep,
    campaignData,
    adSetData,
    adCreativeData,
    publishSuccess,
  ]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    void (async () => {
      try {
        const token = getSetupAccessToken().trim();
        const [status, accounts] = await Promise.all([
          token
            ? getFacebookConnectionStatus(token, businessId)
            : Promise.resolve(null),
          getFacebookAdAccounts(businessId),
        ]);
        if (cancelled) return;

        const selectedId = status?.metaAdAccountId?.trim() || null;
        const match =
          (selectedId
            ? accounts.find((account) => account.id === selectedId)
            : null) ?? accounts[0];
        setAccountCurrency(
          normalizeMetaCurrencyCode(match?.currency ?? DEFAULT_META_ACCOUNT_CURRENCY),
        );
      } catch {
        if (!cancelled) {
          setAccountCurrency(DEFAULT_META_ACCOUNT_CURRENCY);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, businessId]);

  const applyDraftState = useCallback((draft: MetaCampaignDraft) => {
    setDraftId(draft.id);
    setDraftVersion(draft.version ?? 1);
    setCampaignData(draft.campaignData);
    setAdSetData(draft.adSetData);
    setAdCreativeData(draft.adCreativeData);
    if (draft.publishStep != null) setPublishStep(draft.publishStep);
    if (draft.publishProgress != null) setPublishProgress(draft.publishProgress);
    if (draft.publishStatus != null) setPublishPhase(draft.publishStatus);
    setPartialMeta(applyDraftToPartialMeta(draft));
  }, []);

  const applyPublishProgress = useCallback(
    (draft: Pick<
      MetaCampaignDraft,
      | "publishStatus"
      | "publishStep"
      | "publishProgress"
      | "errorMessage"
      | "metaCampaignId"
      | "metaAdsetId"
      | "metaCreativeId"
      | "metaAdId"
      | "status"
    >) => {
      setPublishPhase(draft.publishStatus ?? draft.status);
      if (draft.publishStep != null) setPublishStep(draft.publishStep);
      if (typeof draft.publishProgress === "number") {
        setPublishProgress(draft.publishProgress);
      }
      if (draft.errorMessage?.trim()) {
        setError(draft.errorMessage);
      }
      if (draft.metaCampaignId && !draft.metaAdId) {
        setPartialMeta({
          metaCampaignId: draft.metaCampaignId,
          metaAdsetId: draft.metaAdsetId,
          metaCreativeId: draft.metaCreativeId,
          previousError: draft.errorMessage,
        });
      }
    },
    [],
  );

  const maxReachableStep = useMemo(() => {
    if (!draftId || !campaignData) return 1;
    if (!adSetData) return 2;
    if (!adCreativeData) return 3;
    return 4;
  }, [adCreativeData, adSetData, campaignData, draftId]);

  const handleStepClick = useCallback(
    (stepId: number) => {
      if (stepId <= maxReachableStep && stepId !== currentStep) {
        setCurrentStep(stepId);
        setError(null);
      }
    },
    [currentStep, maxReachableStep],
  );

  
  const onDraftSavedRef = useRef(onDraftSaved);
  onDraftSavedRef.current = onDraftSaved;

  const runAutosave = useCallback(async () => {
    if (!draftId || !draftVersion) return;
    if (!campaignData && !adSetData && !adCreativeData) return;

    const payload = {
      expectedVersion: draftVersion,
      currentStep,
      completedSteps:
        currentStep > 1
          ? Array.from({ length: currentStep - 1 }, (_, i) => i + 1)
          : undefined,
      campaignData: campaignData ?? undefined,
      adSetData: adSetData ?? undefined,
      adCreativeData: adCreativeData ?? undefined,
    };
    const fingerprint = JSON.stringify(payload);
    if (fingerprint === lastAutosavePayloadRef.current) {
      return;
    }

    setAutosaveState("saving");
    try {
      const saved = await autosaveMetaCampaignDraft(businessId, draftId, payload);
      lastAutosavePayloadRef.current = JSON.stringify({
        ...payload,
        expectedVersion: saved.version,
      });
      autosaveSkipRef.current = true;
      setDraftVersion(saved.version ?? draftVersion + 1);
      setAutosaveState("saved");
      onDraftSavedRef.current?.(saved);
    } catch (err) {
      if (err instanceof MetaDraftConflictError) {
        setAutosaveState("error");
        setError(
          err.message ||
            "Draft was updated elsewhere. Reloading the latest version…",
        );
        try {
          const refreshed = await getMetaCampaignDraft(businessId, draftId);
          applyDraftState(refreshed);
          setCurrentStep(initialStepFromDraft(refreshed));
          onDraftSavedRef.current?.(refreshed);
          setError(
            "Draft was updated elsewhere. We loaded the latest version — review your changes and continue.",
          );
        } catch {
          
        }
        return;
      }
      setAutosaveState("error");
    }
  }, [
    adCreativeData,
    adSetData,
    applyDraftState,
    businessId,
    campaignData,
    currentStep,
    draftId,
    draftVersion,
  ]);

  useEffect(() => {
    if (!open || !draftId || draftVersion < 1) return;
    if (autosaveSkipRef.current) {
      autosaveSkipRef.current = false;
      return;
    }
    
    if (publishing) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      void runAutosave();
    }, 1000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [
    open,
    draftId,
    draftVersion,
    campaignData,
    adSetData,
    adCreativeData,
    currentStep,
    publishing,
    runAutosave,
  ]);

  
  useEffect(() => {
    if (!open || !draftId || !isPusherConfigured()) return;

    return subscribeMetaPublishProgress(businessId, (payload) => {
      if (payload.draftId !== draftId) return;
      applyPublishProgress({
        publishStatus: payload.publishStatus,
        publishStep: payload.publishStep,
        publishProgress: payload.publishProgress,
        errorMessage: payload.errorMessage,
        metaCampaignId: payload.metaCampaignId,
        metaAdsetId: payload.metaAdsetId,
        metaCreativeId: payload.metaCreativeId,
        metaAdId: payload.metaAdId,
        status: payload.status,
      });
    });
  }, [applyPublishProgress, businessId, draftId, open]);

  const handleCampaignWorkingChange = useCallback((data: CampaignStepData) => {
    setCampaignData(data);
  }, []);

  const handleAdCreativeWorkingChange = useCallback((data: AdCreativeStepData) => {
    setAdCreativeData((prev) => {
      if (!prev) return data;
      return {
        ...prev,
        ...data,
        imageUrl: data.imageUrl?.trim() || prev.imageUrl,
        videoUrl: data.videoUrl?.trim() || prev.videoUrl,
        thumbnailUrl: data.thumbnailUrl?.trim() || prev.thumbnailUrl,
        carouselCards: data.carouselCards?.length
          ? data.carouselCards
          : prev.carouselCards,
      };
    });
  }, []);

  const handleSaveCampaignStep = useCallback(
    async (data: CampaignStepData) => {
      setSaving(true);
      setError(null);
      try {
        const draft = await saveCampaignStep(businessId, {
          ...data,
          draftId: draftId ?? undefined,
        });
        
        autosaveSkipRef.current = true;
        lastAutosavePayloadRef.current = "";
        applyDraftState(draft);
        setCurrentStep(2);
        setAutosaveState("saved");
        onDraftSaved?.(draft);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not save campaign step.",
        );
      } finally {
        setSaving(false);
      }
    },
    [applyDraftState, draftId, onDraftSaved, businessId],
  );

  const handleSaveAdSetStep = useCallback(
    async (
      data: Omit<
        AdSetStepData,
        "startDateTime" | "endDateTime" | "dailyBudgetMinor" | "lifetimeBudgetMinor"
      >,
    ) => {
      if (!draftId) {
        setError("Complete Step 1 (Campaign) before saving the ad set.");
        return;
      }

      setSaving(true);
      setError(null);
      try {
        const draft = await saveAdSetStep(businessId, {
          ...data,
          draftId,
        });
        autosaveSkipRef.current = true;
        lastAutosavePayloadRef.current = "";
        applyDraftState(draft);
        setCurrentStep(3);
        setAutosaveState("saved");
        onDraftSaved?.(draft);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not save ad set step.",
        );
      } finally {
        setSaving(false);
      }
    },
    [applyDraftState, draftId, onDraftSaved, businessId],
  );

  const handleSaveAdCreativeStep = useCallback(
    async (data: AdCreativeStepData) => {
      if (!draftId) {
        setError("Complete Steps 1 and 2 before saving the ad.");
        return;
      }

      setSaving(true);
      setError(null);
      try {
        const draft = await saveAdCreativeStep(businessId, {
          ...data,
          draftId,
        });
        autosaveSkipRef.current = true;
        lastAutosavePayloadRef.current = "";
        applyDraftState(draft);
        setCurrentStep(4);
        setAutosaveState("saved");
        onDraftSaved?.(draft);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not save ad creative step.",
        );
      } finally {
        setSaving(false);
      }
    },
    [applyDraftState, draftId, onDraftSaved, businessId],
  );

  const handleRefreshPublishStatus = useCallback(async () => {
    if (!draftId || !campaignData) return;

    setRefreshingPublishStatus(true);
    setError(null);
    try {
      let refreshed: MetaCampaignDraft;
      try {
        const status = await getMetaPublishStatus(businessId, draftId, 15_000);
        applyPublishProgress({
          publishStatus: status.publishStatus,
          publishStep: status.publishStep,
          publishProgress: status.publishProgress,
          errorMessage: status.errorMessage,
          metaCampaignId: status.metaCampaignId,
          metaAdsetId: status.metaAdsetId,
          metaCreativeId: status.metaCreativeId,
          metaAdId: status.metaAdId,
          status: status.status,
        });
        refreshed = await getMetaCampaignDraft(businessId, draftId, 15_000);
      } catch {
        refreshed = await getMetaCampaignDraft(businessId, draftId, 15_000);
        applyPublishProgress(refreshed);
      }

      if (
        (refreshed.publishStatus === "PUBLISHED" ||
          refreshed.status === "published") &&
        refreshed.metaCampaignId &&
        refreshed.metaAdsetId &&
        refreshed.metaCreativeId &&
        refreshed.metaAdId
      ) {
        let adsManagerUrl = "";
        const token = getSetupAccessToken().trim();
        if (token) {
          try {
            const connection = await getFacebookConnectionStatus(
              token,
              businessId,
            );
            if (connection.metaAdAccountId) {
              adsManagerUrl = buildMetaAdsManagerUrl(connection.metaAdAccountId);
            }
          } catch {
            
          }
        }

        const deliveryStatus = campaignData.status;
        const result: PublishMetaCampaignResult = {
          draftId: refreshed.id,
          trackingId: refreshed.id,
          metaCampaignId: refreshed.metaCampaignId,
          metaAdsetId: refreshed.metaAdsetId,
          metaCreativeId: refreshed.metaCreativeId,
          metaAdId: refreshed.metaAdId,
          status: deliveryStatus,
          adsManagerUrl,
          publishStatus: refreshed.publishStatus,
          message:
            deliveryStatus === "ACTIVE"
              ? "Campaign published to Meta as Active."
              : "Campaign published successfully to Meta (paused).",
        };
        setPartialMeta(null);
        setPublishSuccess(result);
        clearMetaDraftLocalState(businessId);
        onDraftSaved?.(refreshed);
        if (
          shouldOpenMetaAdsManagerAfterPublish(campaignData) &&
          adsManagerUrl
        ) {
          openMetaAdsManager(adsManagerUrl);
        }
        onClose();
        return;
      }

      if (refreshed.metaCampaignId && !refreshed.metaAdId) {
        setPartialMeta({
          metaCampaignId: refreshed.metaCampaignId,
          metaAdsetId: refreshed.metaAdsetId,
          metaCreativeId: refreshed.metaCreativeId,
          previousError: refreshed.errorMessage,
        });
        setError(
          refreshed.errorMessage ??
            "Still waiting on Meta. If Ads Manager already shows your ad, wait a minute and check again.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not refresh publish status.",
      );
    } finally {
      setRefreshingPublishStatus(false);
    }
  }, [
    applyPublishProgress,
    campaignData,
    draftId,
    onDraftSaved,
    businessId,
    onClose,
  ]);

  const handlePublish = useCallback(async () => {
    if (!draftId || !campaignData || !adSetData || !adCreativeData) {
      setError("Complete all steps before publishing.");
      return;
    }

    if (publishSuccess || publishStartedRef.current) {
      return;
    }

    publishStartedRef.current = true;
    setPublishing(true);
    setPublishPhase("QUEUED");
    setPublishStep(null);
    setPublishProgress(0);
    setError(null);

    try {
      const result = await publishMetaCampaignDraft(
        businessId,
        draftId,
        {
          campaignName: campaignData.name,
          adSetName: adSetData.name,
          creativeName: adCreativeData.name,
          facebookPageId: adCreativeData.facebookPageId,
        },
        (draft) => {
          applyPublishProgress(draft);
        },
      );
      setPartialMeta(null);
      setError(null);
      setPublishPhase("PUBLISHED");
      setPublishStep("done");
      setPublishProgress(100);
      setPublishSuccess(result);
      clearMetaDraftLocalState(businessId);
      if (
        shouldOpenMetaAdsManagerAfterPublish(campaignData) &&
        result.adsManagerUrl?.trim()
      ) {
        openMetaAdsManager(result.adsManagerUrl);
      }
      onDraftSaved?.({
        id: draftId,
        businessId,
        currentStep: 4,
        status: "published",
        campaignData,
        adSetData,
        adCreativeData,
        metaCampaignId: result.metaCampaignId,
        metaAdsetId: result.metaAdsetId,
        metaCreativeId: result.metaCreativeId,
        metaAdId: result.metaAdId,
        errorMessage: null,
        version: draftVersion,
        completedSteps: [1, 2, 3, 4],
        lastSavedAt: null,
        publishStatus: "PUBLISHED",
        publishStep: "done",
        publishProgress: 100,
        publishedAt: new Date().toISOString(),
        createdAt: "",
        updatedAt: "",
      });
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not publish campaign to Meta.";
      setError(message);
      setPublishPhase("FAILED");

      if (draftId) {
        try {
          const refreshed = await getMetaCampaignDraft(businessId, draftId);
          applyDraftState(refreshed);
          if (refreshed.metaCampaignId && !refreshed.metaAdId) {
            setPartialMeta({
              metaCampaignId: refreshed.metaCampaignId,
              metaAdsetId: refreshed.metaAdsetId,
              metaCreativeId: refreshed.metaCreativeId,
              previousError: refreshed.errorMessage ?? message,
            });
          }
          if (refreshed.errorMessage?.trim()) {
            setError(refreshed.errorMessage);
          }
        } catch {
          
        }
      }
    } finally {
      setPublishing(false);
      publishStartedRef.current = false;
    }
  }, [
    adCreativeData,
    adSetData,
    applyDraftState,
    applyPublishProgress,
    campaignData,
    draftId,
    draftVersion,
    onDraftSaved,
    businessId,
    publishSuccess,
    onClose,
  ]);

  
  useEffect(() => {
    if (!open || !draftId) return;
    if (resumeHandledRef.current) return;

    const status = (initialDraft?.status ?? "").toLowerCase();
    const publishStatus = (initialDraft?.publishStatus ?? "").toUpperCase();
    const isPublishing =
      status === "publishing" ||
      publishStatus === "QUEUED" ||
      publishStatus === "PUBLISHING" ||
      publishStatus === "RUNNING";

    if (isPublishing && initialDraft) {
      resumeHandledRef.current = true;
      setPublishing(true);
      setCurrentStep(4);
      publishStartedRef.current = true;
      void pollMetaPublishUntilDone(businessId, draftId, (draft) => {
        applyPublishProgress(draft);
      })
        .then((result) => {
          setPartialMeta(null);
          setError(null);
          setPublishPhase("PUBLISHED");
          setPublishStep("done");
          setPublishProgress(100);
          setPublishSuccess(result);
          clearMetaDraftLocalState(businessId);
          const liveCampaign = campaignData ?? initialDraft.campaignData;
          if (
            liveCampaign &&
            shouldOpenMetaAdsManagerAfterPublish(liveCampaign) &&
            result.adsManagerUrl?.trim()
          ) {
            openMetaAdsManager(result.adsManagerUrl);
          }
          onDraftSaved?.({
            ...initialDraft,
            status: "published",
            publishStatus: "PUBLISHED",
            metaCampaignId: result.metaCampaignId,
            metaAdsetId: result.metaAdsetId,
            metaCreativeId: result.metaCreativeId,
            metaAdId: result.metaAdId,
            publishStep: "done",
            publishProgress: 100,
            version: initialDraft.version ?? 1,
            completedSteps: initialDraft.completedSteps ?? [1, 2, 3, 4],
            lastSavedAt: initialDraft.lastSavedAt ?? null,
          });
          onClose();
        })
        .catch((err: unknown) => {
          setError(
            err instanceof Error
              ? err.message
              : "Publish failed on Meta. Review the error and try again.",
          );
          setPublishPhase("FAILED");
        })
        .finally(() => {
          setPublishing(false);
          publishStartedRef.current = false;
        });
      return;
    }

    if (autoStartPublish) {
      resumeHandledRef.current = true;
      setCurrentStep(4);
      
      const timer = setTimeout(() => {
        void handlePublish();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [
    open,
    draftId,
    initialDraft,
    autoStartPublish,
    businessId,
    applyPublishProgress,
    campaignData,
    handlePublish,
    onClose,
    onDraftSaved,
  ]);

  useEffect(() => {
    if (open) return;
    sessionHydratedRef.current = false;
    setCurrentStep(initialStepFromDraft(initialDraft));
    setDraftId(initialDraftId ?? initialDraft?.id ?? null);
    setDraftVersion(initialDraft?.version ?? 1);
    setCampaignData(initialDraft?.campaignData ?? null);
    setAdSetData(initialDraft?.adSetData ?? null);
    setAdCreativeData(initialDraft?.adCreativeData ?? null);
    setSaving(false);
    setAutosaveState("idle");
    setPublishing(false);
    setPublishPhase(initialDraft?.publishStatus ?? null);
    setPublishStep(initialDraft?.publishStep ?? null);
    setPublishProgress(initialDraft?.publishProgress ?? 0);
    setError(
      initialDraft?.status === "failed" ? initialDraft.errorMessage : null,
    );
    setPublishSuccess(null);
    setPartialMeta(initialDraft ? applyDraftToPartialMeta(initialDraft) : null);
    setRefreshingPublishStatus(false);
    publishStartedRef.current = false;
    resumeHandledRef.current = false;
    autosaveSkipRef.current = true;
    lastAutosavePayloadRef.current = "";
  }, [open, initialDraft, initialDraftId]);

  useEffect(() => {
    if (!open) return;
    if (sessionHydratedRef.current) return;
    sessionHydratedRef.current = true;
    autosaveSkipRef.current = true;
    const recovery = readMetaDraftRecovery(businessId);

    if (initialDraft) {
      applyDraftState(initialDraft);
      let step = initialStepFromDraft(initialDraft);
      if (recovery && recovery.draftId === initialDraft.id) {
        if (recovery.currentStep >= 1) {
          step = Math.min(Math.max(recovery.currentStep, 1), 4);
        }
        const recoveryNewer =
          !!recovery.updatedAt &&
          !!initialDraft.updatedAt &&
          new Date(recovery.updatedAt).getTime() >
            new Date(initialDraft.updatedAt).getTime();
        if (recoveryNewer) {
          if (recovery.campaignData) setCampaignData(recovery.campaignData);
          if (recovery.adSetData) setAdSetData(recovery.adSetData);
          if (recovery.adCreativeData) {
            const serverCreative = initialDraft.adCreativeData;
            setAdCreativeData({
              ...(serverCreative ?? {}),
              ...recovery.adCreativeData,
              imageUrl:
                recovery.adCreativeData.imageUrl?.trim() ||
                serverCreative?.imageUrl,
              videoUrl:
                recovery.adCreativeData.videoUrl?.trim() ||
                serverCreative?.videoUrl,
              thumbnailUrl:
                recovery.adCreativeData.thumbnailUrl?.trim() ||
                serverCreative?.thumbnailUrl,
              carouselCards:
                recovery.adCreativeData.carouselCards?.length
                  ? recovery.adCreativeData.carouselCards
                  : serverCreative?.carouselCards,
            } as AdCreativeStepData);
          }
        }
      }
      setCurrentStep(step);
      if (initialDraft.status === "failed" && initialDraft.errorMessage) {
        setError(initialDraft.errorMessage);
      }
      return;
    }

    if (recovery && (recovery.campaignData || recovery.draftId)) {
      const step = recovery.draftId
        ? Math.min(Math.max(recovery.currentStep || 1, 1), 4)
        : 1;
      setCurrentStep(step);
      setDraftId(recovery.draftId ?? initialDraftId);
      setDraftVersion(1);
      setCampaignData(recovery.campaignData);
      setAdSetData(recovery.draftId ? recovery.adSetData : null);
      setAdCreativeData(recovery.draftId ? recovery.adCreativeData : null);
      setPartialMeta(null);
      setError(null);
      return;
    }

    setCurrentStep(1);
    setDraftId(initialDraftId);
    setDraftVersion(1);
    setCampaignData(null);
    setAdSetData(null);
    setAdCreativeData(null);
    setPartialMeta(null);
    setError(null);
  }, [open, initialDraft, initialDraftId, applyDraftState, businessId]);

  if (!open) return null;

  const autosaveLabel =
    autosaveState === "saving"
      ? "Saving…"
      : autosaveState === "saved"
        ? "Saved"
        : autosaveState === "error"
          ? "Retry Save"
          : null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${metaBuilderShellClass}`}>
      <div className="absolute right-3 top-3 z-20 flex items-center gap-2 sm:right-5 sm:top-4">
        {autosaveLabel ? (
          <button
            type="button"
            disabled={autosaveState === "saving"}
            onClick={() => {
              if (autosaveState === "error") {
                void runAutosave();
              }
            }}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm ${
              autosaveState === "error"
                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : autosaveState === "saving"
                  ? "border-[#dbeafe] bg-[#f4f8ff] text-[#1877f2]"
                  : "border-[#e8edf5] bg-white text-slate-500"
            }`}
          >
            {autosaveLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-[#e8edf5] bg-white p-2.5 text-slate-500 shadow-sm transition hover:bg-[#f4f8ff] hover:text-[#1877f2]"
          aria-label="Close builder"
        >
          <X className="size-5" />
        </button>
      </div>

      <BuilderStepNav
        currentStep={currentStep}
        maxReachableStep={maxReachableStep}
        onStepClick={handleStepClick}
      />

      <main ref={stepScrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
          {saving && !publishing ? (
            <BuilderLoadingBanner message="Saving draft…" />
          ) : null}

          {publishing ? (
            <BuilderLoadingBanner
              message={`Publishing to Meta… ${
                publishStep
                  ? publishStep.split("_").join(" ")
                  : publishPhase
                    ? String(publishPhase).split("_").join(" ")
                    : "starting job"
              }. You can leave this open while the worker finishes.`}
            />
          ) : null}

          {currentStep === 1 ? (
            <CampaignSetupStep
              key={`campaign-setup-${initialObjective ?? "default"}-${draftId ?? "new"}`}
              defaultName={defaultName}
              preferredObjective={initialObjective}
              initialData={campaignData}
              accountCurrency={accountCurrency}
              saving={saving}
              error={error}
              onBack={onClose}
              onSave={handleSaveCampaignStep}
              onWorkingChange={handleCampaignWorkingChange}
            />
          ) : null}

          {currentStep === 2 && draftId && campaignData ? (
            <AdSetSetupStep
              businessId={businessId}
              draftId={draftId}
              campaignData={campaignData}
              initialData={adSetData}
              accountCurrency={accountCurrency}
              saving={saving}
              error={error}
              onBack={onClose}
              onPrevious={() => setCurrentStep(1)}
              onSave={handleSaveAdSetStep}
            />
          ) : null}

          {currentStep === 2 && (!draftId || !campaignData) ? (
            <PlaceholderBuilderStep
              title="Ad Set"
              description="Complete Step 1 (Campaign) first."
              onBack={onClose}
              onPrevious={() => setCurrentStep(1)}
            />
          ) : null}

          {currentStep === 3 && draftId && campaignData && adSetData ? (
            <AdCreativeSetupStep
              key={`ad-creative-${draftId}`}
              businessId={businessId}
              draftId={draftId}
              campaignData={campaignData}
              adSetData={adSetData}
              defaultWebsiteUrl={defaultWebsiteUrl}
              initialData={adCreativeData}
              saving={saving}
              error={error}
              onBack={onClose}
              onPrevious={() => setCurrentStep(2)}
              onSave={handleSaveAdCreativeStep}
              onWorkingChange={handleAdCreativeWorkingChange}
            />
          ) : null}

          {currentStep === 3 && (!draftId || !campaignData || !adSetData) ? (
            <PlaceholderBuilderStep
              title="Ad"
              description="Complete Steps 1 and 2 first."
              onBack={onClose}
              onPrevious={() => setCurrentStep(2)}
            />
          ) : null}

          {currentStep === 4 && draftId && campaignData && adSetData && adCreativeData ? (
            <ReviewPublishStep
              businessId={businessId}
              draftId={draftId}
              campaignData={campaignData}
              adSetData={adSetData}
              adCreativeData={adCreativeData}
              accountCurrency={accountCurrency}
              publishing={publishing}
              publishError={error}
              publishStep={publishStep}
              publishProgress={publishProgress}
              partialPublish={partialMeta ?? undefined}
              publishSuccess={publishSuccess}
              onBack={onClose}
              onPrevious={() => setCurrentStep(3)}
              onPublish={handlePublish}
              onRefreshStatus={handleRefreshPublishStatus}
              refreshingStatus={refreshingPublishStatus}
            />
          ) : null}

          {currentStep === 4 && (!draftId || !campaignData || !adSetData || !adCreativeData) ? (
            <PlaceholderBuilderStep
              title="Review & Publish"
              description="Complete Steps 1–3 before reviewing and publishing."
              onBack={onClose}
              onPrevious={() => setCurrentStep(3)}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
