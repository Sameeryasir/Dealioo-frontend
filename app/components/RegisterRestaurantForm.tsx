"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  FileText,
  Flag,
  Globe,
  Hash,
  ImagePlus,
  Landmark,
  Link2,
  Loader2,
  LocateFixed,
  Mail,
  MapPin,
  MapPinned,
  Phone,
  Store,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { resolveAddressFromBrowserLocation } from "@/app/lib/browser-geolocation";
import { slugifyBusinessName } from "@/app/lib/business-slug";

const BusinessLocationMap = dynamic(
  () =>
    import("@/app/components/BusinessLocationMap").then(
      (mod) => mod.BusinessLocationMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-52 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-500 sm:h-56">
        Loading map…
      </div>
    ),
  },
);

export type RegisterRestaurantFormValues = {
  name: string;
  phoneNumber: string;
  email: string;
  description: string;
  websiteUrl: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  branchCount: number;
  logoFile?: File | null;
};

export type RegisterRestaurantFormProps = {
  submitting: boolean;
  errorMessage: string | null;
  onSubmit: (data: RegisterRestaurantFormValues) => Promise<void>;
};

const STEPS = [
  {
    title: "Business basics",
  },
  {
    title: "About your business",
  },
  {
    title: "Location & logo",
  },
] as const;

const inputBase = "brand-input h-11 bg-white py-2";
const textareaBase = "brand-input min-h-[100px] bg-white py-3 leading-relaxed";

function fieldRing(hasError: boolean) {
  return hasError ? "brand-input-error" : "";
}

function optionalUrlRule(value: string) {
  const t = value.trim();
  if (t.length === 0) return true;
  try {
    new URL(t.includes("://") ? t : `https://${t}`);
    return true;
  } catch {
    return "Enter a valid website (e.g. https://example.com).";
  }
}

const MAX_LOGO_BYTES = 10 * 1024 * 1024;
const ACCEPT_IMAGES = "image/png,image/jpeg,image/webp";

