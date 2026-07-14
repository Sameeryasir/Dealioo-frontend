"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  BuilderLoadingBanner,
  BuilderSuccessAlert,
  metaBuilderShellClass,
} from "@/app/components/campaign/meta-builder/builder-ui";
import type {
  AdCreativeStepData,
  AdSetStepData,
  CampaignStepData,
  MetaCampaignDraft,
} from "@/app/lib/meta-campaign-builder-types";
import {
  buildMetaAdsManagerUrl,
  openMetaAdsManager,
  shouldOpenMetaAdsManagerAfterPublish,
} from "@/app/lib/meta-campaign-builder-types";
import { getSetupAccessToken } from "@/app/lib/setup-access-token";
import { getFacebookConnectionStatus } from "@/app/services/facebook/get-facebook-connection-status";
import { AdCreativeSetupStep } from "@/app/components/campaign/meta-builder/AdCreativeSetupStep";
import { AdSetSetupStep } from "@/app/components/campaign/meta-builder/AdSetSetupStep";
import { BuilderStepNav } from "@/app/components/campaign/meta-builder/BuilderStepNav";
import { CampaignSetupStep } from "@/app/components/campaign/meta-builder/CampaignSetupStep";
import { PlaceholderBuilderStep } from "@/app/components/campaign/meta-builder/PlaceholderBuilderStep";
import { ReviewPublishStep } from "@/app/components/campaign/meta-builder/ReviewPublishStep";
import {
  getMetaCampaignDraft,
  publishMetaCampaignDraft,
  saveAdCreativeStep,
  saveAdSetStep,
  saveCampaignStep,
  type PublishMetaCampaignResult,
} from "@/app/services/facebook/meta-campaign-draft";

type MetaCampaignBuilderProps = {
  open: boolean;
  businessId: number;
  defaultName?: string;
  defaultWebsiteUrl?: string;
  draftId?: string | null;
  initialDraft?: MetaCampaignDraft | null;
  onClose: () => void;
  onDraftSaved?: (draft: MetaCampaignDraft) => void;
};

