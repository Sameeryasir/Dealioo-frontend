"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Megaphone,
  Sparkles,
  Type,
  Wallet,
} from "lucide-react";
import CampaignOfferPreviewCard from "@/app/components/CampaignOfferPreviewCard";
import MakeYourOffer from "@/app/components/MakeYourOffer";
import {
  resetCampaignDraft,
  setCampaignName as setDraftCampaignName,
  setWebsiteUrl as setDraftWebsiteUrl,
} from "@/app/store/campaignSlice";
import { getPublicAppUrl } from "@/app/lib/public-app-url";
import { isValidOfferPrice } from "@/app/lib/campaign-form";
import { useAppDispatch } from "@/app/store/hooks";

function resolveDefaultCampaignWebsiteUrl(
  override?: string | null,
): string {
  const trimmed = override?.trim();
  if (trimmed) {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed.replace(/\/$/, "");
    }
    return `https://${trimmed.replace(/\/$/, "")}`;
  }

  return getPublicAppUrl();
}

export type CampaignType = "prepaid" | "postpaid";

export type CreateCampaignCompletePayload = {
  campaignName: string;
  websiteUrl: string;
  offerName: string;
  description: string;
  offerPrice: string;
  offerImage: File;
  campaignType: CampaignType;
  includeOfferPrice: boolean;
};

export type CreateCampaignsProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "modal" | "inline";
  businessId: number;
  defaultWebsiteUrl?: string | null;
  onComplete?: (
    payload: CreateCampaignCompletePayload,
  ) =>
    | void
    | number
    | undefined
    | Promise<void | number | undefined>;
};

type CreateStep = "billing" | "name" | "offer";

