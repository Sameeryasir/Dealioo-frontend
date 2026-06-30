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
import QRCode from "qrcode";
import { createPortal } from "react-dom";
import { getSetupUser } from "@/app/lib/setup-user";
import { setOffer, setOkayimageUrl, setPrice } from "@/app/store/campaignSlice";
import { useAppDispatch } from "@/app/store/hooks";

export type MakeYourOfferSavePayload = {
  offerName: string;
  offerPrice: string;
  imageFile: File;
};

export type MakeYourOfferProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (
    payload: MakeYourOfferSavePayload,
  ) => void | Promise<void | number | undefined>;
  variant?: "modal" | "inline";
  isSaving?: boolean;
};

function formatExpiryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MakeYourOffer({
  open,
  onOpenChange,
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
  const [nameErr, setNameErr] = useState(false);
  const [priceErr, setPriceErr] = useState(false);
  const [imageErr, setImageErr] = useState(false);
  const [previewCustomerName, setPreviewCustomerName] = useState("Guest customer");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isModal) setMounted(true);
  }, [isModal]);

  useEffect(() => {
    if (!open) return;
    setOfferName("");
    setOfferPrice("");
    setImageFile(null);
    setPreviewUrl(null);
    setNameErr(false);
    setPriceErr(false);
    setImageErr(false);
    dispatch(setOffer(""));
    dispatch(setPrice(""));
    dispatch(setOkayimageUrl(""));
    const user = getSetupUser();
    setPreviewCustomerName(user?.name?.trim() || "Guest customer");
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

  useEffect(() => {
    if (!open) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    const expires = formatExpiryDate();
    const payload = [
      "retention:offer-preview",
      `customer=${previewCustomerName}`,
      `offer=${offerName.trim() || "-"}`,
      `price=${offerPrice.trim() || "-"}`,
      `expires=${expires}`,
    ].join("|");

    void QRCode.toDataURL(payload, {
      width: 112,
      margin: 2,
      color: { dark: "#18181b", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [open, offerName, offerPrice, previewCustomerName]);

  if (!open) return null;
  if (isModal && !mounted) return null;

  const applyImageFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setImageFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setImageErr(true);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setImageErr(false);
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
    setImageErr(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const nameOk = offerName.trim().length > 0;
    const priceOk = offerPrice.trim().length > 0;
    const imageOk = imageFile !== null;
    setNameErr(!nameOk);
    setPriceErr(!priceOk);
    setImageErr(!imageOk);
    if (!nameOk || !priceOk || !imageOk || !imageFile) return;
    await onSave?.({
      offerName: offerName.trim(),
      offerPrice: offerPrice.trim(),
      imageFile,
    });
  };

  const offerLine =
    offerName.trim() || offerPrice.trim()
      ? [offerName.trim(), offerPrice.trim() ? `$${offerPrice.trim()}` : ""]
          .filter(Boolean)
          .join(", ") || "Your offer"
      : "Your offer name";

  const previewCard = (
    <div
      className="rounded-2xl border border-black/15 p-5 shadow-md ring-1 ring-white/10"
      style={{ backgroundColor: "#CC6E52" }}
    >
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-black/20 bg-black/20 shadow-inner ring-1 ring-white/10">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full min-h-[120px] items-center justify-center px-4 text-center text-xs font-medium text-white/55">
            Your offer image appears here
          </div>
        )}
      </div>
      <dl className="mt-4 space-y-2.5 text-[11px] leading-tight text-white">
        <div className="border-b border-white/20 pb-2.5">
          <div className="min-w-0">
            <dt className="font-semibold uppercase tracking-wide text-white/65">
              Name
            </dt>
            <dd className="mt-0.5 truncate text-sm font-semibold text-white">
              {previewCustomerName}
            </dd>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-b border-white/20 pb-2.5">
          <div className="min-w-0">
            <dt className="font-semibold uppercase tracking-wide text-white/65">
              Offer
            </dt>
            <dd className="mt-0.5 truncate text-sm font-semibold text-white">
              {offerLine}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-semibold uppercase tracking-wide text-white/65">
              Expires
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-white">
              {formatExpiryDate()}
            </dd>
          </div>
        </div>
      </dl>
      <div
        className="mt-4 flex justify-center p-3 "
        style={{ backgroundColor: "#CC6E52" }}
      >
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR code for offer preview"
            width={168}
            height={168}
            className="h-[168px] w-[168px]"
          />
        ) : (
          <div
            className="flex h-[168px] w-[168px] items-center justify-center rounded-lg bg-black/10 text-xs text-white/80"
            aria-hidden
          >
            Generating…
          </div>
        )}
      </div>
    </div>
  );

  const offerPanel = (
    <div
      className={`relative w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 ${
        isModal ? "max-w-4xl shadow-xl" : "max-w-5xl shadow-sm"
      }`}
      role={isModal ? "dialog" : "region"}
      aria-modal={isModal ? true : undefined}
      aria-labelledby={titleId}
      onClick={(ev) => ev.stopPropagation()}
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <div className="order-2 min-w-0 flex-1 lg:order-1">
          <h2
            id={titleId}
            className="text-lg font-semibold text-zinc-900 sm:text-xl"
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
                accept="image/*"
                className="hidden"
                tabIndex={-1}
                onChange={handleFileChange}
              />

              {previewUrl ? (
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white shadow-inner">
                  <div className="relative aspect-[16/10] max-h-64 w-full bg-zinc-100/80">
                    <img
                      src={previewUrl}
                      alt="Offer preview"
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                      <button
                        type="button"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-md transition hover:bg-zinc-100"
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
                  className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all ${
                    isDragging
                      ? "scale-[1.01] border-black bg-zinc-100 shadow-lg ring-2 ring-black/10"
                      : imageErr
                        ? "border-red-300 bg-red-50/50 hover:border-red-400"
                        : "border-zinc-300 bg-zinc-50/40 hover:border-zinc-400 hover:bg-zinc-50"
                  } `}
                >
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
                      isDragging
                        ? "bg-black text-white"
                        : "bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200"
                    }`}
                  >
                    <ImagePlus
                      className={`h-7 w-7 ${isDragging ? "text-white" : "text-zinc-600"}`}
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </span>
                  <span className="max-w-[240px]">
                    <span className="block text-sm font-semibold text-zinc-900">
                      {isDragging ? "Drop image here" : "Upload offer image"}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                      Drag a file here or click to choose from your computer.
                    </span>
                  </span>
                  <span className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm">
                    Browse files
                  </span>
                </label>
              )}

              {imageErr ? (
                <p className="mt-3 text-sm text-red-600" role="alert">
                  Choose a valid image file (PNG, JPG, or WebP).
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor={nameId}
                className="block text-sm font-medium text-zinc-800"
              >
                Offer name
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
                  if (nameErr && v.trim()) setNameErr(false);
                }}
                aria-invalid={nameErr}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/15"
                placeholder="e.g. Free appetizer with entrée"
              />
              {nameErr ? (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  Enter an offer name.
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor={priceId}
                className="block text-sm font-medium text-zinc-800"
              >
                Price
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
                  if (priceErr && v.trim()) setPriceErr(false);
                }}
                aria-invalid={priceErr}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/15"
                placeholder="e.g. 19.99"
              />
              {priceErr ? (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  Enter a price.
                </p>
              ) : null}
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={isSaving}
                aria-busy={isSaving}
                className="min-w-56 rounded-xl bg-black px-10 py-3 text-sm font-semibold tracking-wide text-white shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 enabled:cursor-pointer enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Creating campaign…" : "Create Campaign"}
              </button>
            </div>
          </form>
        </div>

        <aside
          className="order-1 mx-auto w-full max-w-[320px] shrink-0 lg:order-2 lg:mx-0 lg:max-w-[300px] xl:max-w-[320px]"
          aria-label="Campaign preview"
        >
          {previewCard}
        </aside>
      </div>
    </div>
  );

  if (isModal) {
    return createPortal(
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
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
