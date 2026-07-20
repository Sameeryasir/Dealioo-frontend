"use client";

import {
  AlertCircle,
  Check,
  CircleDollarSign,
  Gift,
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
import { useQueryClient } from "@tanstack/react-query";
import { parseOfferPrice } from "@/app/lib/campaign-form";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-business";
import { updateCampaign } from "@/app/services/funnel/update-campaign";

const inputClassName =
  "w-full rounded-xl border border-[#dbeafe] bg-white px-3.5 py-2.5 text-sm text-[#07111f] outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/55 focus:ring-2 focus:ring-[#1877f2]/20";

function FieldLabel({
  icon: Icon,
  htmlFor,
  children,
}: {
  icon: LucideIcon;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-700"
    >
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg border border-[#dbeafe] bg-gradient-to-br from-[#eef5ff] to-[#f5f0ff] text-[#1877f2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
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
  const queryClient = useQueryClient();
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [campaignName, setCampaignName] = useState("");
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
        websiteUrl: campaign.websiteUrl?.trim() ?? "",
        offer: offer.trim(),
        price: parseOfferPrice(price),
        image: imageFile,
      });
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
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#07111f]/55 p-3 backdrop-blur-[6px]"
      role="presentation"
      onClick={() => {
        if (!isSaving) onOpenChange(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md overflow-hidden rounded-[1.25rem] border border-[#e2eaf5] bg-white shadow-[0_24px_56px_rgba(7,17,31,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden border-b border-[#eef2f8] px-5 py-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#f4f8ff] via-white to-[#faf5ff]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-8 size-28 rounded-full bg-[#833aba]/12 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-4 top-0 size-24 rounded-full bg-[#1877f2]/12 blur-2xl"
          />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1877f2] to-[#833aba] text-white shadow-[0_10px_22px_rgba(24,119,242,0.28)]">
                <Pencil className="size-4" strokeWidth={2.25} aria-hidden />
              </span>
              <div>
                <h2
                  id={titleId}
                  className="text-base font-extrabold tracking-tight text-[#07111f]"
                >
                  Edit campaign
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Update name, offer, price, and image
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
              className="flex size-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-[#eef5ff] hover:text-[#1877f2] disabled:opacity-50"
            >
              <X className="size-4" strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="space-y-4 bg-gradient-to-b from-[#f8fbff]/80 to-white px-5 py-4">
            <div>
              <FieldLabel htmlFor="edit-campaign-name" icon={Megaphone}>
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

            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <div>
                <FieldLabel htmlFor="edit-campaign-offer" icon={Gift}>
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
                <FieldLabel htmlFor="edit-campaign-price" icon={CircleDollarSign}>
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
              <FieldLabel htmlFor="edit-campaign-image" icon={ImageIcon}>
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
                <div className="overflow-hidden rounded-2xl border border-[#dbeafe] bg-gradient-to-b from-[#f8fbff] to-white shadow-[0_8px_20px_rgba(24,119,242,0.06)]">
                  <div className="relative aspect-[16/9] w-full bg-[#eef5ff]/80">
                    <img
                      src={previewUrl}
                      alt="Campaign offer preview"
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-[#07111f]/80 via-[#0a1628]/35 to-transparent px-3 pb-3 pt-10">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-white/90">
                        <ImageIcon className="size-3.5 text-[#93c5fd]" aria-hidden />
                        Current offer image
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#07111f] shadow-md transition hover:bg-[#eef5ff]"
                      >
                        <Upload className="size-3.5 text-[#1877f2]" aria-hidden />
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
                  className={`flex w-full flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-all ${
                    isDragging
                      ? "scale-[1.01] border-[#1877f2] bg-[#eef5ff] shadow-md ring-2 ring-[#1877f2]/15"
                      : "border-[#dbeafe] bg-gradient-to-b from-[#f8fbff] to-white hover:border-[#1877f2]/45 hover:bg-[#f4f8ff]"
                  }`}
                >
                  <span
                    className={`flex size-12 items-center justify-center rounded-xl shadow-sm transition-colors ${
                      isDragging
                        ? "bg-gradient-to-br from-[#1877f2] to-[#833aba] text-white"
                        : "bg-gradient-to-br from-[#eef5ff] to-[#f5f0ff] text-[#1877f2] ring-1 ring-[#dbeafe]"
                    }`}
                  >
                    <ImagePlus className="size-6" strokeWidth={1.5} aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#07111f]">
                      {isDragging ? "Drop image here" : "Upload offer image"}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Drag & drop or click to browse · PNG, JPG, WebP
                    </span>
                  </span>
                  <span className="rounded-full bg-gradient-to-r from-[#1877f2] to-[#833aba] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_8px_16px_rgba(24,119,242,0.25)]">
                    Browse files
                  </span>
                </button>
              )}
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

          <div className="flex justify-end gap-2 border-t border-[#eef2f8] bg-gradient-to-r from-white via-[#f8fbff] to-white px-5 py-3.5">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#e8edf5] bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] hover:text-[#1877f2] disabled:opacity-50"
            >
              <X className="size-4" aria-hidden />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1877f2] to-[#833aba] px-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(24,119,242,0.28)] transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check className="size-4" aria-hidden />
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