export default function CreateCampaigns({
  open,
  onOpenChange,
  variant = "modal",
  businessId: _businessId,
  defaultWebsiteUrl,
  onComplete,
}: CreateCampaignsProps) {
  const dispatch = useAppDispatch();
  const isModal = variant === "modal";
  const nameFieldId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<CreateStep>("billing");
  const [campaignType, setCampaignType] =
    useState<CampaignType | null>(null);
  const [showBillingError, setShowBillingError] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [showNameError, setShowNameError] = useState(false);
  const [pendingWebsiteUrl, setPendingWebsiteUrl] = useState<string | null>(
    null,
  );
  const [isCompletingOffer, setIsCompletingOffer] = useState(false);
  const [createdOffer, setCreatedOffer] = useState<{
    offerName: string;
    offerPrice: string;
    imagePreviewUrl: string;
    campaignId?: number;
  } | null>(null);

  useEffect(() => {
    if (isModal) setMounted(true);
  }, [isModal]);

  useEffect(() => {
    return () => {
      if (createdOffer?.imagePreviewUrl) {
        URL.revokeObjectURL(createdOffer.imagePreviewUrl);
      }
    };
  }, [createdOffer?.imagePreviewUrl]);

  useEffect(() => {
    if (!open) return;
    dispatch(resetCampaignDraft());
    setStep("billing");
    setCampaignType(null);
    setShowBillingError(false);
    setCampaignName("");
    setShowNameError(false);
    setPendingWebsiteUrl(null);
    setIsCompletingOffer(false);
    setCreatedOffer(null);
  }, [open, dispatch]);

  useEffect(() => {
    if (!open || step !== "name") return;
    queueMicrotask(() => nameInputRef.current?.focus());
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (createdOffer) return;
      if (step === "offer") {
        handleBackFromOffer();
        return;
      }
      if (step === "name") {
        setStep("billing");
        return;
      }
      if (isModal) onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isModal, onOpenChange, step, createdOffer]);

  if (!open) return null;
  if (isModal && !mounted) return null;

  const continueButtonClassName =
    "inline-flex min-w-44 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-6 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(24,119,242,0.32)] transition hover:bg-[#166fe5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/30 focus-visible:ring-offset-2";

  const backButtonClassName =
    "inline-flex min-w-36 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-[#c7dbf8] hover:bg-[#f8fafc]";

  const panelShellClassName =
    "relative w-full max-w-2xl overflow-hidden rounded-[1.5rem] border border-[#dbe5f1] bg-white shadow-[0_22px_50px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.03]";

  const handleBackFromOffer = () => {
    if (isCompletingOffer) return;
    setStep("name");
  };

  const handleCloseCreateFlow = () => {
    if (isCompletingOffer) return;
    onOpenChange(false);
  };

  const handleBillingContinue = () => {
    if (!campaignType) {
      setShowBillingError(true);
      return;
    }
    setShowBillingError(false);
    setStep("name");
  };

  const handleStepNameSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = campaignName.trim();
    if (!trimmed) {
      setShowNameError(true);
      nameInputRef.current?.focus();
      return;
    }
    if (!campaignType) {
      setStep("billing");
      setShowBillingError(true);
      return;
    }

    const websiteUrl = resolveDefaultCampaignWebsiteUrl(defaultWebsiteUrl);
    setShowNameError(false);
    dispatch(setDraftCampaignName(trimmed));
    dispatch(setDraftWebsiteUrl(websiteUrl));
    setPendingWebsiteUrl(websiteUrl);
    setStep("offer");
  };

  const billingPanel = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={panelShellClassName}
      role={isModal ? "dialog" : "region"}
      aria-modal={isModal ? true : undefined}
      aria-label="Choose campaign payment model"
      onClick={isModal ? (e) => e.stopPropagation() : undefined}
    >
      <div className="relative border-b border-[#e8edf5] bg-white px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start gap-3">
          <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#1877f2] text-white shadow-[0_10px_24px_rgba(24,119,242,0.35)]">
            <Wallet className="size-5" strokeWidth={1.75} aria-hidden />
            <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-[#07111f] text-[0.55rem] font-bold text-white">
              1
            </span>
          </span>
          <div className="min-w-0">
            <p className="m-0 inline-flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#1877f2]">
              <Sparkles className="size-3" aria-hidden />
              Step 1 of 3
            </p>
            <h2 className="m-0 mt-1 text-[1.15rem] font-extrabold tracking-tight text-[#07111f] sm:text-[1.25rem]">
              Prepaid or postpaid?
            </h2>
            <p className="m-0 mt-1 text-[0.8rem] font-medium text-slate-500">
              Choose how guests pay for this campaign offer.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div
          className="grid gap-3 sm:grid-cols-2"
          role="radiogroup"
          aria-label="Campaign type"
        >
          <button
            type="button"
            role="radio"
            aria-checked={campaignType === "prepaid"}
            onClick={() => {
              setCampaignType("prepaid");
              setShowBillingError(false);
            }}
            className={`group relative flex cursor-pointer flex-col items-start gap-3 rounded-2xl border bg-white px-4 py-4 text-left transition ${
              campaignType === "prepaid"
                ? "border-[#1877f2] shadow-[0_10px_24px_rgba(24,119,242,0.12)] ring-2 ring-[#1877f2]/20"
                : "border-[#e8edf5] hover:border-[#bfdbfe] hover:shadow-[0_8px_18px_rgba(15,23,42,0.06)]"
            }`}
          >
            {campaignType === "prepaid" ? (
              <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-[#1877f2] text-white">
                <Check className="size-3" strokeWidth={2.5} aria-hidden />
              </span>
            ) : null}
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#1877f2] ring-1 ring-[#bfdbfe]/70 transition group-hover:scale-105">
              <CreditCard className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-extrabold text-[#07111f]">
                Prepaid
              </span>
              <span className="mt-1 block text-[0.78rem] font-medium leading-snug text-slate-500">
                Guests pay online before they visit.
              </span>
            </span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={campaignType === "postpaid"}
            onClick={() => {
              setCampaignType("postpaid");
              setShowBillingError(false);
            }}
            className={`group relative flex cursor-pointer flex-col items-start gap-3 rounded-2xl border bg-white px-4 py-4 text-left transition ${
              campaignType === "postpaid"
                ? "border-[#1877f2] shadow-[0_10px_24px_rgba(24,119,242,0.12)] ring-2 ring-[#1877f2]/20"
                : "border-[#e8edf5] hover:border-[#bfdbfe] hover:shadow-[0_8px_18px_rgba(15,23,42,0.06)]"
            }`}
          >
            {campaignType === "postpaid" ? (
              <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-[#1877f2] text-white">
                <Check className="size-3" strokeWidth={2.5} aria-hidden />
              </span>
            ) : null}
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#1877f2] ring-1 ring-[#bfdbfe]/70 transition group-hover:scale-105">
              <Wallet className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-extrabold text-[#07111f]">
                Postpaid
              </span>
              <span className="mt-1 block text-[0.78rem] font-medium leading-snug text-slate-500">
                Guests pay in store after the visit.
              </span>
            </span>
          </button>
        </div>

        {showBillingError ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            Choose prepaid or postpaid to continue.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[#e8edf5] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleCloseCreateFlow}
            className={`${backButtonClassName} w-full sm:w-auto`}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </button>
          <button
            type="button"
            onClick={handleBillingContinue}
            disabled={!campaignType}
            className={`${continueButtonClassName} w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
          >
            Continue
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const namePanel = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={panelShellClassName}
      role={isModal ? "dialog" : "region"}
      aria-modal={isModal ? true : undefined}
      aria-label="Create campaign"
      onClick={isModal ? (e) => e.stopPropagation() : undefined}
    >
      <div className="relative border-b border-[#e8edf5] bg-white px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start gap-3">
          <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#1877f2] text-white shadow-[0_10px_24px_rgba(24,119,242,0.35)]">
            <Megaphone className="size-5" strokeWidth={1.75} aria-hidden />
            <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-[#07111f] text-[0.55rem] font-bold text-white">
              2
            </span>
          </span>
          <div className="min-w-0">
            <p className="m-0 inline-flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#1877f2]">
              <Sparkles className="size-3" aria-hidden />
              Step 2 of 3
            </p>
            <h2 className="m-0 mt-1 text-[1.15rem] font-extrabold tracking-tight text-[#07111f] sm:text-[1.25rem]">
              Name your campaign
            </h2>
            <p className="m-0 mt-1 text-[0.8rem] font-medium text-slate-500">
              Pick a clear name your team will recognize later.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleStepNameSubmit} noValidate className="p-5 sm:p-6">
        <label
          htmlFor={nameFieldId}
          className="block text-sm font-bold text-[#07111f]"
        >
          Campaign name <span className="text-red-500">*</span>
        </label>
        <div
          className={`mt-1.5 flex w-full items-center overflow-hidden rounded-xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:ring-2 ${
            showNameError
              ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-200/60"
              : "border-[#e2e8f0] focus-within:border-[#1877f2]/55 focus-within:ring-[#1877f2]/15 focus-within:shadow-[0_0_0_4px_rgba(24,119,242,0.08)]"
          }`}
        >
          <span className="flex shrink-0 items-center pl-3 text-[#1877f2]/70">
            <Type className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
          <input
            ref={nameInputRef}
            id={nameFieldId}
            name="campaignName"
            type="text"
            autoComplete="off"
            required
            placeholder="e.g. Weekend brunch promo"
            value={campaignName}
            onChange={(e) => {
              setCampaignName(e.target.value);
              if (showNameError && e.target.value.trim()) setShowNameError(false);
            }}
            aria-invalid={showNameError}
            aria-describedby={showNameError ? `${nameFieldId}-error` : undefined}
            className="min-w-0 flex-1 border-0 bg-transparent px-2.5 py-2.5 text-sm font-medium text-[#07111f] outline-none placeholder:text-slate-400"
          />
        </div>
        {showNameError ? (
          <p
            id={`${nameFieldId}-error`}
            className="mt-2 text-sm text-red-600"
            role="alert"
          >
            Enter a campaign name to continue.
          </p>
        ) : (
          <p className="mt-2 text-[0.75rem] font-medium text-slate-400">
            Tip: keep it short — your team will see this name everywhere.
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[#e8edf5] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setStep("billing")}
            className={`${backButtonClassName} w-full sm:w-auto`}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </button>
          <button
            type="submit"
            disabled={!campaignName.trim()}
            className={`${continueButtonClassName} w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
          >
            Continue
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </form>
    </motion.div>
  );

  const offerForm = (
    <MakeYourOffer
      variant="inline"
      open={step === "offer"}
      isSaving={isCompletingOffer}
      allowOptionalPrice={campaignType === "postpaid"}
      onBack={handleBackFromOffer}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setStep("name");
      }}
      onSave={async (payload) => {
        if (!pendingWebsiteUrl || isCompletingOffer || !campaignType) return;
        if (
          !campaignName.trim() ||
          !payload.offerName.trim() ||
          !payload.description.trim() ||
          !(payload.imageFile instanceof File)
        ) {
          return;
        }
        if (
          payload.includeOfferPrice &&
          !isValidOfferPrice(payload.offerPrice)
        ) {
          return;
        }
        const completePayload: CreateCampaignCompletePayload = {
          campaignName: campaignName.trim(),
          websiteUrl: pendingWebsiteUrl,
          offerName: payload.offerName,
          description: payload.description,
          offerPrice: payload.includeOfferPrice ? payload.offerPrice : "",
          offerImage: payload.imageFile,
          campaignType,
          includeOfferPrice: payload.includeOfferPrice,
        };
        setIsCompletingOffer(true);
        try {
          const campaignId = await onComplete?.(completePayload);
          if (campaignId == null) {
            throw new Error("Could not create campaign.");
          }
          setCreatedOffer({
            offerName: payload.offerName,
            offerPrice: payload.includeOfferPrice ? payload.offerPrice : "",
            imagePreviewUrl: URL.createObjectURL(payload.imageFile),
            campaignId,
          });
          setStep("billing");
          setPendingWebsiteUrl(null);
        } catch {
          setIsCompletingOffer(false);
          return;
        }
        setIsCompletingOffer(false);
      }}
    />
  );

  const successPanel = createdOffer ? (
    <div
      className="flex w-full flex-col items-center justify-center py-4"
      role={isModal ? "dialog" : "region"}
      aria-modal={isModal ? true : undefined}
      aria-label="Campaign created"
    >
      <CampaignOfferPreviewCard
        offerName={createdOffer.offerName}
        offerPrice={createdOffer.offerPrice}
        imageUrl={createdOffer.imagePreviewUrl}
        campaignId={createdOffer.campaignId}
      />
      <button
        type="button"
        onClick={() => {
          if (createdOffer.imagePreviewUrl) {
            URL.revokeObjectURL(createdOffer.imagePreviewUrl);
          }
          setCreatedOffer(null);
          onOpenChange(false);
        }}
        className="mt-8 min-w-56 rounded-full bg-[#1877f2] px-10 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/30 focus-visible:ring-offset-2"
      >
        View campaigns
      </button>
    </div>
  ) : null;

  const activePanel = createdOffer
    ? successPanel
    : step === "offer"
      ? offerForm
      : step === "name"
        ? namePanel
        : billingPanel;

  if (isModal) {
    return createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#07111f]/45 p-4 backdrop-blur-[2px]"
        role="presentation"
        onClick={() => {
          if (createdOffer) return;
          if (step === "offer") {
            handleBackFromOffer();
          } else if (step === "name") {
            setStep("billing");
          } else {
            onOpenChange(false);
          }
        }}
      >
        <div
          className={`flex w-full min-w-0 justify-center ${
            step === "offer"
              ? "max-w-4xl"
              : createdOffer
                ? "max-w-sm"
                : "max-w-2xl"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {activePanel}
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <div
      className={`flex w-full min-w-0 justify-center ${
        createdOffer ? "max-w-sm" : step === "offer" ? "max-w-4xl" : "max-w-2xl"
      }`}
    >
      {activePanel}
    </div>
  );
}
