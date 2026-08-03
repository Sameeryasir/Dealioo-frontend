"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  googleBuilderPrimaryButtonClass,
  googleBuilderSecondaryButtonClass,
  googleBuilderShellClass,
} from "@/app/components/google-ads/campaign-builder/google-builder-ui";
import { renderCampaignBuilderStep } from "@/app/components/google-ads/campaign-builder/CampaignBuilderSteps";
import {
  clearGoogleCampaignDraft,
  loadGoogleCampaignDraft,
  loadGoogleCampaignServerDraftId,
  loadGoogleDraftLocalMeta,
  saveGoogleCampaignDraft,
  saveGoogleCampaignServerDraftId,
  saveGoogleDraftLocalMeta,
} from "@/app/components/google-ads/campaign-builder/draft-storage";
import {
  STEP_TITLES,
  TOTAL_WIZARD_STEPS,
  createDefaultDraft,
  type GoogleCampaignBuilderDraft,
} from "@/app/components/google-ads/campaign-builder/types";
import {
  getGoogleStepSnapshot,
  seedSavedStepSnapshots,
} from "@/app/components/google-ads/campaign-builder/step-snapshots";
import {
  validateAllRequiredSteps,
  validateStep,
} from "@/app/components/google-ads/campaign-builder/validation";
import {
  DRAFT_CONFLICT_MESSAGE,
  GoogleDraftConflictError,
  getGoogleCampaignDraft,
  googlePublishStepLabel,
  pollGooglePublishUntilDone,
  publishGoogleCampaignDraft,
  saveGoogleAdsStep,
  saveGoogleAudienceStep,
  saveGoogleBudgetStep,
  saveGoogleCampaignInfoStep,
  saveGoogleExtrasStep,
  saveGoogleGoalDetailsStep,
  saveGoogleGoalStep,
  saveGoogleKeywordsStep,
  saveGoogleLanguagesStep,
  saveGoogleLocationsStep,
  updateGoogleDraftProgress,
} from "@/app/services/google-ads/google-campaign-draft";

type CampaignBuilderWizardProps = {
  open: boolean;
  businessId: number;
  onClose: () => void;
  adsConsoleUrl?: string;
  defaultBusinessName?: string;
  defaultWebsiteUrl?: string;
};

const PUBLISH_PHASES = [
  "Preparing your campaign",
  "Setting your budget",
  "Applying locations & languages",
  "Creating your ads",
  "Adding extras",
  "Publishing",
];

