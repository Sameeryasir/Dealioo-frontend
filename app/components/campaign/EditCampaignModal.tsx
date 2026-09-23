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
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { UnpublishCampaignBlockedDialog } from "@/app/components/campaign/UnpublishCampaignBlockedDialog";
import {
  CAMPAIGN_DESCRIPTION_MAX_LENGTH,
  CAMPAIGN_OFFER_MAX_LENGTH,
  campaignDescriptionValidationMessage,
  offerNameValidationMessage,
  parseOfferPrice,
} from "@/app/lib/campaign-form";
import { upsertCampaignInQueryClient } from "@/app/lib/campaign-query-cache";
import { getAutomations } from "@/app/services/automation/automation-api";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-business";
import { parseCampaignFromApi } from "@/app/services/funnel/get-campaigns-by-business";
import {
  type CampaignPublicationStatus,
  updateCampaign,
} from "@/app/services/funnel/update-campaign";

const CAMPAIGN_NAME_MAX_LENGTH = 30;

function resolveCampaignStatus(
  campaign: Funnel,
): CampaignPublicationStatus {
  const raw = campaign.status?.trim().toLowerCase();
  if (raw === "published" || raw === "active") return "published";
  if (raw === "unpublished" || raw === "inactive" || raw === "draft") {
    return "unpublished";
  }
  return campaign.published === true ? "published" : "unpublished";
}

const inputClassName =
  "w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm text-[#07111f] outline-none transition placeholder:text-slate-400 hover:border-[#cbd5e1] focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/15 disabled:cursor-not-allowed disabled:opacity-60";

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
  return <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{children}</p>;
}

function parsePrice(raw: number | string | undefined): string {
  if (raw == null) return "";
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  return String(raw).trim();
}

