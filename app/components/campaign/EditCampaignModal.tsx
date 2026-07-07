"use client";

import {
  AlertCircle,
  Check,
  CircleDollarSign,
  Gift,
  Globe,
  ImageIcon,
  ImagePlus,
  Megaphone,
  Pencil,
  Upload,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import { parseOfferPrice } from "@/app/lib/campaign-form";
import { primaryButtonMdClass } from "@/app/lib/panel-styles";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-restaurant";
import { updateCampaign } from "@/app/services/funnel/update-campaign";

const inputClassName =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10";

function FieldLabel({
  icon: Icon,
  htmlFor,
  iconClassName = "text-zinc-500",
  iconBoxClassName = "border-zinc-200 bg-white",
  children,
}: {
  icon: LucideIcon;
  htmlFor: string;
  iconClassName?: string;
  iconBoxClassName?: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-center gap-2 text-xs font-medium text-zinc-700"
    >
      <span
        className={`inline-flex size-6 shrink-0 items-center justify-center rounded-md border ${iconBoxClassName}`}
      >
        <Icon className={`size-3.5 ${iconClassName}`} strokeWidth={2.25} aria-hidden />
      </span>
      {children}
    </label>
  );
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
}: {
  open: boolean;
  campaign: Funnel | null | undefined;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void | Promise<void>;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [offer, setOffer] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !campaign) return;
    setCampaignName(campaign.campaignName?.trim() ?? "");
    setWebsiteUrl(campaign.websiteUrl?.trim() ?? "");
    setOffer(campaign.offer?.trim() ?? "");
    setPrice(parsePrice(campaign.price));
    setImageFile(null);
    setPreviewUrl(campaign.imageUrl?.trim() || null);
    setError(null);
    setIsSaving(false);
    setIsDragging(false);
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
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const nextUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextUrl;
    setImageFile(file);
    setPreviewUrl(nextUrl);
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
      await updateCampaign({
        campaignId: campaign.id,
        campaignName: campaignName.trim(),
        websiteUrl: websiteUrl.trim(),
        offer: offer.trim(),
        price: parseOfferPrice(price),
        image: imageFile,
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
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-900/55 p-3 backdrop-blur-[3px]"
      role="presentation"
      onClick={() => {
        if (!isSaving) onOpenChange(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm">
              <Pencil className="size-4" strokeWidth={2.25} aria-hidden />
            </span>
            <h2 id={titleId} className="text-base font-semibold text-zinc-900">
              Edit campaign
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50"
          >
            <X className="size-4" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="space-y-4 px-5 py-4">
            <div>
              <FieldLabel
                htmlFor="edit-campaign-name"
                icon={Megaphone}
                iconClassName="text-blue-600"
                iconBoxClassName="border-blue-200 bg-blue-50"
              >
                Campaign name
              </FieldLabel>
              <input
                id="edit-campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className={inputClassName}
                placeholder="Campaign name"
                required
              />
            </div>

            <div>
              <FieldLabel
                htmlFor="edit-campaign-url"
                icon={Globe}
                iconClassName="text-emerald-600"
                iconBoxClassName="border-emerald-200 bg-emerald-50"
              >
                Website URL
              </FieldLabel>
              <input
                id="edit-campaign-url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className={`${inputClassName} font-mono text-sm`}
                placeholder="https://yoursite.com"
                required
              />
            </div>

            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <div>
                <FieldLabel
                  htmlFor="edit-campaign-offer"
                  icon={Gift}
                  iconClassName="text-violet-600"
                  iconBoxClassName="border-violet-200 bg-violet-50"
                >
                  Offer
                </FieldLabel>
                <input
                  id="edit-campaign-offer"
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  className={inputClassName}
                  placeholder="Offer name"
                  required
                />
              </div>
              <div>
                <FieldLabel
                  htmlFor="edit-campaign-price"
                  icon={CircleDollarSign}
                  iconClassName="text-amber-600"
                  iconBoxClassName="border-amber-200 bg-amber-50"
                >
                  Price
                </FieldLabel>
                <input
                  id="edit-campaign-price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  inputMode="decimal"
                  className={inputClassName}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <FieldLabel
                htmlFor="edit-campaign-image"
                icon={ImageIcon}
                iconClassName="text-rose-600"
                iconBoxClassName="border-rose-200 bg-rose-50"
              >
                Offer image
              </FieldLabel>
              <input
                ref={fileInputRef}
                id="edit-campaign-image"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleImageChange}
              />

              {previewUrl ? (
                <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-gradient-to-b from-zinc-50 to-white shadow-sm ring-1 ring-zinc-950/5">
                  <div className="relative aspect-[16/9] w-full bg-zinc-100/80">
                    <img
                      src={previewUrl}
                      alt="Campaign offer preview"
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pb-3 pt-10">
                      <p className="flex items-center gap-1 text-xs font-medium text-white/90">
                        <ImageIcon className="size-3.5 text-rose-300" aria-hidden />
                        Current offer image
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-md transition hover:bg-zinc-100"
                      >
                        <Upload className="size-3.5 text-blue-600" aria-hidden />
                        Replace
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label="Upload offer image"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex w-full flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-all ${
                    isDragging
                      ? "scale-[1.01] border-zinc-900 bg-zinc-100 shadow-md ring-2 ring-zinc-900/10"
                      : "border-zinc-200 bg-gradient-to-b from-zinc-50/80 to-white hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <span
                    className={`flex size-12 items-center justify-center rounded-xl shadow-sm ring-1 transition-colors ${
                      isDragging
                        ? "bg-rose-600 text-white ring-rose-600"
                        : "bg-rose-50 text-rose-600 ring-rose-200"
                    }`}
                  >
                    <ImagePlus className="size-6" strokeWidth={1.5} aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-zinc-900">
                      {isDragging ? "Drop image here" : "Upload offer image"}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      Drag & drop or click to browse, PNG, JPG, WebP
                    </span>
                  </span>
                  <span className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm">
                    Browse files
                  </span>
                </button>
              )}
            </div>

            {error ? (
              <p
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              <X className="size-4 text-red-500" aria-hidden />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`${primaryButtonMdClass} inline-flex h-9 items-center gap-1.5 px-4 text-sm`}
            >
              <Check className="size-4 text-emerald-300" aria-hidden />
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