function resolveSaveError(err: unknown, fallback: string): string {
  if (err instanceof GoogleDraftConflictError) {
    return err.message || DRAFT_CONFLICT_MESSAGE;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function CampaignBuilderWizard({
  open,
  businessId,
  onClose,
  adsConsoleUrl,
  defaultBusinessName = "",
  defaultWebsiteUrl = "",
}: CampaignBuilderWizardProps) {
  const titleId = useId();
  
  const [formData, setFormData] = useState<GoogleCampaignBuilderDraft>(() =>
    createDefaultDraft(),
  );
  
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftSavedFlash, setDraftSavedFlash] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishPhase, setPublishPhase] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishedAdsConsoleUrl, setPublishedAdsConsoleUrl] = useState<
    string | null
  >(null);
  const [hasAutosaved, setHasAutosaved] = useState(false);
  const [serverDraftId, setServerDraftId] = useState<string | null>(null);
  const [serverVersion, setServerVersion] = useState<number | null>(null);
  const [savingGoal, setSavingGoal] = useState(false);
  
  const [syncingDraft, setSyncingDraft] = useState(false);
  const [goalSaveError, setGoalSaveError] = useState<string | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipAutosave = useRef(true);
  const formDataRef = useRef(formData);
  const currentStepRef = useRef(currentStep);
  const serverDraftIdRef = useRef(serverDraftId);
  const serverVersionRef = useRef(serverVersion);
  const savedStepSnapshotsRef = useRef<Record<number, string>>({});
  const syncInFlightRef = useRef(false);
  const serverCompletedStepsRef = useRef<number[]>([]);

  
  const draft = formData;

  const markStepSaved = useCallback(
    (stepNumber: number, nextDraft: GoogleCampaignBuilderDraft) => {
      savedStepSnapshotsRef.current[stepNumber] = getGoogleStepSnapshot(
        stepNumber,
        nextDraft,
      );
    },
    [],
  );

  const isStepUnchanged = useCallback(
    (stepNumber: number, nextDraft: GoogleCampaignBuilderDraft) => {
      const previous = savedStepSnapshotsRef.current[stepNumber];
      if (previous == null) return false;
      return previous === getGoogleStepSnapshot(stepNumber, nextDraft);
    },
    [],
  );

  
  const rememberServerVersion = useCallback(
    (version: number, draftId: string) => {
      setServerVersion(version);
      saveGoogleDraftLocalMeta(businessId, {
        draftId,
        serverVersion: version,
        updatedAt: new Date().toISOString(),
      });
    },
    [businessId],
  );

  const clearPublishedDraftLocally = useCallback(() => {
    clearGoogleCampaignDraft(businessId);
    setServerDraftId(null);
    setServerVersion(null);
    serverDraftIdRef.current = null;
    serverVersionRef.current = null;
    serverCompletedStepsRef.current = [];
    savedStepSnapshotsRef.current = {};
  }, [businessId]);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    serverDraftIdRef.current = serverDraftId;
  }, [serverDraftId]);

  useEffect(() => {
    serverVersionRef.current = serverVersion;
  }, [serverVersion]);

  const applyWorkingCopy = useCallback(
    (next: GoogleCampaignBuilderDraft, stepOverride?: number) => {
      const step = Math.min(
        TOTAL_WIZARD_STEPS,
        Math.max(1, stepOverride ?? next.currentStep ?? 1),
      );
      const withStep = { ...next, currentStep: step };
      setFormData(withStep);
      setCurrentStep(step);
      formDataRef.current = withStep;
      currentStepRef.current = step;
    },
    [],
  );

  
  
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    syncInFlightRef.current = false;

    setErrors({});
    setPublishing(false);
    setPublishProgress(0);
    setPublishPhase(null);
    setPublishError(null);
    setPublishSuccess(false);
    setHasAutosaved(false);
    setSavingGoal(false);
    setGoalSaveError(null);
    skipAutosave.current = true;
    savedStepSnapshotsRef.current = {};
    serverCompletedStepsRef.current = [];

    const localDraft = loadGoogleCampaignDraft(businessId);
    const meta = loadGoogleDraftLocalMeta(businessId);
    const storedDraftId =
      meta.draftId ?? loadGoogleCampaignServerDraftId(businessId);

    const applyFreshDefaults = () => {
      const fresh = createDefaultDraft();
      if (defaultBusinessName.trim()) {
        fresh.businessName = defaultBusinessName.trim();
        fresh.extensionBusinessName = defaultBusinessName.trim();
      }
      if (defaultWebsiteUrl.trim()) {
        fresh.websiteUrl = defaultWebsiteUrl.trim();
        fresh.landingPageUrl = defaultWebsiteUrl.trim();
      }
      applyWorkingCopy(fresh, 1);
    };

    
    setServerDraftId(storedDraftId);
    if (typeof meta.serverVersion === "number") {
      setServerVersion(meta.serverVersion);
    } else {
      setServerVersion(null);
    }

    if (localDraft) {
      applyWorkingCopy(localDraft);
      
      const priorSteps = Array.from(
        { length: Math.max(0, (localDraft.currentStep ?? 1) - 1) },
        (_, i) => i + 1,
      );
      savedStepSnapshotsRef.current = seedSavedStepSnapshots(
        localDraft,
        priorSteps,
      );
    } else {
      applyFreshDefaults();
    }

    if (!storedDraftId) {
      setSyncingDraft(false);
      return;
    }

    syncInFlightRef.current = true;
    setSyncingDraft(true);

    const reconcile = async () => {
      try {
        const remote = await getGoogleCampaignDraft(businessId, storedDraftId);
        if (cancelled) return;

        const remoteStatus = (remote.status ?? "").toUpperCase();
        if (remoteStatus === "PUBLISHED") {
          clearGoogleCampaignDraft(businessId);
          setServerDraftId(null);
          setServerVersion(null);
          applyFreshDefaults();
          return;
        }

        const resumed: GoogleCampaignBuilderDraft = {
          ...createDefaultDraft(),
          ...(remote.draftData ?? {}),
          goal: remote.goal ?? remote.draftData?.goal ?? null,
          campaignName:
            remote.campaignName || remote.draftData?.campaignName || "",
          currentStep: Math.min(
            TOTAL_WIZARD_STEPS,
            Math.max(
              1,
              remote.currentStep || remote.draftData?.currentStep || 1,
            ),
          ),
          savedAt: remote.lastSavedAt ?? new Date().toISOString(),
        };

        setServerDraftId(remote.id);
        setServerVersion(remote.version);
        serverCompletedStepsRef.current = remote.completedSteps ?? [];
        saveGoogleCampaignServerDraftId(businessId, remote.id);
        saveGoogleDraftLocalMeta(businessId, {
          draftId: remote.id,
          serverVersion: remote.version,
          updatedAt: remote.lastSavedAt,
        });

        applyWorkingCopy(resumed);
        saveGoogleCampaignDraft(businessId, resumed);
        savedStepSnapshotsRef.current = seedSavedStepSnapshots(
          resumed,
          serverCompletedStepsRef.current,
        );
      } catch {
        if (cancelled) return;
        setServerDraftId(null);
        setServerVersion(null);
        saveGoogleCampaignServerDraftId(businessId, null);
        saveGoogleDraftLocalMeta(businessId, {
          draftId: null,
          serverVersion: null,
          updatedAt: null,
        });
      } finally {
        syncInFlightRef.current = false;
        if (!cancelled) setSyncingDraft(false);
      }
    };

    void reconcile();
    return () => {
      cancelled = true;
    };
  }, [
    open,
    businessId,
    defaultBusinessName,
    defaultWebsiteUrl,
    applyWorkingCopy,
  ]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !publishing && !savingGoal) {
        void persistProgressAndClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, publishing, savingGoal]);

  useEffect(() => {
    if (!open) return;
    if (publishSuccess) return;
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveGoogleCampaignDraft(businessId, draft);
      setHasAutosaved(true);
    }, 700);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [draft, businessId, open, publishSuccess]);

  const step = currentStep;

  const patchDraft = useCallback(
    (patch: Partial<GoogleCampaignBuilderDraft>) => {
      setFormData((prev) => {
        const next = { ...prev, ...patch };
        
        if (typeof patch.currentStep === "number") {
          const clamped = Math.min(
            TOTAL_WIZARD_STEPS,
            Math.max(1, patch.currentStep),
          );
          next.currentStep = clamped;
          setCurrentStep(clamped);
          currentStepRef.current = clamped;
        }
        formDataRef.current = next;
        return next;
      });
      setErrors((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(patch)) delete next[key];
        return next;
      });
    },
    [],
  );

  const goToStep = (nextStep: number) => {
    const clamped = Math.min(TOTAL_WIZARD_STEPS, Math.max(1, nextStep));
    setCurrentStep(clamped);
    currentStepRef.current = clamped;
    setFormData((prev) => {
      const next = { ...prev, currentStep: clamped };
      formDataRef.current = next;
      return next;
    });
    setErrors({});
    setGoalSaveError(null);
  };

  
  const advanceWithoutApi = useCallback((fromStep: number) => {
    const nextStep = Math.min(fromStep + 1, TOTAL_WIZARD_STEPS);
    setCurrentStep(nextStep);
    currentStepRef.current = nextStep;
    setFormData((prev) => {
      const next = { ...prev, currentStep: nextStep };
      formDataRef.current = next;
      saveGoogleCampaignDraft(businessId, next);
      return next;
    });
    setErrors({});
    setGoalSaveError(null);
  }, [businessId]);

  const handleBack = () => {
    if (
      step === 2 &&
      draft.goal === "WEBSITE_TRAFFIC" &&
      draft.goalDetailSubstep > 0
    ) {
      patchDraft({ goalDetailSubstep: 0 });
      setErrors({});
      return;
    }
    if (step <= 1) {
      void persistProgressAndClose();
      return;
    }
    goToStep(step - 1);
  };

  const handleContinue = async () => {
    const stepErrors = validateStep(step, draft);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;

    if (
      step === 2 &&
      draft.goal === "WEBSITE_TRAFFIC" &&
      draft.goalDetailSubstep < 1
    ) {
      patchDraft({ goalDetailSubstep: 1 });
      setErrors({});
      return;
    }

    
    if (step >= 1 && step <= 10 && isStepUnchanged(step, draft)) {
      advanceWithoutApi(step);
      return;
    }

    if (step === 1) {
      if (!draft.goal) {
        setErrors({ goal: "Pick a marketing goal to continue." });
        return;
      }

      setSavingGoal(true);
      setGoalSaveError(null);
      try {
        let saved;
        try {
          saved = await saveGoogleGoalStep(businessId, {
            goal: draft.goal,
            draftId: serverDraftId ?? undefined,
            expectedVersion: serverDraftId ? (serverVersion ?? 1) : undefined,
          });
        } catch (firstErr) {
          const message =
            firstErr instanceof Error ? firstErr.message.toLowerCase() : "";
          if (
            serverDraftId &&
            (message.includes("draft not found") || message.includes("not found"))
          ) {
            setServerDraftId(null);
            setServerVersion(null);
            saveGoogleCampaignServerDraftId(businessId, null);
            saveGoogleDraftLocalMeta(businessId, {
              draftId: null,
              serverVersion: null,
              updatedAt: null,
            });
            saved = await saveGoogleGoalStep(businessId, {
              goal: draft.goal,
            });
          } else {
            throw firstErr;
          }
        }

        setServerDraftId(saved.id);
        saveGoogleCampaignServerDraftId(businessId, saved.id);
        rememberServerVersion(saved.version, saved.id);

        const nextDraft: GoogleCampaignBuilderDraft = {
          ...draft,
          goal: saved.goal ?? draft.goal,
          campaignName: saved.campaignName || draft.campaignName,
          goalDetailSubstep: 0,
          currentStep: 2,
          savedAt: new Date().toISOString(),
        };
        markStepSaved(1, nextDraft);
        applyWorkingCopy(nextDraft, 2);
        saveGoogleCampaignDraft(businessId, nextDraft);
        setHasAutosaved(true);
        setDraftSavedFlash(true);
        window.setTimeout(() => setDraftSavedFlash(false), 1600);
        setErrors({});
      } catch (err) {
        setGoalSaveError(
          resolveSaveError(
            err,
            "Could not save marketing goal. Please try again.",
          ),
        );
      } finally {
        setSavingGoal(false);
      }
      return;
    }

    if (step === 2) {
      if (!serverDraftId) {
        setGoalSaveError("Complete Step 1 (Marketing Goal) first.");
        return;
      }

      setSavingGoal(true);
      setGoalSaveError(null);
      try {
        const saved = await saveGoogleGoalDetailsStep(businessId, {
          draftId: serverDraftId,
          expectedVersion: serverVersion ?? 1,
          salesChannel: draft.salesChannel,
          websiteUrl: draft.websiteUrl,
          businessLocation: draft.businessLocation,
          businessPhone: draft.businessPhone,
          leadContactMethods: draft.leadContactMethods,
          landingPageUrl: draft.landingPageUrl || draft.websiteUrl,
          trafficAction: draft.trafficAction,
          businessName: draft.businessName,
          businessCategory: draft.businessCategory,
          businessAddress: draft.businessAddress,
          businessHours: draft.businessHours,
          appName: draft.appName,
          goalDetailSubstep: draft.goalDetailSubstep,
        });
        rememberServerVersion(saved.version, saved.id);

        const nextDraft: GoogleCampaignBuilderDraft = {
          ...draft,
          campaignName: saved.campaignName || draft.campaignName,
          businessName: saved.businessName || draft.businessName,
          currentStep: 3,
          savedAt: new Date().toISOString(),
        };
        markStepSaved(2, nextDraft);
        applyWorkingCopy(nextDraft, 3);
        saveGoogleCampaignDraft(businessId, nextDraft);
        setHasAutosaved(true);
        setDraftSavedFlash(true);
        window.setTimeout(() => setDraftSavedFlash(false), 1600);
        setErrors({});
      } catch (err) {
        setGoalSaveError(
          resolveSaveError(
            err,
            "Could not save goal details. Please try again.",
          ),
        );
      } finally {
        setSavingGoal(false);
      }
      return;
    }

    if (step === 3) {
      if (!serverDraftId) {
        setGoalSaveError("Complete earlier steps before saving campaign info.");
        return;
      }

      setSavingGoal(true);
      setGoalSaveError(null);
      try {
        const saved = await saveGoogleCampaignInfoStep(businessId, {
          draftId: serverDraftId,
          expectedVersion: serverVersion ?? 1,
          campaignName: draft.campaignName,
          businessName: draft.businessName,
          websiteUrl: draft.websiteUrl,
          businessCategory: draft.businessCategory,
          logoFileName: draft.logoFileName,
          logoPreviewUrl: draft.logoPreviewUrl,
          extensionBusinessName: draft.extensionBusinessName,
        });
        rememberServerVersion(saved.version, saved.id);

        const nextDraft: GoogleCampaignBuilderDraft = {
          ...draft,
          campaignName: saved.campaignName || draft.campaignName,
          businessName: saved.businessName || draft.businessName,
          websiteUrl: saved.websiteUrl || draft.websiteUrl,
          businessCategory: saved.businessCategory || draft.businessCategory,
          logoFileName: saved.logoFileName || draft.logoFileName,
          currentStep: 4,
          savedAt: new Date().toISOString(),
        };
        markStepSaved(3, nextDraft);
        applyWorkingCopy(nextDraft, 4);
        saveGoogleCampaignDraft(businessId, nextDraft);
        setHasAutosaved(true);
        setDraftSavedFlash(true);
        window.setTimeout(() => setDraftSavedFlash(false), 1600);
        setErrors({});
      } catch (err) {
        setGoalSaveError(
          resolveSaveError(
            err,
            "Could not save campaign info. Please try again.",
          ),
        );
      } finally {
        setSavingGoal(false);
      }
      return;
    }

    if (step >= 4 && step <= 10) {
      if (!serverDraftId) {
        setGoalSaveError("Complete earlier steps first.");
        return;
      }

      setSavingGoal(true);
      setGoalSaveError(null);
      try {
        const nextStep = Math.min(step + 1, TOTAL_WIZARD_STEPS);
        const expectedVersion = serverVersion ?? 1;

        let saved;
        if (step === 4) {
          saved = await saveGoogleBudgetStep(businessId, {
            draftId: serverDraftId,
            expectedVersion,
            dailyBudget: draft.dailyBudget,
            startDate: draft.startDate,
            endDate: draft.endDate,
          });
        } else if (step === 5) {
          saved = await saveGoogleLocationsStep(businessId, {
            draftId: serverDraftId,
            expectedVersion,
            targetLocations: draft.targetLocations,
            excludedLocationTargets: draft.excludedLocationTargets,
            countries: draft.countries,
            regions: draft.regions,
            cities: draft.cities,
            excludedLocations: draft.excludedLocations,
            radiusEnabled: draft.radiusEnabled,
            radiusCenter: draft.radiusCenter,
            radiusLat: draft.radiusLat,
            radiusLng: draft.radiusLng,
            radiusValue: draft.radiusValue,
            radiusUnit: draft.radiusUnit,
            radiusTargeting: draft.radiusTargeting,
            presenceOption: draft.presenceOption,
          });
        } else if (step === 6) {
          saved = await saveGoogleLanguagesStep(businessId, {
            draftId: serverDraftId,
            expectedVersion,
            languages: draft.languages,
          });
        } else if (step === 7) {
          saved = await saveGoogleAudienceStep(businessId, {
            draftId: serverDraftId,
            expectedVersion,
            ageRanges: draft.ageRanges,
            gender: draft.gender,
            householdIncome: draft.householdIncome,
            interests: draft.interests,
          });
        } else if (step === 8) {
          saved = await saveGoogleKeywordsStep(businessId, {
            draftId: serverDraftId,
            expectedVersion,
            businessType: draft.businessType,
            suggestedKeywords: draft.suggestedKeywords,
            customKeywords: draft.customKeywords,
            negativeKeywords: draft.negativeKeywords,
            keywordMatchType: draft.keywordMatchType,
          });
        } else if (step === 9) {
          saved = await saveGoogleAdsStep(businessId, {
            draftId: serverDraftId,
            expectedVersion,
            ads: draft.ads,
            adsGenerated: draft.adsGenerated,
          });
        } else {
          saved = await saveGoogleExtrasStep(businessId, {
            draftId: serverDraftId,
            expectedVersion,
            extensionBusinessName: draft.extensionBusinessName,
            phoneNumber: draft.phoneNumber,
            callouts: draft.callouts,
            structuredSnippetHeader: draft.structuredSnippetHeader,
            structuredSnippetValues: draft.structuredSnippetValues,
            useLocationExtension: draft.useLocationExtension,
            sitelinks: draft.sitelinks,
            assetsGenerated: draft.assetsGenerated,
          });
        }

        rememberServerVersion(saved.version, saved.id);

        const nextDraft: GoogleCampaignBuilderDraft = {
          ...draft,
          currentStep: nextStep,
          savedAt: new Date().toISOString(),
        };
        markStepSaved(step, nextDraft);
        applyWorkingCopy(nextDraft, nextStep);
        saveGoogleCampaignDraft(businessId, nextDraft);
        setHasAutosaved(true);
        setDraftSavedFlash(true);
        window.setTimeout(() => setDraftSavedFlash(false), 1600);
        setErrors({});
      } catch (err) {
        setGoalSaveError(
          resolveSaveError(err, "Could not save this step. Please try again."),
        );
      } finally {
        setSavingGoal(false);
      }
      return;
    }

    goToStep(Math.min(step + 1, TOTAL_WIZARD_STEPS));
  };

  
  const persistProgressAndClose = async () => {
    if (publishSuccess) {
      clearPublishedDraftLocally();
      onClose();
      return;
    }

    const activeDraftId = serverDraftIdRef.current;
    const activeDraft = {
      ...formDataRef.current,
      currentStep: currentStepRef.current,
    };
    if (activeDraftId) {
      try {
        const saved = await updateGoogleDraftProgress(
          businessId,
          activeDraftId,
          {
            expectedVersion: serverVersionRef.current ?? 1,
            currentStep: activeDraft.currentStep,
            goalDetailSubstep: activeDraft.goalDetailSubstep,
          },
        );
        if (typeof saved.version === "number") {
          rememberServerVersion(saved.version, saved.id);
        }
      } catch (err) {
        if (err instanceof GoogleDraftConflictError) {
          setGoalSaveError(err.message || DRAFT_CONFLICT_MESSAGE);
        }
        
      }
      saveGoogleCampaignDraft(businessId, activeDraft);
    }
    onClose();
  };

  const handlePublish = async () => {
    const allErrors = validateAllRequiredSteps(draft);
    if (Object.keys(allErrors).length > 0) {
      setPublishError(
        "Some required details are missing. Jump back and fix highlighted fields.",
      );
      for (let s = 1; s <= 10; s += 1) {
        const stepErrors = validateStep(s, draft, { forPublish: true });
        if (Object.keys(stepErrors).length > 0) {
          goToStep(s);
          setErrors(stepErrors);
          break;
        }
      }
      return;
    }

    if (!serverDraftId || serverVersion == null) {
      setPublishError("Save your draft on the server before publishing.");
      return;
    }

    setPublishing(true);
    setPublishError(null);
    setPublishSuccess(false);
    setPublishedAdsConsoleUrl(null);
    setPublishProgress(8);
    setPublishPhase(PUBLISH_PHASES[0]);

    try {
      setPublishPhase("Queuing publish…");
      const result = await publishGoogleCampaignDraft(businessId, {
        draftId: serverDraftId,
        expectedVersion: serverVersion,
      });
      rememberServerVersion(result.version, result.draftId);
      setPublishProgress(Math.max(result.publishProgress ?? 0, 8));
      setPublishPhase(googlePublishStepLabel(result.publishStep));

      const published = await pollGooglePublishUntilDone(
        businessId,
        result.draftId,
        (status) => {
          rememberServerVersion(status.version, status.draftId);
          setPublishProgress(Math.max(status.publishProgress ?? 0, 8));
          setPublishPhase(googlePublishStepLabel(status.publishStep));
          if (status.adsConsoleUrl) {
            setPublishedAdsConsoleUrl(status.adsConsoleUrl);
          }
        },
      );

      setPublishProgress(100);
      setPublishPhase("Published");
      setPublishSuccess(true);
      if (published.adsConsoleUrl) {
        setPublishedAdsConsoleUrl(published.adsConsoleUrl);
      }
      setPublishError(null);
      clearPublishedDraftLocally();
    } catch (err) {
      setPublishSuccess(false);
      setPublishError(
        resolveSaveError(
          err,
          "Could not publish your campaign. Please try again.",
        ),
      );
    } finally {
      setPublishing(false);
    }
  };

  const progressPct = useMemo(
    () => Math.round((step / TOTAL_WIZARD_STEPS) * 100),
    [step],
  );

  if (!open) return null;

  const isLastStep = step === TOTAL_WIZARD_STEPS;
  const primaryLabel = isLastStep
    ? publishSuccess
      ? "Done"
      : "Publish Campaign"
    : "Next";
  
  const busy = publishing || savingGoal;
  const resolvedAdsConsoleUrl = publishedAdsConsoleUrl || adsConsoleUrl || null;
  const nextDisabled = busy || (step === 1 && !draft.goal);

  return (
    <div
      className={`fixed inset-0 z-[80] flex flex-col ${googleBuilderShellClass}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#e8edf5] bg-white/95 px-4 py-3 backdrop-blur sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f0fe] ring-1 ring-[#d2e3fc]"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#4285F4]">
              Google Ads · Campaign builder
            </p>
            <h2
              id={titleId}
              className="truncate text-lg font-extrabold tracking-tight text-[#07111f]"
            >
              {STEP_TITLES[step - 1] ?? "Create campaign"}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {syncingDraft ? (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Syncing
            </span>
          ) : draftSavedFlash ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <Check className="size-3.5" aria-hidden />
              Draft saved
            </span>
          ) : hasAutosaved ? (
            <span className="hidden text-xs text-slate-400 sm:inline">
              Autosaved
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void persistProgressAndClose()}
            disabled={busy}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-[#e8edf5] text-slate-500 transition hover:bg-[#f4f8ff] hover:text-[#4285F4] disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </header>

      <div className="shrink-0 border-b border-[#e8edf5] bg-white px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-500">
            Step {step} of {TOTAL_WIZARD_STEPS}
          </p>
          <p className="hidden text-xs text-slate-400 sm:block">
            {STEP_TITLES[step - 1]}
          </p>
        </div>
        <div className="mx-auto mt-2 h-2 max-w-3xl overflow-hidden rounded-full bg-[#e8edf5]">
          <motion.div
            className="h-full rounded-full bg-[#4285F4]"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-3xl pb-10">
          <AnimatePresence mode="wait">
            <div key={`${step}-${draft.goalDetailSubstep}`}>
              {renderCampaignBuilderStep(step, {
                draft,
                errors,
                onChange: patchDraft,
                onEditStep: goToStep,
                publishing,
                publishProgress,
                publishPhase,
                publishError,
                publishSuccess,
              })}
            </div>
          </AnimatePresence>
        </div>
      </main>

      <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-[#e8edf5] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <button
          type="button"
          onClick={handleBack}
          disabled={busy}
          className={`${googleBuilderSecondaryButtonClass} disabled:opacity-50`}
        >
          {step === 1 ? "Cancel" : "Back"}
        </button>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {publishSuccess && resolvedAdsConsoleUrl ? (
            <a
              href={resolvedAdsConsoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={googleBuilderSecondaryButtonClass}
            >
              Open ads console
            </a>
          ) : null}
          {goalSaveError ? (
            <p className="text-sm font-medium text-red-500 sm:mr-2">
              {goalSaveError}
            </p>
          ) : null}
          <button
            type="button"
            disabled={nextDisabled}
            onClick={() => {
              if (publishSuccess) {
                void persistProgressAndClose();
                return;
              }
              if (isLastStep) {
                void handlePublish();
                return;
              }
              void handleContinue();
            }}
            className={`${googleBuilderPrimaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {publishing ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Publishing…
              </>
            ) : savingGoal ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              primaryLabel
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
