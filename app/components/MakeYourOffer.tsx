"use client";

import {
  ArrowLeft,
  CloudUpload,
  FileText,
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
  campaignDescriptionValidationMessage,
  offerNameValidationMessage,
  offerPriceValidationMessage,
} from "@/app/lib/campaign-form";
import { useAppDispatch } from "@/app/store/hooks";

export type MakeYourOfferSavePayload = {
  offerName: string;
  description: string;
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
  const descriptionId = useId();
  const priceId = useId();
  const fileId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [offerName, setOfferName] = useState("");
  const [description, setDescription] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [includeOfferPrice, setIncludeOfferPrice] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [descErr, setDescErr] = useState<string | null>(null);
  const [priceErr, setPriceErr] = useState<string | null>(null);
  const [imageErr, setImageErr] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const requirePrice = !allowOptionalPrice || includeOfferPrice;

  useEffect(() => {
    if (isModal) setMounted(true);
  }, [isModal]);

  useEffect(() => {
    if (!open) return;
    setOfferName("");
    setDescription("");
    setOfferPrice("");
    setIncludeOfferPrice(true);
    setImageFile(null);
    setPreviewUrl(null);
    setNameErr(null);
    setDescErr(null);
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
    const nextDescErr = campaignDescriptionValidationMessage(description);
    const nextPriceErr = requirePrice
      ? offerPriceValidationMessage(offerPrice)
      : null;
    const nextImageErr = offerImageValidationMessage(imageFile);
    setNameErr(nextNameErr);
    setDescErr(nextDescErr);
    setPriceErr(nextPriceErr);
    setImageErr(nextImageErr);
    return (
      !nextNameErr &&
      !nextDescErr &&
      !nextPriceErr &&
      !nextImageErr &&
      imageFile != null
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setAttemptedSubmit(true);
    if (!validateAll() || !imageFile) return;
    await onSave?.({
      offerName: offerName.trim(),
      description: description.trim(),
      offerPrice: requirePrice ? offerPrice.trim() : "",
      imageFile,
      includeOfferPrice: requirePrice,
    });
  };

  const fieldShell = (hasError: boolean) =>
    `flex w-full items-center overflow-hidden rounded-xl border bg-white transition focus-within:ring-2 ${
      hasError
        ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-200/60"
        : "border-[#e2e8f0] focus-within:border-[#1877f2]/55 focus-within:ring-[#1877f2]/15"
    }`;

  const offerPanel = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto h-fit w-full min-w-0 max-w-lg self-start overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.1)]"
      role={isModal ? "dialog" : "region"}
      aria-modal={isModal ? true : undefined}
      aria-labelledby={titleId}
      onClick={(ev) => ev.stopPropagation()}
    >
      <div className="border-b border-[#e8edf5] px-5 py-4 sm:px-6">
        <h2
          id={titleId}
          className="m-0 text-lg font-extrabold tracking-tight text-[#07111f]"
        >
          Make your offer
        </h2>
        <p className="m-0 mt-1 text-sm text-slate-500">
          Image, name, description, and price.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div>
            <label
              htmlFor={fileId}
              className="block text-sm font-semibold text-[#07111f]"
            >
              Offer image <span className="text-red-500">*</span>
            </label>

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
              <div className="mt-1.5 overflow-hidden rounded-xl border border-[#e2e8f0]">
                <div className="relative h-36 w-full bg-[#f8fafc]">
                  <img
                    src={previewUrl}
                    alt="Offer preview"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex gap-2 border-t border-[#e8edf5] bg-white p-2">
                  <button
                    type="button"
                    className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-2 text-xs font-semibold text-[#07111f] hover:bg-[#f8fafc]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-3.5" aria-hidden />
                    Replace
                  </button>
                  <button
                    type="button"
                    className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-[#f8fafc]"
                    onClick={clearImage}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor={fileId}
                aria-label="Upload offer image"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
                  isDragging
                    ? "border-[#1877f2] bg-[#eff6ff]"
                    : imageErr
                      ? "border-red-300 bg-red-50/40"
                      : "border-[#dbe5f1] bg-[#f8fafc] hover:border-[#1877f2]/60"
                }`}
              >
                <CloudUpload
                  className="size-6 text-[#1877f2]"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="text-sm font-semibold text-[#07111f]">
                  {isDragging ? "Drop image here" : "Click or drag to upload"}
                </span>
                <span className="text-xs text-slate-400">
                  PNG, JPG, WebP · Max 10MB
                </span>
              </label>
            )}

            {imageErr ? (
              <p className="mt-1.5 text-sm text-red-600" role="alert">
                {imageErr}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={nameId}
              className="block text-sm font-semibold text-[#07111f]"
            >
              Offer name <span className="text-red-500">*</span>
            </label>
            <div className={`mt-1.5 ${fieldShell(nameErr != null)}`}>
              <span className="flex shrink-0 items-center pl-3 text-slate-400">
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
                className="min-w-0 flex-1 border-0 bg-transparent px-2.5 py-2.5 text-sm text-[#07111f] outline-none placeholder:text-slate-400"
                placeholder="e.g. Free appetizer with entrée"
              />
            </div>
            {nameErr ? (
              <p className="mt-1.5 text-sm text-red-600" role="alert">
                {nameErr}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={descriptionId}
              className="block text-sm font-semibold text-[#07111f]"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <div className={`mt-1.5 ${fieldShell(descErr != null)}`}>
              <span className="flex shrink-0 items-start pt-3 pl-3 text-slate-400">
                <FileText className="size-4" strokeWidth={1.75} aria-hidden />
              </span>
              <textarea
                id={descriptionId}
                name="campaignDescription"
                rows={3}
                value={description}
                onChange={(e) => {
                  const v = e.target.value;
                  setDescription(v);
                  if (descErr) {
                    setDescErr(campaignDescriptionValidationMessage(v));
                  }
                }}
                onBlur={() => {
                  if (attemptedSubmit || description.trim()) {
                    setDescErr(
                      campaignDescriptionValidationMessage(description),
                    );
                  }
                }}
                aria-invalid={descErr != null}
                className="min-h-[5rem] min-w-0 flex-1 resize-y border-0 bg-transparent px-2.5 py-2.5 text-sm leading-relaxed text-[#07111f] outline-none placeholder:text-slate-400"
                placeholder="What customers get"
              />
            </div>
            {descErr ? (
              <p className="mt-1.5 text-sm text-red-600" role="alert">
                {descErr}
              </p>
            ) : null}
          </div>

          {allowOptionalPrice || requirePrice ? (
            <div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {allowOptionalPrice ? (
                  <p className="m-0 text-sm font-semibold text-[#07111f]">
                    Price
                  </p>
                ) : (
                  <label
                    htmlFor={priceId}
                    className="text-sm font-semibold text-[#07111f]"
                  >
                    Price <span className="text-red-500">*</span>
                  </label>
                )}

                {allowOptionalPrice ? (
                  <div
                    className="inline-flex w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-0.5 sm:w-auto"
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
                      className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition sm:flex-none ${
                        includeOfferPrice
                          ? "bg-[#1877f2] text-white"
                          : "text-slate-600 hover:bg-white"
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
                      className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition sm:flex-none ${
                        !includeOfferPrice
                          ? "bg-[#1877f2] text-white"
                          : "text-slate-600 hover:bg-white"
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
                      className="flex shrink-0 items-center border-r border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm font-semibold text-slate-500"
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
                          setPriceErr(offerPriceValidationMessage(offerPrice));
                        }
                      }}
                      aria-invalid={priceErr != null}
                      className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-[#07111f] outline-none placeholder:text-slate-400"
                      placeholder="19.99"
                    />
                  </div>
                  {priceErr ? (
                    <p className="mt-1.5 text-sm text-red-600" role="alert">
                      {priceErr}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#e8edf5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {onBack ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={onBack}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
            className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-[#1877f2] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#166fe5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSaving ? "Creating campaign…" : "Create Campaign"}
          </button>
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
