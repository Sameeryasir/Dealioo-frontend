"use client";

/**
 * Change summary:
 * What: Responsive Make your offer layout (mobile stack + desktop split).
 * Why: Step 3 must look good on phone/tablet without relying on scroll.
 * Related: CreateCampaigns.tsx, BusinessCampaignsPanel.tsx, campaignSlice.
 */

import {
  ArrowLeft,
  Check,
  CloudUpload,
  DollarSign,
  Eye,
  FolderOpen,
  Gift,
  ImageIcon,
  Lightbulb,
  Rocket,
  Sparkles,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { setOffer, setOkayimageUrl, setPrice } from "@/app/store/campaignSlice";
import {
  offerNameValidationMessage,
  offerPriceValidationMessage,
} from "@/app/lib/campaign-form";
import { useAppDispatch } from "@/app/store/hooks";

export type MakeYourOfferSavePayload = {
  offerName: string;
  offerPrice: string;
  imageFile: File;
  includeOfferPrice: boolean;
};

export type MakeYourOfferProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack?: () => void;
  onSave?: (
    payload: MakeYourOfferSavePayload,
  ) => void | Promise<void | number | undefined>;
  variant?: "modal" | "inline";
  isSaving?: boolean;
  allowOptionalPrice?: boolean;
};

const MAX_OFFER_IMAGE_BYTES = 10 * 1024 * 1024;

const OFFER_TIPS = [
  {
    icon: ImageIcon,
    title: "Use a clear image",
    detail: "Bright photos convert better.",
  },
  {
    icon: Tag,
    title: "Write a catchy name",
    detail: "Keep it short and specific.",
  },
  {
    icon: DollarSign,
    title: "Set the right price",
    detail: "Or skip price for postpaid.",
  },
] as const;

function offerImageValidationMessage(file: File | null): string | null {
  if (!file) return "Upload an offer image to continue.";
  if (!file.type.startsWith("image/")) {
    return "Upload an image file (PNG, JPG, or WebP).";
  }
  if (file.size > MAX_OFFER_IMAGE_BYTES) {
    return "Image must be 10 MB or smaller.";
  }
  return null;
}

