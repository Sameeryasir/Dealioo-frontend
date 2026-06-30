"use client";

import {
  AlertCircle,
  Building2,
  FileText,
  Flag,
  Globe,
  Hash,
  ImagePlus,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  MapPinned,
  Phone,
  Store,
  Trash2,
  Upload,
  UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

export type RegisterRestaurantFormValues = {
  name: string;
  phoneNumber: string;
  cuisineType: string;
  email: string;
  description: string;
  websiteUrl: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  branchCount: number;
  logoUrl?: string;
};

export type RegisterRestaurantFormProps = {
  submitting: boolean;
  errorMessage: string | null;
  onSubmit: (data: RegisterRestaurantFormValues) => Promise<void>;
};

const inputBase = "brand-input h-11 bg-white py-2";

const selectBase = `${inputBase} appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`;

const textareaBase = "brand-input min-h-[100px] bg-white py-3 leading-relaxed";

function fieldRing(hasError: boolean) {
  return hasError ? "brand-input-error" : "";
}

function optionalUrlRule(value: string) {
  const t = value.trim();
  if (t.length === 0) return true;
  try {
    new URL(t);
    return true;
  } catch {
    return "Enter a full URL (e.g. https://example.com).";
  }
}

const MAX_LOGO_BYTES = 10 * 1024 * 1024;
const ACCEPT_IMAGES = "image/png,image/jpeg,image/webp";

function isImageMime(mime: string): boolean {
  return mime === "image/png" || mime === "image/jpeg" || mime === "image/webp";
}

const CUISINE_OPTIONS = [
  { value: "", label: "Select cuisine type" },
  { value: "italian", label: "Italian" },
  { value: "mexican", label: "Mexican" },
  { value: "american", label: "American" },
  { value: "indian", label: "Indian" },
  { value: "pakistani", label: "Pakistani" },
  { value: "chinese", label: "Chinese" },
  { value: "japanese", label: "Japanese" },
  { value: "french", label: "French" },
  { value: "thai", label: "Thai" },
  { value: "other", label: "Other" },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

function RequiredStar() {
  return <span className="text-red-500">*</span>;
}

type LogoDropProps = {
  id: string;
  disabled: boolean;
  file: File | null;
  error?: string;
  onFile: (file: File | null) => void;
};

function RestaurantLogoDropField({
  id,
  disabled,
  file,
  error,
  onFile,
}: LogoDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState(false);

  const imagePreviewUrl = useMemo(() => {
    if (!file || !isImageMime(file.type)) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (!imagePreviewUrl) return;
    return () => URL.revokeObjectURL(imagePreviewUrl);
  }, [imagePreviewUrl]);

  const validateAndSet = useCallback(
    (f: File | null, inputEl: HTMLInputElement | null) => {
      setLocalError(undefined);
      if (!f) {
        onFile(null);
        return;
      }
      if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) {
        setLocalError("Use PNG, JPG, or WEBP only.");
        if (inputEl) inputEl.value = "";
        return;
      }
      if (f.size > MAX_LOGO_BYTES) {
        setLocalError("File must be 10MB or smaller.");
        if (inputEl) inputEl.value = "";
        return;
      }
      onFile(f);
    },
    [onFile],
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] ?? null;
      validateAndSet(f, e.target);
    },
    [validateAndSet],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;
      const f = e.dataTransfer.files?.[0] ?? null;
      validateAndSet(f, inputRef.current);
    },
    [disabled, validateAndSet],
  );

  const clearFile = useCallback(() => {
    setLocalError(undefined);
    if (inputRef.current) inputRef.current.value = "";
    onFile(null);
  }, [onFile]);

  const combinedError = error ?? localError;
  const showErrorStyle = Boolean(combinedError);

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT_IMAGES}
        className="hidden"
        tabIndex={-1}
        disabled={disabled}
        onChange={onChange}
      />

      {file && imagePreviewUrl ? (
        <div
          className={`overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white shadow-md shadow-zinc-900/10 ring-1 ring-black/[0.06] ${
            disabled ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <div className="relative aspect-[16/10] max-h-72 w-full bg-zinc-100/80 shadow-inner">
            <img
              src={imagePreviewUrl}
              alt="Restaurant logo preview"
              className="h-full w-full object-contain"
            />
            {!disabled ? (
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-brand-navy shadow-md transition hover:bg-zinc-100"
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  Replace image
                </button>
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                  onClick={clearFile}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Remove
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          aria-label="Upload restaurant logo"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={onDrop}
          className={`flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all ${
            disabled ? "pointer-events-none opacity-60" : ""
          } ${
            isDragging
              ? "scale-[1.01] border-black bg-zinc-100 shadow-lg ring-2 ring-black/10"
              : showErrorStyle
                ? "border-red-300 bg-red-50/50 hover:border-red-400"
                : "border-zinc-300 bg-white shadow-sm ring-1 ring-zinc-200/70 hover:border-zinc-400 hover:shadow-md"
          }`}
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
            <span className="block text-sm font-semibold text-brand-navy">
              {isDragging ? "Drop image here" : "Upload restaurant logo"}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
              Drag a file here or click to choose from your computer. PNG, JPG,
              or WEBP (max 10MB).
            </span>
          </span>
          <span className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm">
            Browse files
          </span>
        </label>
      )}

      {combinedError ? (
        <p className="text-sm text-red-600">{combinedError}</p>
      ) : null}
    </div>
  );
}

export default function RegisterRestaurantForm({
  submitting,
  errorMessage,
  onSubmit,
}: RegisterRestaurantFormProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoFileError, setLogoFileError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterRestaurantFormValues>({
    defaultValues: {
      name: "",
      phoneNumber: "",
      cuisineType: "",
      email: "",
      description: "",
      websiteUrl: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      branchCount: 1,
    },
  });

  const submit = handleSubmit(async (data) => {
    setLogoFileError(undefined);

    let logoUrl: string | undefined;

    if (logoFile) {
      try {
        logoUrl = await fileToDataUrl(logoFile);
      } catch {
        setLogoFileError("Could not read logo file.");
        return;
      }
    }

    await onSubmit({
      ...data,
      branchCount: 1,
      logoUrl,
    });
  });

  return (
    <div className="brand-auth-card-wide p-6 sm:p-8 lg:p-10">
      <form className="flex flex-col gap-10 font-sans" onSubmit={submit} noValidate>
        <section className="flex flex-col gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="restaurant-name"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
              >
                <Building2 className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                Restaurant Name <RequiredStar />
              </label>
              <input
                id="restaurant-name"
                type="text"
                autoComplete="organization"
                disabled={submitting}
                placeholder="Enter restaurant name"
                aria-invalid={!!errors.name}
                className={`${inputBase} py-2 ${fieldRing(!!errors.name)}`}
                {...register("name", { required: "Restaurant name is required." })}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="restaurant-phone"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
              >
                <Phone className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                Contact Number <RequiredStar />
              </label>
              <input
                id="restaurant-phone"
                type="tel"
                autoComplete="tel"
                disabled={submitting}
                placeholder="Enter contact number"
                aria-invalid={!!errors.phoneNumber}
                className={`${inputBase} py-2 ${fieldRing(!!errors.phoneNumber)}`}
                {...register("phoneNumber", {
                  required: "Contact number is required.",
                })}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-600">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="restaurant-cuisine"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
              >
                <UtensilsCrossed
                  className="h-4 w-4 shrink-0 text-zinc-400"
                  aria-hidden
                />
                Cuisine Type <RequiredStar />
              </label>
              <select
                id="restaurant-cuisine"
                disabled={submitting}
                aria-invalid={!!errors.cuisineType}
                className={`${selectBase} ${fieldRing(!!errors.cuisineType)}`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                }}
                {...register("cuisineType", {
                  required: "Select a cuisine type.",
                })}
              >
                {CUISINE_OPTIONS.map((o) => (
                  <option key={o.value || "placeholder"} value={o.value} disabled={o.value === ""}>
                    {o.label}
                  </option>
                ))}
              </select>
              {errors.cuisineType && (
                <p className="text-sm text-red-600">{errors.cuisineType.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="restaurant-email"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
              >
                <Mail className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                Email Address
              </label>
              <input
                id="restaurant-email"
                type="email"
                autoComplete="email"
                disabled={submitting}
                placeholder="Enter email address"
                aria-invalid={!!errors.email}
                className={`${inputBase} py-2 ${fieldRing(!!errors.email)}`}
                {...register("email", {
                  validate: (v) => {
                    const t = v.trim();
                    if (t.length === 0) return true;
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
                      ? true
                      : "Enter a valid email.";
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="flex max-w-sm flex-col gap-1.5">
            <label
              htmlFor="restaurant-description"
              className="flex w-fit max-w-full items-center gap-1.5 text-sm font-medium text-zinc-700"
            >
              <FileText className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
              Description
            </label>
            <textarea
              id="restaurant-description"
              disabled={submitting}
              placeholder="Enter a short description about the restaurant"
              aria-invalid={!!errors.description}
              className={`${textareaBase} w-full ${fieldRing(!!errors.description)}`}
              {...register("description")}
            />
          </div>

          <div className="flex flex-col gap-1.5 md:max-w-xl lg:max-w-2xl">
            <label
              htmlFor="restaurant-website"
              className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
            >
              <Globe className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
              Website
            </label>
            <input
              id="restaurant-website"
              type="url"
              inputMode="url"
              disabled={submitting}
              placeholder="Enter website (optional)"
              aria-invalid={!!errors.websiteUrl}
              className={`${inputBase} py-2 ${fieldRing(!!errors.websiteUrl)}`}
              {...register("websiteUrl", { validate: optionalUrlRule })}
            />
            {errors.websiteUrl && (
              <p className="text-sm text-red-600">{errors.websiteUrl.message}</p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-brand-navy">
            <MapPin className="h-5 w-5 shrink-0 text-zinc-500" strokeWidth={2} aria-hidden />
            Location
          </h2>

          <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
            <div className="flex min-w-0 flex-col gap-1.5">
              <label
                htmlFor="city"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
              >
                <Landmark className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                City <RequiredStar />
              </label>
              <input
                id="city"
                type="text"
                disabled={submitting}
                placeholder="e.g. San Francisco"
                aria-invalid={!!errors.city}
                className={`${inputBase} min-w-0 py-2 ${fieldRing(!!errors.city)}`}
                {...register("city", { required: "City is required." })}
              />
              {errors.city && (
                <p className="text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <label
                htmlFor="state"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
              >
                <MapPinned className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                State / Region <RequiredStar />
              </label>
              <input
                id="state"
                type="text"
                disabled={submitting}
                placeholder="e.g. CA"
                aria-invalid={!!errors.state}
                className={`${inputBase} min-w-0 py-2 ${fieldRing(!!errors.state)}`}
                {...register("state", { required: "State or region is required." })}
              />
              {errors.state && (
                <p className="text-sm text-red-600">{errors.state.message}</p>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <label
                htmlFor="postal"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
              >
                <Hash className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                Postal / Zip <RequiredStar />
              </label>
              <input
                id="postal"
                type="text"
                autoComplete="postal-code"
                disabled={submitting}
                placeholder="e.g. 94102"
                aria-invalid={!!errors.postalCode}
                className={`${inputBase} min-w-0 py-2 ${fieldRing(!!errors.postalCode)}`}
                {...register("postalCode", {
                  required: "Postal or zip code is required.",
                })}
              />
              {errors.postalCode && (
                <p className="text-sm text-red-600">{errors.postalCode.message}</p>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <label
                htmlFor="country"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
              >
                <Flag className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                Country <RequiredStar />
              </label>
              <input
                id="country"
                type="text"
                autoComplete="country-name"
                disabled={submitting}
                placeholder="e.g. USA"
                aria-invalid={!!errors.country}
                className={`${inputBase} min-w-0 py-2 ${fieldRing(!!errors.country)}`}
                {...register("country", { required: "Country is required." })}
              />
              {errors.country && (
                <p className="text-sm text-red-600">{errors.country.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-brand-navy">
            <ImagePlus className="h-5 w-5 shrink-0 text-zinc-500" strokeWidth={2} aria-hidden />
            Upload image
          </h2>

          <RestaurantLogoDropField
            id="restaurant-logo-file"
            disabled={submitting}
            file={logoFile}
            error={logoFileError}
            onFile={setLogoFile}
          />
        </section>

        {errorMessage && (
          <div
            className="flex items-start gap-2 rounded-xl border border-red-200/80 bg-red-50/90 px-3 py-2.5 text-sm text-red-800"
            role="alert"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
              aria-hidden
            />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            aria-label={submitting ? "Creating restaurant" : "Create restaurant"}
            className="brand-btn-primary relative inline-flex h-12 min-h-12 px-6"
          >
            <span
              className={`inline-flex items-center justify-center gap-2 ${
                submitting ? "invisible" : ""
              }`}
              aria-hidden={submitting}
            >
              <span>Create Restaurant</span>
              <Store
                className="h-5 w-5 opacity-90 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
                aria-hidden
              />
            </span>
            {submitting ? (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <Loader2
                  className="h-6 w-6 animate-spin text-white"
                  strokeWidth={2.5}
                  aria-hidden
                />
              </span>
            ) : null}
          </button>
        </div>
      </form>
    </div>
  );
}
