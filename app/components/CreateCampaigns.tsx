"use client";

import {
  AlertCircle,
  Check,
  CloudUpload,
  Loader2,
  Megaphone,
  Trash2,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  buildCampaignOriginalPrice,
  CAMPAIGN_DESCRIPTION_MAX_LENGTH,
  CAMPAIGN_OFFER_MAX_LENGTH,
  campaignDescriptionValidationMessage,
  campaignNameValidationMessage,
  discountValidationMessage,
  offerNameValidationMessage,
  offerPriceValidationMessage,
  type CampaignDiscountType,
} from "@/app/lib/campaign-form";
import { CampaignDiscountFields } from "@/app/components/campaign/CampaignDiscountFields";
import { getPublicAppUrl } from "@/app/lib/public-app-url";
import {
  resetCampaignDraft,
  setCampaignName as setDraftCampaignName,
  setWebsiteUrl as setDraftWebsiteUrl,
} from "@/app/store/campaignSlice";
import { useAppDispatch } from "@/app/store/hooks";

const CAMPAIGN_NAME_MAX_LENGTH = 30;
const MAX_OFFER_IMAGE_BYTES = 5 * 1024 * 1024;

export type CampaignType = "prepaid" | "postpaid";

export type CreateCampaignCompletePayload = {
  campaignName: string;
  websiteUrl: string;
  offerName: string;
  description: string;
  offerPrice: string;
  originalPrice: string;
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

const inputClassName =
  "w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm text-[#07111f] outline-none transition placeholder:text-slate-400 hover:border-[#cbd5e1] focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/15 disabled:cursor-not-allowed disabled:opacity-60";

const inputErrorClassName =
  "w-full rounded-xl border border-red-300 bg-white px-3.5 py-2.5 text-sm text-[#07111f] outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60";

type FieldKey =
  | "campaignType"
  | "campaignName"
  | "description"
  | "offer"
  | "price"
  | "discount"
  | "image";

function FieldHeader({
  htmlFor,
  label,
  required,
  count,
}: {
  htmlFor?: string;
  label: string;
  required?: boolean;
  count?: string;
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <label
        htmlFor={htmlFor}
        className="text-sm font-semibold text-[#07111f]"
      >
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </label>
      {count ? (
        <span className="text-[0.7rem] font-medium text-slate-400">{count}</span>
      ) : null}
    </div>
  );
}

function FieldHint({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{children}</p>
  );
}

function FieldError({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
      {message}
    </p>
  );
}

function FieldMessage({
  error,
  hint,
}: {
  error?: string | null;
  hint: ReactNode;
}) {
  if (error) return <FieldError message={error} />;
  return <FieldHint>{hint}</FieldHint>;
}

function resolveDefaultCampaignWebsiteUrl(override?: string | null): string {
  const trimmed = override?.trim();
  if (trimmed) {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed.replace(/\/$/, "");
    }
    return `https://${trimmed.replace(/\/$/, "")}`;
  }
  return getPublicAppUrl();
}

export default function CreateCampaigns({
  open,
  onOpenChange,
  businessId: _businessId,
  defaultWebsiteUrl,
  onComplete,
}: CreateCampaignsProps) {
  const dispatch = useAppDispatch();
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [campaignType, setCampaignType] = useState<CampaignType | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [offer, setOffer] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] =
    useState<CampaignDiscountType>("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [includeOfferPrice, setIncludeOfferPrice] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>(
    {},
  );

  const markTouched = (key: FieldKey) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const requirePrice = campaignType === "prepaid" || includeOfferPrice;

  const fieldErrors = {
    campaignType: !campaignType ? "Choose prepaid or postpaid billing." : null,
    campaignName: campaignNameValidationMessage(
      campaignName,
      CAMPAIGN_NAME_MAX_LENGTH,
    ),
    description: campaignDescriptionValidationMessage(description),
    offer: offerNameValidationMessage(offer),
    price: requirePrice ? offerPriceValidationMessage(price) : null,
    discount: requirePrice
      ? discountValidationMessage({
          enabled: discountEnabled,
          dealPriceRaw: price,
          discountType,
          discountValueRaw: discountValue,
        })
      : null,
    image: imageFile instanceof File ? null : "Upload an offer image to continue.",
  };

  const showError = (key: FieldKey) =>
    touched[key] ? fieldErrors[key] : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetFormState = useCallback(() => {
    dispatch(resetCampaignDraft());
    setCampaignType(null);
    setCampaignName("");
    setOffer("");
    setDescription("");
    setPrice("");
    setDiscountEnabled(false);
    setDiscountType("percent");
    setDiscountValue("");
    setIncludeOfferPrice(true);
    setImageFile(null);
    setPreviewUrl(null);
    setSubmitError(null);
    setTouched({});
    setIsSaving(false);
    setIsDragging(false);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [dispatch]);

  useLayoutEffect(() => {
    resetFormState();
  }, [open, resetFormState]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, isSaving, onOpenChange]);