export default function MakeYourOffer({
  open,
  onOpenChange,
  onBack,
  onSave,
  variant = "modal",
  isSaving = false,
  allowOptionalPrice = false,
}: MakeYourOfferProps) {
  const dispatch = useAppDispatch();
  const isModal = variant === "modal";
  const titleId = useId();
  const nameId = useId();
  const priceId = useId();
  const fileId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [offerName, setOfferName] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [includeOfferPrice, setIncludeOfferPrice] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [priceErr, setPriceErr] = useState<string | null>(null);
  const [imageErr, setImageErr] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const requirePrice = !allowOptionalPrice || includeOfferPrice;
  const previewName = offerName.trim() || "Offer name";
  const previewPriceLabel = requirePrice
    ? offerPrice.trim()
      ? `$ ${offerPrice.trim()}`
      : "$ 19.99"
    : "No price";

  useEffect(() => {
    if (isModal) setMounted(true);
  }, [isModal]);

  useEffect(() => {
    if (!open) return;
    setOfferName("");
    setOfferPrice("");
    setIncludeOfferPrice(true);
    setImageFile(null);
    setPreviewUrl(null);
    setNameErr(null);
    setPriceErr(null);
    setImageErr(null);
    setAttemptedSubmit(false);
    dispatch(setOffer(""));
    dispatch(setPrice(""));
    dispatch(setOkayimageUrl(""));
  }, [open, dispatch]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return;
    dispatch(setOkayimageUrl(previewUrl ?? ""));
  }, [open, previewUrl, dispatch]);

  useEffect(() => {
    if (!open || !isModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isModal, onOpenChange]);

  if (!open) return null;
  if (isModal && !mounted) return null;

  const applyImageFile = (f: File | undefined) => {
    if (!f) return;
    const error = offerImageValidationMessage(f);
    if (error) {
      setImageFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setImageErr(error);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setImageErr(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    applyImageFile(e.target.files?.[0]);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    applyImageFile(e.dataTransfer.files?.[0]);
  };

  const clearImage = () => {
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setImageErr(
      attemptedSubmit ? "Upload an offer image to continue." : null,
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateAll = () => {
    const nextNameErr = offerNameValidationMessage(offerName);
    const nextPriceErr = requirePrice
      ? offerPriceValidationMessage(offerPrice)
      : null;
    const nextImageErr = offerImageValidationMessage(imageFile);
    setNameErr(nextNameErr);
    setPriceErr(nextPriceErr);
    setImageErr(nextImageErr);
    return !nextNameErr && !nextPriceErr && !nextImageErr && imageFile != null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setAttemptedSubmit(true);
    if (!validateAll() || !imageFile) return;
    await onSave?.({
      offerName: offerName.trim(),
      offerPrice: requirePrice ? offerPrice.trim() : "",
      imageFile,
      includeOfferPrice: requirePrice,
    });
  };

  const fieldShell = (hasError: boolean) =>
    `flex w-full items-center overflow-hidden rounded-xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:ring-2 ${
      hasError
        ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-200/60"
        : "border-[#e2e8f0] focus-within:border-[#1877f2]/55 focus-within:ring-[#1877f2]/15 focus-within:shadow-[0_0_0_4px_rgba(24,119,242,0.08)]"
    }`;

  const livePreviewCard = (
    <div className="overflow-hidden rounded-2xl border border-[#c7dbf8] bg-white shadow-[0_10px_24px_rgba(24,119,242,0.1)] ring-1 ring-[#1877f2]/10">
      <div className="relative flex h-24 items-center justify-center overflow-hidden bg-white sm:h-[7.25rem]">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-[#93c5fd]">
            <ImageIcon
              className="size-8 sm:size-9"
              strokeWidth={1.25}
              aria-hidden
            />
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.08em]">
              Your image
            </span>
          </div>
        )}
        {previewUrl ? (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-[#07111f]/70 px-2 py-0.5 text-[0.6rem] font-bold text-white backdrop-blur-sm">
            <Check className="size-2.5" aria-hidden />
            Ready
          </span>
        ) : null}
      </div>
      <div className="border-t border-[#eef2f7] px-3 py-2.5 sm:px-3.5 sm:py-3">
        <p className="m-0 truncate text-sm font-extrabold text-[#07111f] sm:text-[0.92rem]">
          {previewName}
        </p>
        <p
          className={`m-0 mt-0.5 text-sm font-extrabold ${
            requirePrice ? "text-[#1877f2]" : "text-slate-400"
          }`}
        >
          {previewPriceLabel}
        </p>
      </div>
    </div>
  );

  const offerPanel = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto h-fit w-full min-w-0 max-w-4xl self-start overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white shadow-[0_22px_50px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.03] sm:rounded-[1.5rem]"
      role={isModal ? "dialog" : "region"}
      aria-modal={isModal ? true : undefined}
      aria-labelledby={titleId}
      onClick={(ev) => ev.stopPropagation()}
    >
      {/* --- Header --- */}
      <div className="relative border-b border-[#e8edf5] bg-white px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-[0_10px_24px_rgba(24,119,242,0.35)] sm:size-12 sm:rounded-2xl">
            <Gift className="size-4 sm:size-5" strokeWidth={1.75} aria-hidden />
            <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full border-2 border-white bg-[#07111f] text-[0.5rem] font-bold text-white sm:size-5 sm:text-[0.55rem]">
              3
            </span>
          </span>
          <div className="min-w-0">
            <p className="m-0 inline-flex flex-wrap items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#1877f2] sm:text-[0.72rem]">
              <Sparkles className="size-3" aria-hidden />
              Step 3 of 3 · Final step
            </p>
            <h2
              id={titleId}
              className="m-0 mt-1 text-[1.05rem] font-extrabold tracking-tight text-[#07111f] sm:text-[1.35rem]"
            >
              Make your offer
            </h2>
            <p className="m-0 mt-1 text-[0.75rem] font-medium text-slate-500 sm:text-[0.8rem]">
              Add the image, name, and price guests will see.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid min-w-0 md:grid-cols-[minmax(13.5rem,16rem)_minmax(0,1fr)] lg:grid-cols-[minmax(16rem,18.5rem)_minmax(0,1fr)]">
          {/* --- Tips + live preview --- */}
          <aside className="relative order-2 min-w-0 border-t border-[#e8edf5] bg-[#f0f7ff] px-4 py-4 md:order-1 md:border-t-0 md:border-r sm:px-5 sm:py-5">
            {/* Mobile: tip chips + preview */}
            <div className="md:hidden">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[#1877f2] text-white">
                  <Lightbulb
                    className="size-3.5"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
                <p className="m-0 text-sm font-extrabold text-[#07111f]">
                  Tips for a great offer
                </p>
              </div>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {OFFER_TIPS.map((tip, index) => {
                  const Icon = tip.icon;
                  return (
                    <div
                      key={tip.title}
                      className="min-w-[9.5rem] shrink-0 rounded-xl border border-white bg-white px-2.5 py-2 shadow-sm"
                    >
                      <span className="flex items-center gap-1.5 text-[0.72rem] font-bold text-[#07111f]">
                        <Icon
                          className="size-3.5 shrink-0 text-[#1877f2]"
                          aria-hidden
                        />
                        <span className="text-[#93c5fd]">0{index + 1}</span>
                        {tip.title}
                      </span>
                      <span className="mt-1 block text-[0.65rem] font-medium leading-snug text-slate-500">
                        {tip.detail}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="m-0 inline-flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#1877f2]">
                    <Eye className="size-3.5" aria-hidden />
                    Live preview
                  </p>
                  <span className="rounded-full bg-[#1877f2]/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.05em] text-[#1877f2]">
                    Guest view
                  </span>
                </div>
                {livePreviewCard}
              </div>
            </div>

            {/* Tablet / desktop sidebar */}
            <div className="relative hidden md:block">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-[0_6px_14px_rgba(24,119,242,0.3)]">
                  <Lightbulb className="size-4" strokeWidth={1.75} aria-hidden />
                </span>
                <p className="m-0 text-sm font-extrabold text-[#07111f]">
                  Tips for a great offer
                </p>
              </div>

              <ul className="mt-4 space-y-2.5">
                {OFFER_TIPS.map((tip, index) => {
                  const Icon = tip.icon;
                  return (
                    <li
                      key={tip.title}
                      className="flex items-start gap-2.5 rounded-xl border border-white/80 bg-white px-2.5 py-2 shadow-[0_4px_12px_rgba(24,119,242,0.06)]"
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f2ff] text-[#1877f2] ring-1 ring-[#bfdbfe]/70">
                        <Icon
                          className="size-3.5"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-[0.8rem] font-bold text-[#07111f]">
                          <span className="text-[0.65rem] font-extrabold text-[#93c5fd]">
                            0{index + 1}
                          </span>
                          {tip.title}
                        </span>
                        <span className="mt-0.5 block text-[0.72rem] font-medium leading-snug text-slate-500">
                          {tip.detail}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="m-0 inline-flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#1877f2]">
                    <Eye className="size-3.5" aria-hidden />
                    Live preview
                  </p>
                  <span className="rounded-full bg-[#1877f2]/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.05em] text-[#1877f2]">
                    Guest view
                  </span>
                </div>
                {livePreviewCard}
              </div>
            </div>
          </aside>

          {/* --- Form fields --- */}
          <div className="order-1 flex min-w-0 flex-col bg-white px-4 py-4 md:order-2 sm:px-6 sm:py-5">
            <div className="space-y-3.5 sm:space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label
                    htmlFor={fileId}
                    className="text-sm font-bold text-[#07111f]"
                  >
                    Offer image <span className="text-red-500">*</span>
                  </label>
                  <span className="rounded-full bg-[#1877f2] px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.06em] text-white shadow-[0_4px_10px_rgba(24,119,242,0.25)]">
                    Required
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  id={fileId}
                  name="offerImage"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  tabIndex={-1}
                  onChange={handleFileChange}
                />

                {previewUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-[#c7dbf8] bg-[#f4f8ff] ring-1 ring-[#1877f2]/10">
                    <div className="relative h-28 w-full sm:h-36">
                      <img
                        src={previewUrl}
                        alt="Offer preview"
                        className="h-full w-full object-contain"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-gradient-to-t from-[#07111f]/75 via-[#07111f]/25 to-transparent p-3 pt-12">
                        <button
                          type="button"
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-[#07111f] shadow-md"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="size-3.5" aria-hidden />
                          Replace
                        </button>
                        <button
                          type="button"
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/40 bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
                          onClick={clearImage}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor={fileId}
                    aria-label="Upload offer image"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`group relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed px-3 py-4 text-center transition duration-200 sm:px-4 sm:py-5 ${
                      isDragging
                        ? "border-[#1877f2] bg-[#e8f2ff]"
                        : imageErr
                          ? "border-red-300 bg-red-50/40"
                          : "border-[#c7dbf8] bg-[#f8fbff] hover:border-[#1877f2]/70"
                    }`}
                  >
                    <span className="relative z-[1] flex size-11 items-center justify-center rounded-2xl bg-white text-[#1877f2] shadow-[0_8px_18px_rgba(24,119,242,0.18)] ring-1 ring-[#bfdbfe] sm:size-12">
                      <CloudUpload
                        className="size-5"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </span>
                    <span className="relative z-[1] px-1">
                      <span className="block text-sm font-extrabold text-[#07111f]">
                        {isDragging ? "Drop image here" : "Upload offer image"}
                      </span>
                      <span className="mt-1 block text-[0.72rem] font-medium text-slate-500 sm:text-[0.78rem]">
                        Drag & drop or click to{" "}
                        <span className="font-bold text-[#1877f2]">
                          browse your
                        </span>{" "}
                        files
                      </span>
                      <span className="mt-1 block text-[0.68rem] font-medium text-slate-400">
                        PNG, JPG, WebP · Max 10MB
                      </span>
                    </span>
                    <span className="relative z-[1] inline-flex items-center gap-1.5 rounded-xl bg-[#1877f2] px-3.5 py-2 text-xs font-bold text-white">
                      <FolderOpen className="size-3.5" aria-hidden />
                      Choose file
                    </span>
                  </label>
                )}

                {imageErr ? (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {imageErr}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor={nameId}
                  className="block text-sm font-bold text-[#07111f]"
                >
                  Offer name <span className="text-red-500">*</span>
                </label>
                <div className={`mt-1.5 ${fieldShell(nameErr != null)}`}>
                  <span className="flex shrink-0 items-center pl-3 text-[#1877f2]/70">
                    <Tag className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <input
                    id={nameId}
                    name="offerName"
                    type="text"
                    autoComplete="off"
                    value={offerName}
                    onChange={(e) => {
                      const v = e.target.value;
                      setOfferName(v);
                      dispatch(setOffer(v));
                      if (nameErr) setNameErr(offerNameValidationMessage(v));
                    }}
                    onBlur={() => {
                      if (attemptedSubmit || offerName.trim()) {
                        setNameErr(offerNameValidationMessage(offerName));
                      }
                    }}
                    aria-invalid={nameErr != null}
                    className="min-w-0 flex-1 border-0 bg-transparent px-2.5 py-2.5 text-sm font-medium text-[#07111f] outline-none placeholder:text-slate-400"
                    placeholder="e.g. Free appetizer with entrée"
                  />
                </div>
                {nameErr ? (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {nameErr}
                  </p>
                ) : null}
              </div>

              {allowOptionalPrice || requirePrice ? (
                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    {allowOptionalPrice ? (
                      <p className="m-0 text-sm font-bold text-[#07111f]">
                        Price
                      </p>
                    ) : (
                      <label
                        htmlFor={priceId}
                        className="text-sm font-bold text-[#07111f]"
                      >
                        Price <span className="text-red-500">*</span>
                      </label>
                    )}

                    {allowOptionalPrice ? (
                      <div
                        className="inline-flex w-full rounded-xl border border-[#dbe5f1] bg-[#f4f8ff] p-1 sm:w-auto"
                        role="radiogroup"
                        aria-label="Offer price option"
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={includeOfferPrice}
                          onClick={() => {
                            setIncludeOfferPrice(true);
                            setPriceErr(null);
                          }}
                          className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition sm:flex-none ${
                            includeOfferPrice
                              ? "bg-[#1877f2] text-white shadow-[0_4px_12px_rgba(24,119,242,0.3)]"
                              : "text-slate-600 hover:bg-white hover:text-[#07111f]"
                          }`}
                        >
                          Add a price
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={!includeOfferPrice}
                          onClick={() => {
                            setIncludeOfferPrice(false);
                            setOfferPrice("");
                            dispatch(setPrice(""));
                            setPriceErr(null);
                          }}
                          className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition sm:flex-none ${
                            !includeOfferPrice
                              ? "bg-[#1877f2] text-white shadow-[0_4px_12px_rgba(24,119,242,0.3)]"
                              : "text-slate-600 hover:bg-white hover:text-[#07111f]"
                          }`}
                        >
                          No price
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {requirePrice ? (
                    <div className="mt-1.5">
                      {allowOptionalPrice ? (
                        <label htmlFor={priceId} className="sr-only">
                          Offer price
                        </label>
                      ) : null}
                      <div className={fieldShell(priceErr != null)}>
                        <span
                          className="flex shrink-0 items-center border-r border-[#e2e8f0] bg-[#f4f8ff] px-3.5 py-2.5 text-sm font-extrabold text-[#1877f2]"
                          aria-hidden
                        >
                          $
                        </span>
                        <input
                          id={priceId}
                          name="offerPrice"
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={offerPrice}
                          onChange={(e) => {
                            const v = e.target.value;
                            setOfferPrice(v);
                            dispatch(setPrice(v));
                            if (priceErr) {
                              setPriceErr(offerPriceValidationMessage(v));
                            }
                          }}
                          onBlur={() => {
                            if (attemptedSubmit || offerPrice.trim()) {
                              setPriceErr(
                                offerPriceValidationMessage(offerPrice),
                              );
                            }
                          }}
                          aria-invalid={priceErr != null}
                          className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm font-medium text-[#07111f] outline-none placeholder:text-slate-400"
                          placeholder="19.99"
                        />
                      </div>
                      {priceErr ? (
                        <p className="mt-2 text-sm text-red-600" role="alert">
                          {priceErr}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex flex-col-reverse gap-2 border-t border-[#e8edf5] pt-4 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
              {onBack ? (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={onBack}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Back
                </button>
              ) : (
                <span className="hidden sm:block" />
              )}
              <button
                type="submit"
                disabled={isSaving}
                aria-busy={isSaving}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-6 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(24,119,242,0.35)] transition hover:bg-[#166fe5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <Rocket className="size-4" aria-hidden />
                {isSaving ? "Creating campaign…" : "Create Campaign"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );

  if (isModal) {
    return createPortal(
      <div
        className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto bg-[#07111f]/45 p-3 backdrop-blur-[2px] sm:items-center sm:overflow-hidden sm:p-4"
        role="presentation"
        onClick={() => onOpenChange(false)}
      >
        <div className="my-3 w-full min-w-0 sm:my-0">{offerPanel}</div>
      </div>,
      document.body,
    );
  }

  return offerPanel;
}
