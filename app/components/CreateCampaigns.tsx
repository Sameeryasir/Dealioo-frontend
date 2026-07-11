"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Megaphone, Sparkles } from "lucide-react";
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

export type CreateCampaignCompletePayload = {
  campaignName: string;
  websiteUrl: string;
  offerName: string;
  offerPrice: string;
  offerImage: File;
};

export type CreateCampaignsProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "modal" | "inline";
  businessId: number;
  /** Hidden for now — auto-filled from business settings or app URL. */
  defaultWebsiteUrl?: string | null;
  onComplete?: (
    payload: CreateCampaignCompletePayload,
  ) =>
    | void
    | number
    | undefined
    | Promise<void | number | undefined>;
};

export default function CreateCampaigns({
  open,
  onOpenChange,
  variant = "modal",
  businessId,
  defaultWebsiteUrl,
  onComplete,
}: CreateCampaignsProps) {
  const dispatch = useAppDispatch();
  const isModal = variant === "modal";
  const nameFieldId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [showNameError, setShowNameError] = useState(false);
  const [showOfferStep, setShowOfferStep] = useState(false);
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
    setCampaignName("");
    setShowNameError(false);
    setShowOfferStep(false);
    setPendingWebsiteUrl(null);
    setIsCompletingOffer(false);
    setCreatedOffer(null);
    queueMicrotask(() => nameInputRef.current?.focus());
  }, [open, dispatch]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (createdOffer) return;
      if (showOfferStep) {
        handleBackFromOffer();
        return;
      }
      if (isModal) onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isModal, onOpenChange, showOfferStep, createdOffer]);

  if (!open) return null;
  if (isModal && !mounted) return null;

  const continueButtonClassName =
    "min-w-80 cursor-pointer rounded-full bg-[#1877f2] px-14 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/30 focus-visible:ring-offset-2";

  const fieldInputClassName =
    "mt-2 w-full rounded-full border border-[#e8edf5] bg-[#f8fafc] px-3 py-2.5 text-sm font-medium text-[#07111f] placeholder:text-slate-400 outline-none transition focus:border-[#1877f2]/45 focus:bg-white focus:ring-2 focus:ring-[#1877f2]/15";

  const handleBackFromOffer = () => {
    if (isCompletingOffer) return;
    setShowOfferStep(false);
  };

  const handleCloseCreateFlow = () => {
    if (isCompletingOffer) return;
    onOpenChange(false);
  };

  const handleStep1Submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = campaignName.trim();
    if (!trimmed) {
      setShowNameError(true);
      nameInputRef.current?.focus();
      return;
    }

    const websiteUrl = resolveDefaultCampaignWebsiteUrl(defaultWebsiteUrl);
    setShowNameError(false);
    dispatch(setDraftCampaignName(trimmed));
    dispatch(setDraftWebsiteUrl(websiteUrl));
    setPendingWebsiteUrl(websiteUrl);
    setShowOfferStep(true);
  };

  const panel = (
    <div
      className={`relative w-full max-w-2xl overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.02] ${
        isModal ? "" : ""
      }`}
      role={isModal ? "dialog" : "region"}
      aria-modal={isModal ? true : undefined}
      aria-label="Create campaign"
      onClick={isModal ? (e) => e.stopPropagation() : undefined}
    >
      <div className="relative border-b border-[#e8edf5]/80 bg-gradient-to-br from-[#eef5ff] via-white to-[#f8fafc] px-6 py-5">
        <span
          className="pointer-events-none absolute -top-6 -right-4 size-28 rounded-full bg-[#1877f2]/10 blur-2xl"
          aria-hidden
        />
        <div className="relative flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#bfdbfe] bg-white shadow-[0_8px_20px_rgba(24,119,242,0.12)]">
            <Megaphone className="size-5 text-[#1877f2]" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="m-0 inline-flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#1877f2]">
              <Sparkles className="size-3" aria-hidden />
              Step 1 of 2
            </p>
            <h2 className="m-0 mt-1 text-[1.05rem] font-extrabold tracking-tight text-[#07111f]">
              Name your campaign
            </h2>
            <p className="m-0 mt-1 text-[0.8rem] font-medium text-slate-500">
              Pick a clear name your team will recognize later.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleStep1Submit} noValidate className="p-6">
        <label
          htmlFor={nameFieldId}
          className="block text-sm font-bold text-[#07111f]"
        >
          Campaign name <span className="text-red-500">*</span>
        </label>
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
          className={fieldInputClassName}
        />
        {showNameError ? (
          <p
            id={`${nameFieldId}-error`}
            className="mt-2 text-sm text-red-600"
            role="alert"
          >
            Enter a campaign name to continue.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse items-center justify-center gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleCloseCreateFlow}
            className="min-w-40 cursor-pointer rounded-full border border-[#e8edf5] px-8 py-3 text-sm font-semibold text-slate-600 transition hover:bg-[#f8fafc]"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!campaignName.trim()}
            className={`${continueButtonClassName} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );

  const offerForm = (
    <MakeYourOffer
      variant="inline"
      open={showOfferStep}
      isSaving={isCompletingOffer}
      onBack={handleBackFromOffer}
      onOpenChange={setShowOfferStep}
      onSave={async (payload) => {
        if (!pendingWebsiteUrl || isCompletingOffer) return;
        if (
          !campaignName.trim() ||
          !payload.offerName.trim() ||
          !isValidOfferPrice(payload.offerPrice) ||
          !(payload.imageFile instanceof File)
        ) {
          return;
        }
        const completePayload: CreateCampaignCompletePayload = {
          campaignName: campaignName.trim(),
          websiteUrl: pendingWebsiteUrl,
          offerName: payload.offerName,
          offerPrice: payload.offerPrice,
          offerImage: payload.imageFile,
        };
        setIsCompletingOffer(true);
        try {
          const campaignId = await onComplete?.(completePayload);
          if (campaignId == null) {
            throw new Error("Could not create campaign.");
          }
          setCreatedOffer({
            offerName: payload.offerName,
            offerPrice: payload.offerPrice,
            imagePreviewUrl: URL.createObjectURL(payload.imageFile),
            campaignId,
          });
          setShowOfferStep(false);
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
    : showOfferStep
      ? offerForm
      : panel;

  if (isModal) {
    return createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#07111f]/45 p-4 backdrop-blur-[2px]"
        role="presentation"
        onClick={() => {
          if (createdOffer) return;
          if (showOfferStep) {
            handleBackFromOffer();
          } else {
            onOpenChange(false);
          }
        }}
      >
        <div
          className={`flex w-full justify-center ${
            showOfferStep ? "max-w-2xl" : createdOffer ? "max-w-sm" : "max-w-2xl"
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
    <div className="flex w-full max-w-2xl justify-center">
      {activePanel}
    </div>
  );
}