useEffect(() => {
    if (campaignType === "prepaid") {
      setIncludeOfferPrice(true);
    }
  }, [campaignType]);

  const applyImageFile = (file: File) => {
    markTouched("image");
    if (!file.type.startsWith("image/")) {
      setSubmitError("Upload an image file (PNG, JPG, or WebP).");
      return;
    }
    if (file.size > MAX_OFFER_IMAGE_BYTES) {
      setSubmitError("Image must be 5MB or smaller.");
      return;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const nextUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextUrl;
    setImageFile(file);
    setPreviewUrl(nextUrl);
    setSubmitError(null);
  };

  const clearPreviewImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImageFile(null);
    setPreviewUrl(null);
    markTouched("image");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyImageFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) applyImageFile(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setSubmitError(null);
    setTouched({
      campaignType: true,
      campaignName: true,
      description: true,
      offer: true,
      price: true,
      discount: true,
      image: true,
    });

    if (
      fieldErrors.campaignType ||
      fieldErrors.campaignName ||
      fieldErrors.description ||
      fieldErrors.offer ||
      fieldErrors.price ||
      fieldErrors.discount ||
      fieldErrors.image
    ) {
      return;
    }

    if (!campaignType || !(imageFile instanceof File)) return;

    const trimmedName = campaignName.trim();
    const websiteUrl = resolveDefaultCampaignWebsiteUrl(defaultWebsiteUrl);
    dispatch(setDraftCampaignName(trimmedName));
    dispatch(setDraftWebsiteUrl(websiteUrl));

    let originalPrice = "";
    if (requirePrice && discountEnabled) {
      const built = buildCampaignOriginalPrice({
        discountEnabled: true,
        dealPriceRaw: price,
        discountType,
        discountValueRaw: discountValue,
      });
      if (built.error || built.originalPrice == null) {
        setSubmitError(built.error ?? "Could not apply discount.");
        return;
      }
      originalPrice = String(built.originalPrice);
    }

    const payload: CreateCampaignCompletePayload = {
      campaignName: trimmedName,
      websiteUrl,
      offerName: offer.trim(),
      description: description.trim(),
      offerPrice: requirePrice ? price.trim() : "",
      originalPrice,
      offerImage: imageFile,
      campaignType,
      includeOfferPrice: requirePrice,
    };

    setIsSaving(true);
    try {
      const campaignId = await onComplete?.(payload);
      if (campaignId == null) {
        throw new Error("Could not create campaign.");
      }
      onOpenChange(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not create campaign.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[#07111f]/45 p-3 backdrop-blur-[4px] sm:p-5"
      role="presentation"
      onClick={() => {
        if (!isSaving) onOpenChange(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[min(94dvh,58rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_28px_64px_rgba(7,17,31,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#eef2f7] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-[#07111f]"
            >
              <Megaphone
                className="size-5 shrink-0 text-[#1877f2]"
                strokeWidth={2.25}
                aria-hidden
              />
              Create campaign
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Set billing, offer details, and image in one place
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="size-4" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => void handleSubmit(e)}
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
<div>
              <FieldHeader
                htmlFor="create-campaign-billing"
                label="Billing type"
                required
              />
              <div
                id="create-campaign-billing"
                role="radiogroup"
                aria-label="Billing type"
                className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={campaignType === "prepaid"}
                  disabled={isSaving}
                  onClick={() => {
                    setCampaignType("prepaid");
                    markTouched("campaignType");
                  }}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    campaignType === "prepaid"
                      ? "border-[#93c5fd] bg-[#f0f7ff] ring-1 ring-[#93c5fd]/50"
                      : showError("campaignType")
                        ? "border-red-300 bg-white"
                        : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      campaignType === "prepaid"
                        ? "border-[#1877f2] bg-[#1877f2]"
                        : "border-slate-300 bg-white"
                    }`}
                    aria-hidden
                  >
                    {campaignType === "prepaid" ? (
                      <span className="size-1.5 rounded-full bg-white" />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[#07111f]">
                      Prepaid
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Guest pays before redeeming.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={campaignType === "postpaid"}
                  disabled={isSaving}
                  onClick={() => {
                    setCampaignType("postpaid");
                    markTouched("campaignType");
                  }}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    campaignType === "postpaid"
                      ? "border-[#93c5fd] bg-[#f0f7ff] ring-1 ring-[#93c5fd]/50"
                      : showError("campaignType")
                        ? "border-red-300 bg-white"
                        : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      campaignType === "postpaid"
                        ? "border-[#1877f2] bg-[#1877f2]"
                        : "border-slate-300 bg-white"
                    }`}
                    aria-hidden
                  >
                    {campaignType === "postpaid" ? (
                      <span className="size-1.5 rounded-full bg-white" />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[#07111f]">
                      Postpaid
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Charge after the visit or redeem.
                    </span>
                  </span>
                </button>
              </div>
              <FieldMessage
                error={showError("campaignType")}
                hint="This can't be changed later for this campaign."
              />
            </div>

<div>
              <FieldHeader
                htmlFor="create-campaign-name"
                label="Campaign name"
                required
                count={`${campaignName.length}/${CAMPAIGN_NAME_MAX_LENGTH}`}
              />
              <input
                id="create-campaign-name"
                value={campaignName}
                onChange={(e) => {
                  setCampaignName(
                    e.target.value.slice(0, CAMPAIGN_NAME_MAX_LENGTH),
                  );
                }}
                onBlur={() => markTouched("campaignName")}
                maxLength={CAMPAIGN_NAME_MAX_LENGTH}
                className={
                  showError("campaignName") ? inputErrorClassName : inputClassName
                }
                placeholder="Campaign name"
                disabled={isSaving}
                aria-invalid={Boolean(showError("campaignName"))}
              />
              <FieldMessage
                error={showError("campaignName")}
                hint="Give your campaign a clear and catchy name."
              />
            </div>

<div>
              <FieldHeader
                htmlFor="create-campaign-description"
                label="Description"
                count={`${description.length}/${CAMPAIGN_DESCRIPTION_MAX_LENGTH}`}
              />
              <textarea
                id="create-campaign-description"
                value={description}
                onChange={(e) => {
                  setDescription(
                    e.target.value.slice(0, CAMPAIGN_DESCRIPTION_MAX_LENGTH),
                  );
                }}
                onBlur={() => markTouched("description")}
                rows={3}
                maxLength={CAMPAIGN_DESCRIPTION_MAX_LENGTH}
                className={`${
                  showError("description") ? inputErrorClassName : inputClassName
                } min-h-[5rem] resize-none leading-relaxed`}
                placeholder="Describe your campaign"
                disabled={isSaving}
                aria-invalid={Boolean(showError("description"))}
              />
              <FieldMessage
                error={showError("description")}
                hint="Describe your campaign, what's included, and why it's special."
              />
            </div>

<div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.35fr_0.85fr]">
              <div>
                <FieldHeader
                  htmlFor="create-campaign-offer"
                  label="Offer"
                  required
                  count={`${offer.length}/${CAMPAIGN_OFFER_MAX_LENGTH}`}
                />
                <input
                  id="create-campaign-offer"
                  value={offer}
                  onChange={(e) => {
                    setOffer(
                      e.target.value.slice(0, CAMPAIGN_OFFER_MAX_LENGTH),
                    );
                  }}
                  onBlur={() => markTouched("offer")}
                  maxLength={CAMPAIGN_OFFER_MAX_LENGTH}
                  className={
                    showError("offer") ? inputErrorClassName : inputClassName
                  }
                  placeholder="Offer name"
                  disabled={isSaving}
                  aria-invalid={Boolean(showError("offer"))}
                />
                <FieldMessage
                  error={showError("offer")}
                  hint="Choose a clear offer name — this text appears as the tag on your funnel landing page."
                />
              </div>
              <div>
                <FieldHeader
                  htmlFor="create-campaign-price"
                  label="Deal price"
                  required={
                    campaignType === "prepaid" || includeOfferPrice
                  }
                />
                <input
                  id="create-campaign-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                  }}
                  onBlur={() => {
                    markTouched("price");
                    if (discountEnabled) markTouched("discount");
                  }}
                  inputMode="decimal"
                  className={
                    showError("price") ? inputErrorClassName : inputClassName
                  }
                  placeholder="0.00"
                  disabled={
                    isSaving ||
                    (campaignType === "postpaid" && !includeOfferPrice)
                  }
                  aria-invalid={Boolean(showError("price"))}
                />
                {campaignType === "postpaid" ? (
                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={includeOfferPrice}
                      disabled={isSaving}
                      onChange={(e) => {
                        setIncludeOfferPrice(e.target.checked);
                        if (!e.target.checked) {
                          setDiscountEnabled(false);
                          setDiscountValue("");
                        }
                        markTouched("price");
                      }}
                      className="size-3.5 rounded border-slate-300 text-[#1877f2] focus:ring-[#1877f2]/30"
                    />
                    Include a listed price
                  </label>
                ) : null}
                <FieldMessage
                  error={showError("price")}
                  hint="What the guest pays for this offer (e.g. 22.00)."
                />
              </div>
              {(campaignType === "prepaid" || includeOfferPrice) ? (
                <CampaignDiscountFields
                  idPrefix="create-campaign"
                  enabled={discountEnabled}
                  discountType={discountType}
                  discountValue={discountValue}
                  dealPrice={price}
                  disabled={isSaving}
                  error={showError("discount")}
                  onEnabledChange={(next) => {
                    setDiscountEnabled(next);
                    if (!next) setDiscountValue("");
                    markTouched("discount");
                  }}
                  onTypeChange={(next) => {
                    setDiscountType(next);
                    markTouched("discount");
                  }}
                  onValueChange={(next) => {
                    setDiscountValue(next);
                  }}
                  onValueBlur={() => markTouched("discount")}
                />
              ) : null}
            </div>

<div>
              <FieldHeader
                htmlFor="create-campaign-image"
                label="Offer image"
                required
              />
              <input
                ref={fileInputRef}
                id="create-campaign-image"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleImageChange}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {previewUrl ? (
                  <div className="relative overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Campaign offer preview"
                      className="aspect-[4/3] h-full max-h-44 w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Remove image"
                      disabled={isSaving}
                      onClick={clearPreviewImage}
                      className="absolute right-2 top-2 inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-white text-red-500 shadow-md transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2
                        className="size-3.5"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`flex aspect-[4/3] max-h-44 items-center justify-center rounded-xl border border-dashed bg-[#f8fafc] text-xs text-slate-400 ${
                      showError("image") ? "border-red-300" : "border-[#e2e8f0]"
                    }`}
                  >
                    No image selected
                  </div>
                )}

                <button
                  type="button"
                  aria-label="Upload offer image"
                  disabled={isSaving}
                  onClick={() => {
                    markTouched("image");
                    fileInputRef.current?.click();
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex min-h-[11rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    isDragging
                      ? "border-[#1877f2] bg-[#eef5ff]"
                      : showError("image")
                        ? "border-red-300 bg-white"
                        : "border-[#dbeafe] bg-white hover:border-[#1877f2]/50 hover:bg-[#f8fbff]"
                  }`}
                >
                  <CloudUpload
                    className="size-5 text-[#1877f2]"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="text-sm font-semibold text-[#07111f]">
                    Upload an image
                  </span>
                  <span className="text-xs font-medium text-[#1877f2]">
                    Drag & drop, or click to browse
                  </span>
                  <span className="text-[0.7rem] text-slate-400">
                    JPG, PNG, WebP (Max 5MB)
                  </span>
                </button>
              </div>
              <FieldError message={showError("image")} />
            </div>

            {submitError ? (
              <p
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {submitError}
              </p>
            ) : null}
          </div>

<div className="flex shrink-0 flex-col gap-3 border-t border-[#eef2f7] bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => onOpenChange(false)}
                className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-[#1877f2] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(24,119,242,0.25)] transition hover:bg-[#166fe0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Check className="size-4" strokeWidth={2.5} aria-hidden />
                )}
                {isSaving ? "Creating…" : "Create campaign"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