export function MetaCampaignBuilder({
  open,
  businessId,
  defaultName = "",
  defaultWebsiteUrl,
  draftId: initialDraftId = null,
  initialDraft = null,
  onClose,
  onDraftSaved,
}: MetaCampaignBuilderProps) {
  const [currentStep, setCurrentStep] = useState(
    initialDraft?.currentStep && initialDraft.currentStep > 1
      ? initialDraft.currentStep
      : 1,
  );
  const [draftId, setDraftId] = useState<string | null>(
    initialDraftId ?? initialDraft?.id ?? null,
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
  const [publishing, setPublishing] = useState(false);
  const [publishPhase, setPublishPhase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] =
    useState<PublishMetaCampaignResult | null>(null);
  const [partialMeta, setPartialMeta] = useState<{
    metaCampaignId?: string | null;
    metaAdsetId?: string | null;
    metaCreativeId?: string | null;
    previousError?: string | null;
  } | null>(
    initialDraft?.metaCampaignId && !initialDraft?.metaAdId
      ? {
          metaCampaignId: initialDraft.metaCampaignId,
          metaAdsetId: initialDraft.metaAdsetId,
          metaCreativeId: initialDraft.metaCreativeId,
          previousError: initialDraft.errorMessage,
        }
      : null,
  );

  const [refreshingPublishStatus, setRefreshingPublishStatus] = useState(false);
  const [postPublishMessage, setPostPublishMessage] = useState<string | null>(
    null,
  );

  const publishStartedRef = useRef(false);

  const resetToNewCampaignForm = useCallback((successMessage?: string) => {
    setCurrentStep(1);
    setDraftId(null);
    setCampaignData(null);
    setAdSetData(null);
    setAdCreativeData(null);
    setPublishSuccess(null);
    setPartialMeta(null);
    setError(null);
    setPublishPhase(null);
    setPublishing(false);
    publishStartedRef.current = false;
    setPostPublishMessage(
      successMessage?.trim() ||
        "Campaign published to Meta. Start a new campaign below.",
    );
  }, []);

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

  const handleSaveCampaignStep = useCallback(
    async (data: CampaignStepData) => {
      setSaving(true);
      setError(null);
      try {
        const draft = await saveCampaignStep(businessId, {
          ...data,
          draftId: draftId ?? undefined,
        });
        setDraftId(draft.id);
        setCampaignData(draft.campaignData);
        setCurrentStep(2);
        onDraftSaved?.(draft);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not save campaign step.",
        );
      } finally {
        setSaving(false);
      }
    },
    [draftId, onDraftSaved, businessId],
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
        setAdSetData(draft.adSetData);
        setCurrentStep(3);
        onDraftSaved?.(draft);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not save ad set step.",
        );
      } finally {
        setSaving(false);
      }
    },
    [draftId, onDraftSaved, businessId],
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
        setAdCreativeData(draft.adCreativeData);
        setCurrentStep(4);
        onDraftSaved?.(draft);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not save ad creative step.",
        );
      } finally {
        setSaving(false);
      }
    },
    [draftId, onDraftSaved, businessId],
  );

  const handleRefreshPublishStatus = useCallback(async () => {
    if (!draftId || !campaignData) return;

    setRefreshingPublishStatus(true);
    setError(null);
    try {
      const refreshed = await getMetaCampaignDraft(businessId, draftId, 15_000);
      if (
        refreshed.status === "published" &&
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
            /* optional, link still shown in review if available */
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
          message:
            deliveryStatus === "ACTIVE"
              ? "Campaign published to Meta as Active."
              : "Campaign published successfully to Meta (paused).",
        };
        setPartialMeta(null);
        onDraftSaved?.(refreshed);
        if (
          shouldOpenMetaAdsManagerAfterPublish(campaignData) &&
          adsManagerUrl
        ) {
          openMetaAdsManager(adsManagerUrl);
        }
        resetToNewCampaignForm(result.message);
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
  }, [campaignData, draftId, onDraftSaved, businessId, resetToNewCampaignForm]);

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
    setPublishPhase("PENDING");
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
          setPublishPhase(draft.publishStatus ?? draft.status);
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
      );
      setPartialMeta(null);
      setError(null);
      setPublishPhase("PUBLISHED");
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
        publishStatus: "PUBLISHED",
        createdAt: "",
        updatedAt: "",
      });
      resetToNewCampaignForm(result.message);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not publish campaign to Meta.";
      setError(message);
      setPublishPhase("FAILED");

      if (draftId) {
        try {
          const refreshed = await getMetaCampaignDraft(businessId, draftId);
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
    campaignData,
    draftId,
    onDraftSaved,
    businessId,
    publishSuccess,
    resetToNewCampaignForm,
  ]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${metaBuilderShellClass}`}>
      <div className="absolute right-3 top-3 z-20 sm:right-5 sm:top-4">
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

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
          {saving && !publishing ? (
            <BuilderLoadingBanner message="Saving draft…" />
          ) : null}

          {publishing ? (
            <BuilderLoadingBanner
              message={`Publishing to Meta… ${
                publishPhase
                  ? publishPhase.split("_").join(" ")
                  : "starting job"
              }. You can leave this open while the worker finishes.`}
            />
          ) : null}

          {currentStep === 1 ? (
            <>
              {postPublishMessage ? (
                <BuilderSuccessAlert
                  title="Published to Meta"
                  message={postPublishMessage}
                />
              ) : null}
              <CampaignSetupStep
                key={postPublishMessage ? "new-after-publish" : "campaign-setup"}
                defaultName={defaultName}
                initialData={campaignData}
                saving={saving}
                error={error}
                onBack={onClose}
                onSave={async (data) => {
                  setPostPublishMessage(null);
                  await handleSaveCampaignStep(data);
                }}
              />
            </>
          ) : null}

          {currentStep === 2 && draftId && campaignData ? (
            <AdSetSetupStep
              draftId={draftId}
              campaignData={campaignData}
              initialData={adSetData}
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
            />
          ) : null}

          {currentStep === 3 && (!draftId || !campaignData || !adSetData) ? (
            <PlaceholderBuilderStep
              title="Ad / Creative"
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
              publishing={publishing}
              publishError={error}
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
