"use client";

import { ImagePlus, Trash2, Upload } from "lucide-react";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [priceErr, setPriceErr] = useState<string | null>(null);
  const [imageErr, setImageErr] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (isModal) setMounted(true);
  }, [isModal]);

  useEffect(() => {
    if (!open) return;
    setOfferName("");
    setOfferPrice("");
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
    const nextPriceErr = offerPriceValidationMessage(offerPrice);
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
      offerPrice: offerPrice.trim(),
      imageFile,
    });
  };

  const inputClass = (hasError: boolean) =>
    `mt-2 w-full rounded-full border bg-[#f8fafc] px-3 py-2.5 text-sm font-medium text-[#07111f] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 ${
      hasError
        ? "border-red-400 focus:border-red-400 focus:ring-red-200/60"
        : "border-[#e8edf5] focus:border-[#1877f2]/45 focus:ring-[#1877f2]/15"
    }`;

  const offerPanel = (
    <div
      className={`relative w-full max-h-[90vh] overflow-y-auto rounded-[1.35rem] border border-[#e8edf5] bg-white p-6 sm:p-8 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02] ${
        isModal ? "max-w-2xl" : "max-w-2xl"
      }`}
      role={isModal ? "dialog" : "region"}
      aria-modal={isModal ? true : undefined}
      aria-labelledby={titleId}
      onClick={(ev) => ev.stopPropagation()}
    >
      <h2
        id={titleId}
        className="text-lg font-extrabold tracking-tight text-[#07111f] sm:text-xl"
      >
        Make your offer
      </h2>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
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
            <div className="overflow-hidden rounded-[1.25rem] border border-[#e8edf5] bg-gradient-to-b from-[#f8fafc] to-white shadow-inner">
              <div className="relative aspect-[16/10] max-h-64 w-full bg-[#f4f8ff]/80">
                <img
                  src={previewUrl}
                  alt="Offer preview"
                  className="h-full w-full object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#07111f] shadow-md transition hover:bg-[#f4f8ff]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" aria-hidden />
                    Replace image
                  </button>
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                    onClick={clearImage}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
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
              className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.25rem] border-2 border-dashed px-6 py-10 text-center transition-all ${
                isDragging
                  ? "scale-[1.01] border-[#1877f2] bg-[#f4f8ff] shadow-lg ring-2 ring-[#1877f2]/15"
                  : imageErr
                    ? "border-red-300 bg-red-50/50 hover:border-red-400"
                    : "border-[#dbeafe] bg-[#f8fafc]/80 hover:border-[#1877f2]/45 hover:bg-[#f4f8ff]"
              } `}
            >
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-[1.1rem] transition-colors ${
                  isDragging
                    ? "bg-[#1877f2] text-white shadow-[0_4px_12px_rgba(24,119,242,0.25)]"
                    : "bg-white text-[#1877f2] shadow-sm ring-1 ring-[#bfdbfe]"
                }`}
              >
                <ImagePlus
                  className={`h-7 w-7 ${isDragging ? "text-white" : "text-[#1877f2]"}`}
                  strokeWidth={1.5}
                  aria-hidden
                />
              </span>
              <span className="max-w-[240px]">
                <span className="block text-sm font-bold text-[#07111f]">
                  {isDragging ? "Drop image here" : "Upload offer image"}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                  Drag a file here or click to choose from your computer.
                  <span className="mt-0.5 block font-semibold text-[#1877f2]">
                    Required · PNG, JPG, or WebP · max 10 MB
                  </span>
                </span>
              </span>
              <span className="rounded-full bg-[#1877f2] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_12px_rgba(24,119,242,0.25)]">
                Browse files
              </span>
            </label>
          )}

          {imageErr ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
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
            className={inputClass(nameErr != null)}
            placeholder="e.g. Free appetizer with entrée"
          />
          {nameErr ? (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {nameErr}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={priceId}
            className="block text-sm font-bold text-[#07111f]"
          >
            Price <span className="text-red-500">*</span>
          </label>
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
              if (priceErr) setPriceErr(offerPriceValidationMessage(v));
            }}
            onBlur={() => {
              if (attemptedSubmit || offerPrice.trim()) {
                setPriceErr(offerPriceValidationMessage(offerPrice));
              }
            }}
            aria-invalid={priceErr != null}
            className={inputClass(priceErr != null)}
            placeholder="e.g. 19.99"
          />
          {priceErr ? (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {priceErr}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse items-center justify-center gap-2 pt-2 sm:flex-row sm:justify-center">
          {onBack ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={onBack}
              className="min-w-40 cursor-pointer rounded-full border border-[#e8edf5] px-8 py-3 text-sm font-semibold text-slate-600 transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Back
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isSaving}
            aria-busy={isSaving}
            className="min-w-56 cursor-pointer rounded-full bg-[#1877f2] px-10 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.28)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/30 focus-visible:ring-offset-2 hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Creating campaign…" : "Create Campaign"}
          </button>
        </div>
      </form>
    </div>
  );

  if (isModal) {
    return createPortal(
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#07111f]/45 p-4 backdrop-blur-[2px]"
        role="presentation"
        onClick={() => onOpenChange(false)}
      >
        {offerPanel}
      </div>,
      document.body,
    );
  }

  return offerPanel;
}