export function EditCampaignModal({
  open,
  campaign,
  onOpenChange,
  onSaved,
  onDeleteRequest,
}: {
  open: boolean;
  campaign: Funnel | null | undefined;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void | Promise<void>;
  onDeleteRequest?: (campaign: Funnel) => void;
}) {
  const queryClient = useQueryClient();
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [offer, setOffer] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<CampaignPublicationStatus>("published");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [unpublishBlockedOpen, setUnpublishBlockedOpen] = useState(false);
  const [activeAutomationCount, setActiveAutomationCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !campaign) return;
    setCampaignName(
      (campaign.campaignName?.trim() ?? "").slice(0, CAMPAIGN_NAME_MAX_LENGTH),
    );
    setOffer(
      (campaign.offer?.trim() ?? "").slice(0, CAMPAIGN_OFFER_MAX_LENGTH),
    );
    setDescription(
      (campaign.description?.trim() ?? "").slice(
        0,
        CAMPAIGN_DESCRIPTION_MAX_LENGTH,
      ),
    );
    setPrice(parsePrice(campaign.price));
    setStatus(resolveCampaignStatus(campaign));
    setImageFile(null);
    const image = campaign.imageUrl?.trim() || null;
    setPreviewUrl(image);
    setError(null);
    setIsSaving(false);
    setIsDragging(false);
    setUnpublishBlockedOpen(false);
    setActiveAutomationCount(0);
  }, [open, campaign]);

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

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    applyImageFile(file);
  };

  const applyImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5MB or smaller.");
      return;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const nextUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextUrl;
    setImageFile(file);
    setPreviewUrl(nextUrl);
    setError(null);
  };

  const clearPreviewImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    if (!campaign || isSaving) return;

    try {
      setError(null);
      setIsSaving(true);
      const trimmedName = campaignName.trim();
      if (!trimmedName) {
        setError("Enter a campaign name.");
        setIsSaving(false);
        return;
      }
      if (trimmedName.length > CAMPAIGN_NAME_MAX_LENGTH) {
        setError(`Campaign name must be ${CAMPAIGN_NAME_MAX_LENGTH} characters or less.`);
        setIsSaving(false);
        return;
      }
      const offerError = offerNameValidationMessage(offer);
      if (offerError) {
        setError(offerError);
        setIsSaving(false);
        return;
      }
      const descriptionError = campaignDescriptionValidationMessage(description);
      if (descriptionError) {
        setError(descriptionError);
        setIsSaving(false);
        return;
      }

      const previousStatus = resolveCampaignStatus(campaign);
      if (status === "unpublished" && previousStatus !== "unpublished") {
        const automations = await getAutomations(campaign.businessId);
        const activeCount = automations.filter(
          (automation) =>
            automation.campaignId === campaign.id &&
            automation.isActive === true,
        ).length;
        if (activeCount > 0) {
          setActiveAutomationCount(activeCount);
          setUnpublishBlockedOpen(true);
          setIsSaving(false);
          return;
        }
      }

      const updatedBody = await updateCampaign({
        campaignId: campaign.id,
        campaignName: trimmedName,
        websiteUrl: campaign.websiteUrl?.trim() ?? "",
        offer: offer.trim(),
        description: description.trim(),
        price: parseOfferPrice(price),
        status,
        image: imageFile,
      });
      const updatedCampaign =
        parseCampaignFromApi(updatedBody) ??
        ({
          ...campaign,
          campaignName: trimmedName,
          offer: offer.trim(),
          description: description.trim(),
          price: parseOfferPrice(price),
          status,
          published: status === "published",
          updatedAt: new Date().toISOString(),
        } satisfies Funnel);

      upsertCampaignInQueryClient(
        queryClient,
        campaign.businessId,
        updatedCampaign,
      );

      await queryClient.invalidateQueries({
        queryKey: ["business-activity-events", campaign.businessId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["business-activity-summary", campaign.businessId],
      });
      await onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update campaign.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open || !mounted || !campaign) return null;

  return createPortal(
    <>
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
                Edit campaign
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Update your campaign details and offer image
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
                  htmlFor="edit-campaign-name"
                  label="Campaign name"
                  required
                  count={`${campaignName.length}/${CAMPAIGN_NAME_MAX_LENGTH}`}
                />
                <input
                  id="edit-campaign-name"
                  value={campaignName}
                  onChange={(e) =>
                    setCampaignName(
                      e.target.value.slice(0, CAMPAIGN_NAME_MAX_LENGTH),
                    )
                  }
                  maxLength={CAMPAIGN_NAME_MAX_LENGTH}
                  className={inputClassName}
                  placeholder="Campaign name"
                  disabled={isSaving}
                  required
                />
                <FieldHint>Give your campaign a clear and catchy name.</FieldHint>
              </div>

              <div>
                <FieldHeader
                  htmlFor="edit-campaign-description"
                  label="Description"
                  count={`${description.length}/${CAMPAIGN_DESCRIPTION_MAX_LENGTH}`}
                />
                <textarea
                  id="edit-campaign-description"
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value.slice(0, CAMPAIGN_DESCRIPTION_MAX_LENGTH),
                    )
                  }
                  rows={3}
                  maxLength={CAMPAIGN_DESCRIPTION_MAX_LENGTH}
                  className={`${inputClassName} min-h-[5rem] resize-none leading-relaxed`}
                  placeholder="Describe your campaign"
                  disabled={isSaving}
                  required
                />
                <FieldHint>
                  Describe your campaign, what&apos;s included, and why it&apos;s
                  special.
                </FieldHint>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.35fr_0.85fr]">
                <div>
                  <FieldHeader
                    htmlFor="edit-campaign-offer"
                    label="Offer"
                    required
                    count={`${offer.length}/${CAMPAIGN_OFFER_MAX_LENGTH}`}
                  />
                  <input
                    id="edit-campaign-offer"
                    value={offer}
                    onChange={(e) =>
                      setOffer(
                        e.target.value.slice(0, CAMPAIGN_OFFER_MAX_LENGTH),
                      )
                    }
                    maxLength={CAMPAIGN_OFFER_MAX_LENGTH}
                    className={inputClassName}
                    placeholder="Offer name"
                    disabled={isSaving}
                    required
                  />
                  <FieldHint>
                    Choose a clear offer name — this text appears as the tag on your funnel landing page.
                  </FieldHint>
                </div>
                <div>
                  <FieldHeader
                    htmlFor="edit-campaign-price"
                    label="Price"
                    required
                  />
                  <input
                    id="edit-campaign-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    inputMode="decimal"
                    className={inputClassName}
                    placeholder="0.00"
                    disabled={isSaving}
                    required
                  />
                  <FieldHint>Set the offer price (e.g. 22.00).</FieldHint>
                </div>
              </div>

              <div>
                <FieldHeader
                  htmlFor="edit-campaign-status"
                  label="Status"
                  required
                />
                <div
                  id="edit-campaign-status"
                  role="radiogroup"
                  aria-label="Campaign status"
                  className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={status === "published"}
                    disabled={isSaving}
                    onClick={() => setStatus("published")}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      status === "published"
                        ? "border-[#86efac] bg-[#f0fdf4] ring-1 ring-[#86efac]/50"
                        : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        status === "published"
                          ? "border-[#16a34a] bg-[#16a34a]"
                          : "border-slate-300 bg-white"
                      }`}
                      aria-hidden
                    >
                      {status === "published" ? (
                        <span className="size-1.5 rounded-full bg-white" />
                      ) : null}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-[#07111f]">
                        Published
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        Visible to customers.
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={status === "unpublished"}
                    disabled={isSaving}
                    onClick={() => setStatus("unpublished")}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      status === "unpublished"
                        ? "border-slate-300 bg-slate-50 ring-1 ring-slate-200"
                        : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        status === "unpublished"
                          ? "border-slate-500 bg-slate-500"
                          : "border-slate-300 bg-white"
                      }`}
                      aria-hidden
                    >
                      {status === "unpublished" ? (
                        <span className="size-1.5 rounded-full bg-white" />
                      ) : null}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-[#07111f]">
                        Unpublished
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        Hidden from customers.
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <FieldHeader
                  htmlFor="edit-campaign-image"
                  label="Offer image"
                />
                <input
                  ref={fileInputRef}
                  id="edit-campaign-image"
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
                        <Trash2 className="size-3.5" strokeWidth={2.25} aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] max-h-44 items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] text-xs text-slate-400">
                      No image selected
                    </div>
                  )}

                  <button
                    type="button"
                    aria-label="Upload offer image"
                    disabled={isSaving}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex min-h-[11rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      isDragging
                        ? "border-[#1877f2] bg-[#eef5ff]"
                        : "border-[#dbeafe] bg-white hover:border-[#1877f2]/50 hover:bg-[#f8fbff]"
                    }`}
                  >
                    <CloudUpload className="size-5 text-[#1877f2]" strokeWidth={2} aria-hidden />
                    <span className="text-sm font-semibold text-[#07111f]">
                      Upload a new image
                    </span>
                    <span className="text-xs font-medium text-[#1877f2]">
                      Drag & drop, or click to browse
                    </span>
                    <span className="text-[0.7rem] text-slate-400">
                      JPG, PNG, WebP (Max 5MB)
                    </span>
                  </button>
                </div>
              </div>

              {error ? (
                <p
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t border-[#eef2f7] bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              {onDeleteRequest ? (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    onDeleteRequest(campaign);
                    onOpenChange(false);
                  }}
                  className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-50 px-3.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="size-4" strokeWidth={2.25} aria-hidden />
                  Delete Campaign
                </button>
              ) : (
                <span />
              )}
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
                  {isSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <UnpublishCampaignBlockedDialog
        open={unpublishBlockedOpen}
        activeCount={activeAutomationCount}
        onClose={() => setUnpublishBlockedOpen(false)}
      />
    </>,
    document.body,
  );
}