function isImageMime(mime: string): boolean {
  return mime === "image/png" || mime === "image/jpeg" || mime === "image/webp";
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
          <div className="relative aspect-[16/10] max-h-56 w-full bg-zinc-100/80 shadow-inner">
            <img
              src={imagePreviewUrl}
              alt="Business logo preview"
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
          aria-label="Upload business logo"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={onDrop}
          className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all ${
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
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
              isDragging
                ? "bg-black text-white"
                : "bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200"
            }`}
          >
            <ImagePlus
              className={`h-6 w-6 ${isDragging ? "text-white" : "text-zinc-600"}`}
              strokeWidth={1.5}
              aria-hidden
            />
          </span>
          <span className="max-w-[240px]">
            <span className="block text-sm font-semibold text-brand-navy">
              {isDragging ? "Drop image here" : "Upload business logo"}
            </span>
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
  const [step, setStep] = useState(0);
  const stepRef = useRef(step);
  stepRef.current = step;

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoFileError, setLogoFileError] = useState<string | undefined>();
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSummary, setLocationSummary] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterRestaurantFormValues>({
    defaultValues: {
      name: "",
      phoneNumber: "",
      email: "",
      description: "",
      websiteUrl: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      branchCount: 1,
    },
    shouldUnregister: false,
  });

  const businessNameValue = watch("name");
  const slugPreview = useMemo(
    () => slugifyBusinessName(businessNameValue),
    [businessNameValue],
  );

  const currentStep = STEPS[step] ?? STEPS[STEPS.length - 1];
  const progress = ((step + 1) / STEPS.length) * 100;
  const isLastStep = step >= STEPS.length - 1;

  const goBack = () => {
    setStep((value) => Math.max(0, value - 1));
  };

  const advanceStep = async () => {
    const currentStepIndex = stepRef.current;

    if (currentStepIndex === 0) {
      const ok = await trigger(["name", "phoneNumber"]);
      if (ok) setStep(1);
      return;
    }

    if (currentStepIndex < STEPS.length - 1) {
      setStep(currentStepIndex + 1);
    }
  };

  const finish = handleSubmit(async (data) => {
    setLogoFileError(undefined);

    await onSubmit({
      ...data,
      branchCount: 1,
      logoFile,
    });
  });

  const onFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const currentStepIndex = stepRef.current;

    if (currentStepIndex < STEPS.length - 1) {
      void advanceStep();
      return;
    }

    void finish();
  };

  const handleUseCurrentLocation = async () => {
    setLocationError(null);
    setLocationLoading(true);

    try {
      const address = await resolveAddressFromBrowserLocation();
      setValue("city", address.city, { shouldDirty: true });
      setValue("state", address.state, { shouldDirty: true });
      setValue("postalCode", address.postalCode, { shouldDirty: true });
      setValue("country", address.country, { shouldDirty: true });

      const summary = [address.city, address.state, address.country]
        .filter(Boolean)
        .join(", ");
      setLocationSummary(
        summary.length > 0
          ? summary
          : "Location detected — review the fields below.",
      );
      setLocationCoords({
        latitude: address.latitude,
        longitude: address.longitude,
      });
    } catch (error) {
      setLocationSummary(null);
      setLocationCoords(null);
      setLocationError(
        error instanceof Error
          ? error.message
          : "Could not get your location. Try again or enter manually.",
      );
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <div className="brand-auth-card-wide p-6 sm:p-8 lg:p-10">
      <div className="mb-8 flex flex-col gap-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Step {step + 1} of {STEPS.length}
        </p>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-zinc-100"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Step ${step + 1} of ${STEPS.length}`}
        >
          <div
            className="h-full rounded-full bg-brand-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-navy sm:text-xl">
            {currentStep.title}
          </h2>
        </div>
      </div>

      <form className="flex flex-col gap-8 font-sans" onSubmit={onFormSubmit} noValidate>
        {step === 0 ? (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="restaurant-name"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
              >
                <Building2 className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                Business name <RequiredStar />
              </label>
              <input
                id="restaurant-name"
                type="text"
                autoComplete="organization"
                disabled={submitting}
                placeholder="Enter business name"
                aria-invalid={!!errors.name}
                className={`${inputBase} py-2 ${fieldRing(!!errors.name)}`}
                {...register("name", { required: "Business name is required." })}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="restaurant-slug"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
              >
                <Link2 className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                Business slug
              </label>
              <input
                id="restaurant-slug"
                type="text"
                readOnly
                tabIndex={-1}
                disabled={submitting}
                value={slugPreview}
                placeholder="Auto-generated"
                className={`${inputBase} cursor-default bg-zinc-50 py-2 text-zinc-600`}
                aria-readonly="true"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="restaurant-phone"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
              >
                <Phone className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                Contact number <RequiredStar />
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
          </section>
        ) : null}

        {step === 1 ? (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="restaurant-email"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
              >
                <Mail className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                Email address
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

            <div className="flex flex-col gap-1.5">
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
                placeholder="Enter description"
                aria-invalid={!!errors.description}
                className={`${textareaBase} w-full ${fieldRing(!!errors.description)}`}
                {...register("description")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="restaurant-website"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
              >
                <Globe className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                Website
              </label>
              <input
                id="restaurant-website"
                type="text"
                inputMode="url"
                disabled={submitting}
                placeholder="Enter website"
                aria-invalid={!!errors.websiteUrl}
                className={`${inputBase} py-2 ${fieldRing(!!errors.websiteUrl)}`}
                {...register("websiteUrl", { validate: optionalUrlRule })}
              />
              {errors.websiteUrl && (
                <p className="text-sm text-red-600">{errors.websiteUrl.message}</p>
              )}
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
                <MapPin className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                Location
              </h3>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={submitting || locationLoading}
                  onClick={() => void handleUseCurrentLocation()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {locationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <LocateFixed className="h-4 w-4" aria-hidden />
                  )}
                  {locationLoading ? "Detecting location…" : "Use my current location"}
                </button>
                {locationSummary ? (
                  <p className="text-sm font-medium text-emerald-700" role="status">
                    Detected: {locationSummary}
                  </p>
                ) : null}
                {locationCoords ? (
                  <BusinessLocationMap
                    latitude={locationCoords.latitude}
                    longitude={locationCoords.longitude}
                    label={locationSummary ?? undefined}
                  />
                ) : null}
                {locationError ? (
                  <p className="text-sm text-red-600" role="alert">
                    {locationError}
                  </p>
                ) : null}
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <label
                    htmlFor="city"
                    className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
                  >
                    <Landmark className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    disabled={submitting}
                    placeholder="Enter city"
                    className={`${inputBase} min-w-0 py-2`}
                    {...register("city")}
                  />
                </div>

                <div className="flex min-w-0 flex-col gap-1.5">
                  <label
                    htmlFor="state"
                    className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
                  >
                    <MapPinned className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                    State / region
                  </label>
                  <input
                    id="state"
                    type="text"
                    disabled={submitting}
                    placeholder="Enter state or region"
                    className={`${inputBase} min-w-0 py-2`}
                    {...register("state")}
                  />
                </div>

                <div className="flex min-w-0 flex-col gap-1.5">
                  <label
                    htmlFor="postal"
                    className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
                  >
                    <Hash className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                    Postal / zip
                  </label>
                  <input
                    id="postal"
                    type="text"
                    autoComplete="postal-code"
                    disabled={submitting}
                    placeholder="Enter postal code"
                    className={`${inputBase} min-w-0 py-2`}
                    {...register("postalCode")}
                  />
                </div>

                <div className="flex min-w-0 flex-col gap-1.5">
                  <label
                    htmlFor="country"
                    className="flex items-center gap-1.5 text-sm font-medium text-zinc-700"
                  >
                    <Flag className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                    Country
                  </label>
                  <input
                    id="country"
                    type="text"
                    autoComplete="country-name"
                    disabled={submitting}
                    placeholder="Enter country"
                    className={`${inputBase} min-w-0 py-2`}
                    {...register("country")}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
                <ImagePlus className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                Logo
              </h3>
              <RestaurantLogoDropField
                id="restaurant-logo-file"
                disabled={submitting}
                file={logoFile}
                error={logoFileError}
                onFile={setLogoFile}
              />
            </div>
          </section>
        ) : null}

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

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <button
              type="button"
              disabled={submitting}
              onClick={goBack}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back
            </button>
          ) : (
            <span className="hidden sm:block" aria-hidden />
          )}

          {isLastStep ? (
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              aria-label={submitting ? "Adding business" : "Add business"}
              className="brand-btn-primary relative inline-flex h-11 min-h-11 w-full px-6 sm:w-auto sm:min-w-[180px]"
            >
              <span
                className={`inline-flex items-center justify-center gap-2 ${
                  submitting ? "invisible" : ""
                }`}
                aria-hidden={submitting}
              >
                <span>Add business</span>
                <Store className="h-5 w-5 opacity-90" strokeWidth={2} aria-hidden />
              </span>
              {submitting ? (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <Loader2
                    className="h-5 w-5 animate-spin text-white"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                </span>
              ) : null}
            </button>
          ) : (
            <button
              type="submit"
              className="brand-btn-primary inline-flex h-11 w-full items-center justify-center gap-2 px-6 sm:w-auto sm:min-w-[160px]"
            >
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
