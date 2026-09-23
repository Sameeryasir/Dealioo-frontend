"use client";

import {
  BookMeetingPhoneInput,
  isValidPhoneNumber,
} from "@/app/components/book-meeting/BookMeetingPhoneInput";
import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import {
  REGISTER_BUSINESS_STEPS,
  REGISTER_BUSINESS_STEP_UI,
  type RegisterBusinessStepId,
} from "@/app/components/register-business/register-business-ui";
import "@/app/components/register-business/register-business-responsive.css";
import logoStyles from "@/app/components/register-business/RegisterBusinessForm.module.css";
import { easeOut } from "@/app/components/landing/landing-motion";
import { validateBusinessLocation } from "@/app/lib/business-location";
import {
  BUSINESS_CURRENCY_OPTIONS,
  BUSINESS_TYPE_OPTIONS,
} from "@/app/lib/business-type-currency";
import { isValidOptionalHttpsWebsiteUrl } from "@/app/lib/website-url";
import { compressImageForUpload } from "@/app/lib/compress-image-file";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import {
  getBusinessOnboardingDraft,
  saveBusinessOnboardingDraft,
  uploadBusinessDraftLogo,
} from "@/app/services/onboarding/business-draft";
import { BusinessOptionSelect } from "@/app/components/business/BusinessOptionSelect";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  Check,
  Globe,
  ImagePlus,
  Loader2,
  Mail,
  Map,
  MapPin,
  PenLine,
  Search,
  Shield,
  Sparkles,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";

const RegisterBusinessLocationMap = dynamic(
  () =>
    import("@/app/components/register-business/RegisterBusinessLocationMap").then(
      (mod) => mod.RegisterBusinessLocationMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-xl border border-[#e8edf5] bg-[#f8fafc] text-sm text-slate-500">
        Loading map…
      </div>
    ),
  },
);

async function geocodeBusinessAddress(query: string): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", trimmed);
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const results = (await response.json()) as Array<{ lat: string; lon: string }>;
    const first = results[0];
    if (!first) return null;
    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}

function readBrowserPosition(
  timeoutMs = 10000,
): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location is not supported in this browser."));
      return;
    }

    const timer = window.setTimeout(() => {
      reject(new Error("Timed out while getting your location."));
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timer);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        window.clearTimeout(timer);
        reject(new Error("Could not read your current location."));
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  region?: string;
  postcode?: string;
  country?: string;
};

type LocationSearchResult = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function addressFromNominatim(address?: NominatimAddress) {
  return {
    city:
      address?.city?.trim() ||
      address?.town?.trim() ||
      address?.village?.trim() ||
      address?.municipality?.trim() ||
      "",
    state: address?.state?.trim() || address?.region?.trim() || "",
    postalCode: address?.postcode?.trim() || "",
    country: address?.country?.trim() || "",
  };
}

async function reverseGeocodeBusinessAddress(
  latitude: number,
  longitude: number,
): Promise<{
  city: string;
  state: string;
  postalCode: string;
  country: string;
} | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { address?: NominatimAddress };
    if (!payload.address) return null;
    return addressFromNominatim(payload.address);
  } catch {
    return null;
  }
}

async function searchBusinessLocations(
  query: string,
): Promise<LocationSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "6");
    url.searchParams.set("q", trimmed);
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];
    const results = (await response.json()) as Array<{
      place_id: number | string;
      display_name: string;
      lat: string;
      lon: string;
      address?: NominatimAddress;
    }>;
    return results
      .map((row) => {
        const latitude = Number(row.lat);
        const longitude = Number(row.lon);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return null;
        }
        const parts = addressFromNominatim(row.address);
        return {
          id: String(row.place_id),
          label: row.display_name,
          latitude,
          longitude,
          ...parts,
        };
      })
      .filter((row): row is LocationSearchResult => row != null);
  } catch {
    return [];
  }
}

export type RegisterBusinessFormValues = {
  name: string;
  phoneNumber: string;
  email: string;
  description: string;
  websiteUrl: string;
  businessType: string;
  currency: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  branchCount: number;
  logoFile?: File | null;
  logoUrl?: string | null;
};

export type RegisterBusinessFormProps = {
  submitting: boolean;
  errorMessage: string | null;
  onCreateBusiness: (data: RegisterBusinessFormValues) => Promise<void>;
};

const DEFAULT_VALUES: RegisterBusinessFormValues = {
  name: "",
  phoneNumber: "",
  email: "",
  description: "",
  websiteUrl: "",
  businessType: "",
  currency: "USD",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  branchCount: 1,
  logoFile: null,
  logoUrl: null,
};

const MAX_LOGO_BYTES = 10 * 1024 * 1024;
const ACCEPT_IMAGES = "image/png,image/jpeg,image/webp";
const DRAFT_DEBOUNCE_MS = 700;
const ABOUT_DESC_MAX = 500;

function isImageMime(mime: string): boolean {
  return mime === "image/png" || mime === "image/jpeg" || mime === "image/webp";
}

function isValidEmail(value: string, required = false): boolean {
  const trimmed = value.trim();
  if (!trimmed) return !required;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function isValidOptionalUrl(value: string): boolean {
  return isValidOptionalHttpsWebsiteUrl(value);
}

type LogoDropProps = {
  id: string;
  disabled: boolean;
  file: File | null;
  previewUrl?: string | null;
  uploading?: boolean;
  error?: string;
  onFile: (file: File | null) => void;
  variant?: "default" | "row";
};

function BusinessLogoDropField({
  id,
  disabled,
  file,
  previewUrl = null,
  uploading = false,
  error,
  onFile,
  variant = "default",
}: LogoDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState(false);

  const localPreviewUrl = useMemo(() => {
    if (!file || !isImageMime(file.type)) return null;
    return URL.createObjectURL(file);
  }, [file]);

  const imagePreviewUrl =
    localPreviewUrl ?? (previewUrl ? resolveUploadImageUrl(previewUrl) : "");
  const previewName = file?.name?.trim() || "Business logo";

  useEffect(() => {
    if (!localPreviewUrl) return;
    return () => URL.revokeObjectURL(localPreviewUrl);
  }, [localPreviewUrl]);

  const validateAndSet = useCallback(
    (nextFile: File | null, inputEl: HTMLInputElement | null) => {
      setLocalError(undefined);
      if (!nextFile) {
        onFile(null);
        return;
      }
      if (!ACCEPT_IMAGES.split(",").includes(nextFile.type)) {
        setLocalError("Use PNG, JPG, or WEBP only.");
        if (inputEl) inputEl.value = "";
        return;
      }
      if (nextFile.size > MAX_LOGO_BYTES) {
        setLocalError("File must be 10MB or smaller.");
        if (inputEl) inputEl.value = "";
        return;
      }
      onFile(nextFile);
    },
    [onFile],
  );

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.target.files?.[0] ?? null;
      validateAndSet(nextFile, event.target);
    },
    [validateAndSet],
  );

  const handleDragOver = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      if (disabled) return;
      const nextFile = event.dataTransfer.files?.[0] ?? null;
      validateAndSet(nextFile, inputRef.current);
    },
    [disabled, validateAndSet],
  );

  const clearFile = useCallback(() => {
    setLocalError(undefined);
    if (inputRef.current) inputRef.current.value = "";
    onFile(null);
  }, [onFile]);

  const combinedError = error ?? localError;
  const isRow = variant === "row";

  return (
    <div
      className={`${logoStyles.logoSection}${isRow ? ` ${logoStyles.logoSectionCompact}` : ""}`}
    >
      <span className={logoStyles.logoSectionLabel}>
        Business logo
        {isRow ? (
          <span className={logoStyles.basicsOptional}>(optional)</span>
        ) : null}
      </span>
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

      {imagePreviewUrl ? (
        isRow ? (
          <div
            className={`${logoStyles.logoDropRowPreview}${
              disabled ? ` ${logoStyles.logoDropDisabled}` : ""
            }`}
          >
            <span className={logoStyles.logoDropRowThumb}>
              <img
                src={imagePreviewUrl}
                alt="Business logo preview"
                className={logoStyles.logoDropRowThumbImg}
              />
              <span className={logoStyles.logoDropRowBadge} aria-hidden>
                <Check className="size-3" strokeWidth={3} />
              </span>
            </span>
            <span className={logoStyles.logoDropRowCopy}>
              <span className={logoStyles.logoDropRowMeta}>
                <span className={logoStyles.logoDropTitle}>{previewName}</span>
                <span className={logoStyles.logoDropRowReady}>
                  {uploading ? "Saving…" : "Ready"}
                </span>
              </span>
              <span className={logoStyles.logoDropHint}>
                Looks great on your dashboard and funnels.
              </span>
            </span>
            {!disabled ? (
              <span className={logoStyles.logoDropRowActions}>
                <button
                  type="button"
                  className={logoStyles.logoDropRowActionBtn}
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="size-3.5" strokeWidth={2.5} aria-hidden />
                  Replace
                </button>
                <button
                  type="button"
                  className={`${logoStyles.logoDropRowActionBtn} ${logoStyles.logoDropRowActionBtnDanger}`}
                  onClick={clearFile}
                >
                  <Trash2 className="size-3.5" strokeWidth={2.25} aria-hidden />
                  Remove
                </button>
              </span>
            ) : null}
          </div>
        ) : (
          <div className={logoStyles.logoPreview}>
            <div className={logoStyles.logoPreviewImageWrap}>
              <img
                src={imagePreviewUrl}
                alt="Business logo preview"
                className={logoStyles.logoPreviewImage}
              />
            </div>
            {!disabled ? (
              <div className={logoStyles.logoPreviewActions}>
                <button
                  type="button"
                  className={logoStyles.logoActionBtn}
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden />
                  Replace
                </button>
                <button
                  type="button"
                  className={`${logoStyles.logoActionBtn} ${logoStyles.logoActionBtnDanger}`}
                  onClick={clearFile}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Remove
                </button>
              </div>
            ) : null}
          </div>
        )
      ) : (
        <label
          htmlFor={id}
          aria-label="Upload business logo"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={onDrop}
          className={`${logoStyles.logoDrop}${isRow ? ` ${logoStyles.logoDropRow}` : ""}${
            disabled ? ` ${logoStyles.logoDropDisabled}` : ""
          }${isDragging ? ` ${logoStyles.logoDropDragging}` : ""}${
            combinedError ? ` ${logoStyles.logoDropError}` : ""
          }`}
        >
          <span
            className={`${logoStyles.logoDropIcon}${isRow ? ` ${logoStyles.logoDropRowIcon}` : ""}`}
          >
            {isRow ? (
              <ImagePlus className="h-5 w-5" strokeWidth={2} aria-hidden />
            ) : (
              <ImagePlus className="h-5 w-5" strokeWidth={1.5} aria-hidden />
            )}
          </span>
          {isRow ? (
            <>
              <span className={logoStyles.logoDropRowCopy}>
                <span className={logoStyles.logoDropTitle}>
                  {isDragging ? "Drop image here" : "Upload your business logo"}
                </span>
                <span className={logoStyles.logoDropHint}>
                  PNG, JPG or WEBP. Max size 10MB.
                </span>
              </span>
              <span className={logoStyles.logoDropRowBtn}>
                <Upload className="size-3.5" strokeWidth={2.5} aria-hidden />
                Upload file
              </span>
            </>
          ) : (
            <>
              <span className={logoStyles.logoDropTitle}>
                {isDragging ? "Drop image here" : "Upload business logo"}
              </span>
              <span className={logoStyles.logoDropHint}>
                PNG, JPG, or WEBP up to 10MB
              </span>
            </>
          )}
        </label>
      )}

      {isRow ? (
        <p className={logoStyles.logoHelp}>
          A square image works best. This will be used across your dashboard and
          funnels.
        </p>
      ) : null}

      {combinedError ? (
        <p className={logoStyles.fieldError}>{combinedError}</p>
      ) : null}
    </div>
  );
}

export default function RegisterBusinessForm({
  submitting,
  errorMessage,
  onCreateBusiness,
}: RegisterBusinessFormProps) {
  const reduced = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<RegisterBusinessFormValues>(DEFAULT_VALUES);
  const [stepError, setStepError] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(true);
  const [draftSaveError, setDraftSaveError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [mapPin, setMapPin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState<LocationSearchResult[]>(
    [],
  );
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutosaveRef = useRef(true);
  const mapPinManualRef = useRef(false);
  const autoLocatedRef = useRef(false);
  const locationSearchRef = useRef<HTMLDivElement>(null);

  const currentStep = REGISTER_BUSINESS_STEPS[stepIndex];
  const stepUi = REGISTER_BUSINESS_STEP_UI[currentStep.id as RegisterBusinessStepId];
  const progress = ((stepIndex + 1) / REGISTER_BUSINESS_STEPS.length) * 100;
  const isLocationStep = currentStep.id === "location";

  useEffect(() => {
    if (!isLocationStep) return;
    if (autoLocatedRef.current) return;

    let cancelled = false;

    void (async () => {
      try {
        const position = await readBrowserPosition();
        if (cancelled) return;
        autoLocatedRef.current = true;
        mapPinManualRef.current = true;
        setMapPin(position);

        const place = await reverseGeocodeBusinessAddress(
          position.latitude,
          position.longitude,
        );
        if (cancelled || !place) return;

        setValues((prev) => ({
          ...prev,
          city: prev.city.trim() || place.city,
          state: prev.state.trim() || place.state,
          postalCode: prev.postalCode.trim() || place.postalCode,
          country: prev.country.trim() || place.country,
        }));
      } catch {
        if (!cancelled) autoLocatedRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLocationStep]);

  useEffect(() => {
    if (!isLocationStep) return;
    if (mapPinManualRef.current) return;

    const query = [
      values.city,
      values.state,
      values.postalCode,
      values.country,
    ]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");

    if (!query) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void geocodeBusinessAddress(query).then((coords) => {
        if (cancelled || mapPinManualRef.current) return;
        setMapPin(coords);
      });
    }, 700);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    isLocationStep,
    values.city,
    values.country,
    values.postalCode,
    values.state,
  ]);

  useEffect(() => {
    if (!isLocationStep) return;
    const query = locationSearch.trim();
    if (query.length < 2) {
      setLocationResults([]);
      setLocationSearching(false);
      return;
    }

    let cancelled = false;
    setLocationSearching(true);
    const timer = window.setTimeout(() => {
      void searchBusinessLocations(query).then((results) => {
        if (cancelled) return;
        setLocationResults(results);
        setLocationSearching(false);
        setLocationSearchOpen(true);
      });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isLocationStep, locationSearch]);

  useEffect(() => {
    if (!isLocationStep) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!locationSearchRef.current?.contains(event.target as Node)) {
        setLocationSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isLocationStep]);

  const applyLocationResult = useCallback((result: LocationSearchResult) => {
    mapPinManualRef.current = true;
    setMapPin({ latitude: result.latitude, longitude: result.longitude });
    setValues((prev) => ({
      ...prev,
      city: result.city || prev.city,
      state: result.state || prev.state,
      postalCode: result.postalCode || prev.postalCode,
      country: result.country || prev.country,
    }));
    setLocationSearch(result.label);
    setLocationResults([]);
    setLocationSearchOpen(false);
    setStepError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const draft = await getBusinessOnboardingDraft();
        if (cancelled || !draft) return;
        const payload = draft.payload ?? {};
        setValues((prev) => ({
          ...prev,
          name: payload.name ?? prev.name,
          phoneNumber: payload.phoneNumber ?? prev.phoneNumber,
          email: payload.email ?? prev.email,
          description: payload.description ?? prev.description,
          websiteUrl: payload.websiteUrl ?? prev.websiteUrl,
          businessType: payload.businessType ?? prev.businessType,
          currency: payload.currency ?? prev.currency,
          city: payload.city ?? prev.city,
          state: payload.state ?? prev.state,
          postalCode: payload.postalCode ?? prev.postalCode,
          country: payload.country ?? prev.country,
          branchCount: payload.branchCount ?? prev.branchCount,
          logoUrl: draft.logoUrl ?? prev.logoUrl,
        }));
        const stepId = draft.step;
        const idx = REGISTER_BUSINESS_STEPS.findIndex((s) => s.id === stepId);
        if (idx >= 0) setStepIndex(idx);
      } catch {
      } finally {
        if (!cancelled) {
          skipNextAutosaveRef.current = false;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draftReady || skipNextAutosaveRef.current) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);

    draftTimerRef.current = setTimeout(() => {
      void saveBusinessOnboardingDraft({
        step: currentStep.id,
        payload: {
          name: values.name,
          phoneNumber: values.phoneNumber,
          email: values.email,
          description: values.description,
          websiteUrl: values.websiteUrl,
          businessType: values.businessType,
          currency: values.currency,
          city: values.city,
          state: values.state,
          postalCode: values.postalCode,
          country: values.country,
          branchCount: values.branchCount,
        },
      })
        .then(() => setDraftSaveError(null))
        .catch(() =>
          setDraftSaveError(
            "Draft could not be saved. Your answers stay on this screen — try again or continue.",
          ),
        );
    }, DRAFT_DEBOUNCE_MS);

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [currentStep.id, draftReady, values]);

  const patchValues = useCallback((patch: Partial<RegisterBusinessFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleLogoFile = useCallback(async (logoFile: File | null) => {
    if (!logoFile) {
      patchValues({ logoFile: null, logoUrl: null });
      void saveBusinessOnboardingDraft({ logoUrl: null })
        .then(() => setDraftSaveError(null))
        .catch(() =>
          setDraftSaveError("Could not remove the saved logo. Try again."),
        );
      return;
    }

    patchValues({ logoFile });
    setLogoUploading(true);
    try {
      const compressed = await compressImageForUpload(logoFile);
      const draft = await uploadBusinessDraftLogo(compressed);
      patchValues({ logoUrl: draft.logoUrl });
      setDraftSaveError(null);
    } catch {
      patchValues({ logoUrl: null });
      setDraftSaveError(
        "Could not save the logo. It will be lost if you leave this page.",
      );
    } finally {
      setLogoUploading(false);
    }
  }, [patchValues]);

  const validateStep = useCallback(
    (snapshot: RegisterBusinessFormValues = values): string | null => {
      switch (currentStep.id) {
        case "basics":
          if (!snapshot.name.trim()) return "Please enter your business name.";
          if (!snapshot.phoneNumber.trim() || !isValidPhoneNumber(snapshot.phoneNumber)) {
            return "Please enter a valid phone number.";
          }
          if (!snapshot.businessType.trim()) {
            return "Please select a business type.";
          }
          if (!snapshot.currency.trim()) {
            return "Please select a currency.";
          }
          return null;
        case "about":
          if (!snapshot.email.trim()) return "Please enter your email address.";
          if (!isValidEmail(snapshot.email, true)) {
            return "Please enter a valid email address.";
          }
          if (!snapshot.description.trim()) {
            return "Please enter a short description of your business.";
          }
          if (!isValidOptionalUrl(snapshot.websiteUrl)) {
            return "Enter a full website URL starting with https:// (e.g. https://example.com).";
          }
          return null;
        case "location":
          return validateBusinessLocation({
            city: snapshot.city,
            state: snapshot.state,
            postalCode: snapshot.postalCode,
            country: snapshot.country,
          });
        default:
          return null;
      }
    },
    [currentStep.id, values],
  );

  const goNext = useCallback(() => {
    if (isLocationStep) return;

    const validationError = validateStep();
    if (validationError) {
      setStepError(validationError);
      return;
    }
    setStepError(null);
    setStepIndex((index) => index + 1);
  }, [isLocationStep, validateStep]);

  const goBack = useCallback(() => {
    setStepError(null);
    setStepIndex((index) => Math.max(0, index - 1));
  }, []);

  const handleCreateBusiness = useCallback(async () => {
    const validationError = validateStep();
    if (validationError) {
      setStepError(validationError);
      return;
    }
    setStepError(null);
    await onCreateBusiness({
      ...values,
      branchCount: 1,
      logoFile: values.logoFile ?? null,
      logoUrl: values.logoUrl ?? null,
    });
  }, [onCreateBusiness, validateStep, values]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey) return;
      if (isLocationStep) return;
      if (currentStep.id === "about" && event.target instanceof HTMLTextAreaElement) {
        return;
      }
      event.preventDefault();
      void goNext();
    },
    [currentStep.id, goNext, isLocationStep],
  );

  return (
    <div
      className={`landing-page ${bookStyles.shell}`}
      data-register-business-page
      onKeyDown={handleKeyDown}
    >
      <Navbar />

      <div className={bookStyles.pageContent}>
        <div className={bookStyles.pageContentGrain} aria-hidden />
        <main id="register-business-form" className={bookStyles.main}>
          <div
            className={`${bookStyles.formZone}${
              currentStep.id === "basics" ||
              currentStep.id === "about" ||
              currentStep.id === "location"
                ? ` ${logoStyles.basicsZone}`
                : ""
            }`}
          >
            <div className={bookStyles.progressMeta}>
              <span className={bookStyles.progressLabel}>
                Step {stepIndex + 1} of {REGISTER_BUSINESS_STEPS.length}
              </span>
              <span className={bookStyles.progressPct}>
                {Math.round(progress)}% Complete
              </span>
            </div>

            {draftSaveError ? (
              <p className={bookStyles.hint} role="status">
                {draftSaveError}
              </p>
            ) : null}

            <div className={bookStyles.progressTrack} aria-hidden>
              <motion.div
                className={bookStyles.progressFill}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: easeOut }}
              />
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentStep.id}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: easeOut }}
              >
              {currentStep.id === "location" ? (
                <div className={logoStyles.locationSheet}>
                  <div className={logoStyles.locationForm}>
                    <div className={logoStyles.locationHeader}>
                      <div className={logoStyles.locationHeaderCopy}>
                        <span className={logoStyles.basicsBadge} aria-hidden>
                          {currentStep.number}
                        </span>
                        <h2 className={logoStyles.basicsTitle}>
                          {stepUi.lead}
                          <span className={logoStyles.basicsAccent}>
                            {stepUi.accent}
                          </span>
                        </h2>
                        <p className={logoStyles.basicsSubtitle}>
                          {stepUi.subtitle}
                        </p>
                      </div>
                    </div>

                    <div
                      ref={locationSearchRef}
                      className={logoStyles.locationSearch}
                    >
                      <span className={logoStyles.basicsLabel}>
                        Search location
                      </span>
                      <span className={logoStyles.basicsInputWrap}>
                        <Search
                          className={`${logoStyles.basicsInputIcon} size-4`}
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <input
                          type="text"
                          autoFocus
                          className={logoStyles.basicsInput}
                          placeholder="Search city, address, or place"
                          value={locationSearch}
                          onChange={(event) => {
                            setLocationSearch(event.target.value);
                            setLocationSearchOpen(true);
                          }}
                          onFocus={() => {
                            if (locationResults.length > 0) {
                              setLocationSearchOpen(true);
                            }
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && locationResults[0]) {
                              event.preventDefault();
                              applyLocationResult(locationResults[0]);
                            }
                          }}
                          autoComplete="off"
                        />
                      </span>

                      {locationSearchOpen && locationSearch.trim().length >= 2 ? (
                        <div className={logoStyles.locationSearchMenu} role="listbox">
                          {locationSearching ? (
                            <p className={logoStyles.locationSearchStatus}>
                              Searching…
                            </p>
                          ) : locationResults.length === 0 ? (
                            <p className={logoStyles.locationSearchStatus}>
                              No matching locations. Try another search.
                            </p>
                          ) : (
                            locationResults.map((result) => (
                              <button
                                key={result.id}
                                type="button"
                                className={logoStyles.locationSearchOption}
                                onClick={() => applyLocationResult(result)}
                              >
                                <MapPin
                                  className="size-4 shrink-0 text-[#1877F2]"
                                  strokeWidth={2.25}
                                  aria-hidden
                                />
                                <span>{result.label}</span>
                              </button>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>

                    <div className={logoStyles.locationMap}>
                      <RegisterBusinessLocationMap
                        latitude={mapPin?.latitude ?? null}
                        longitude={mapPin?.longitude ?? null}
                        dropPinMode
                        onDropPin={(latitude, longitude) => {
                          mapPinManualRef.current = true;
                          setMapPin({ latitude, longitude });
                          void reverseGeocodeBusinessAddress(
                            latitude,
                            longitude,
                          ).then((place) => {
                            if (!place) return;
                            setValues((prev) => ({
                              ...prev,
                              city: prev.city.trim() || place.city,
                              state: prev.state.trim() || place.state,
                              postalCode:
                                prev.postalCode.trim() || place.postalCode,
                              country: prev.country.trim() || place.country,
                            }));
                            setLocationSearch(
                              [place.city, place.state, place.country]
                                .filter(Boolean)
                                .join(", "),
                            );
                          });
                        }}
                      />
                    </div>

                    <div className={logoStyles.locationGrid}>
                      <label>
                        <span className={logoStyles.basicsLabel}>
                          City
                          <span className={logoStyles.basicsRequired}>*</span>
                        </span>
                        <span className={logoStyles.basicsInputWrap}>
                          <Building2
                            className={`${logoStyles.basicsInputIcon} size-4`}
                            strokeWidth={2.25}
                            aria-hidden
                          />
                          <input
                            type="text"
                            className={logoStyles.basicsInput}
                            placeholder="Enter city"
                            value={values.city}
                            onChange={(event) => {
                              mapPinManualRef.current = false;
                              patchValues({ city: event.target.value });
                              setStepError(null);
                            }}
                            autoComplete="address-level2"
                          />
                        </span>
                      </label>

                      <label>
                        <span className={logoStyles.basicsLabel}>
                          State / region
                          <span className={logoStyles.basicsRequired}>*</span>
                        </span>
                        <span className={logoStyles.basicsInputWrap}>
                          <Map
                            className={`${logoStyles.basicsInputIcon} size-4`}
                            strokeWidth={2.25}
                            aria-hidden
                          />
                          <input
                            type="text"
                            className={logoStyles.basicsInput}
                            placeholder="Enter state or region"
                            value={values.state}
                            onChange={(event) => {
                              mapPinManualRef.current = false;
                              patchValues({ state: event.target.value });
                              setStepError(null);
                            }}
                            autoComplete="address-level1"
                          />
                        </span>
                      </label>

                      <label>
                        <span className={logoStyles.basicsLabel}>
                          Postal / ZIP
                          <span className={logoStyles.basicsRequired}>*</span>
                        </span>
                        <span className={logoStyles.basicsInputWrap}>
                          <Mail
                            className={`${logoStyles.basicsInputIcon} size-4`}
                            strokeWidth={2.25}
                            aria-hidden
                          />
                          <input
                            type="text"
                            autoComplete="postal-code"
                            className={logoStyles.basicsInput}
                            placeholder="Enter postal code"
                            value={values.postalCode}
                            onChange={(event) => {
                              mapPinManualRef.current = false;
                              patchValues({ postalCode: event.target.value });
                              setStepError(null);
                            }}
                          />
                        </span>
                      </label>

                      <label>
                        <span className={logoStyles.basicsLabel}>
                          Country
                          <span className={logoStyles.basicsRequired}>*</span>
                        </span>
                        <span className={logoStyles.basicsInputWrap}>
                          <Globe
                            className={`${logoStyles.basicsInputIcon} size-4`}
                            strokeWidth={2.25}
                            aria-hidden
                          />
                          <input
                            type="text"
                            autoComplete="country-name"
                            className={logoStyles.basicsInput}
                            placeholder="Enter country"
                            value={values.country}
                            onChange={(event) => {
                              mapPinManualRef.current = false;
                              patchValues({ country: event.target.value });
                              setStepError(null);
                            }}
                          />
                        </span>
                      </label>
                    </div>

                    <BusinessLogoDropField
                      id="business-logo-file"
                      variant="row"
                      file={values.logoFile ?? null}
                      previewUrl={values.logoUrl ?? null}
                      uploading={logoUploading}
                      disabled={submitting || logoUploading}
                      onFile={(logoFile) => {
                        void handleLogoFile(logoFile);
                      }}
                    />

                    {(stepError || errorMessage) && (
                      <div className={logoStyles.basicsError} role="alert">
                        <AlertCircle className="size-4 shrink-0" aria-hidden />
                        <span>{stepError ?? errorMessage}</span>
                      </div>
                    )}

                    <div className={logoStyles.basicsActions}>
                      <button
                        type="button"
                        className={logoStyles.basicsBack}
                        onClick={goBack}
                        disabled={submitting}
                      >
                        <ArrowLeft className="size-4" strokeWidth={2.5} aria-hidden />
                        Back
                      </button>
                      <button
                        type="button"
                        className={logoStyles.basicsNext}
                        onClick={() => void handleCreateBusiness()}
                        disabled={submitting || logoUploading}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                            Creating business…
                          </>
                        ) : (
                          <>
                            Create business
                            <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`${logoStyles.basicsSheet}${
                    currentStep.id === "about" ? ` ${logoStyles.basicsSheetAbout}` : ""
                  }`}
                >
                  <div className={logoStyles.basicsForm}>
                    <span className={logoStyles.basicsBadge} aria-hidden>
                      {currentStep.number}
                    </span>
                    <h2 className={logoStyles.basicsTitle}>
                      {stepUi.lead}
                      <span className={logoStyles.basicsAccent}>{stepUi.accent}</span>
                    </h2>
                    <p className={logoStyles.basicsSubtitle}>
                      {currentStep.id === "about" ? (
                        <Sparkles
                          className={`${logoStyles.basicsSubtitleIcon} size-3.5`}
                          strokeWidth={2.25}
                          aria-hidden
                        />
                      ) : null}
                      {stepUi.subtitle}
                    </p>

                    {currentStep.id === "basics" ? (
                      <>
                        <div className={logoStyles.basicsFields}>
                          <label>
                            <span className={logoStyles.basicsLabel}>
                              Business name
                              <span className={logoStyles.basicsRequired}>*</span>
                            </span>
                            <span className={logoStyles.basicsInputWrap}>
                              <Building2
                                className={`${logoStyles.basicsInputIcon} size-4`}
                                strokeWidth={2.25}
                                aria-hidden
                              />
                              <input
                                type="text"
                                autoComplete="organization"
                                autoFocus
                                className={logoStyles.basicsInput}
                                placeholder="Enter your business name"
                                value={values.name}
                                onChange={(event) => {
                                  patchValues({ name: event.target.value });
                                  setStepError(null);
                                }}
                              />
                            </span>
                          </label>

                          <label>
                            <span className={logoStyles.basicsLabel}>
                              Contact number
                              <span className={logoStyles.basicsRequired}>*</span>
                            </span>
                            <div className={logoStyles.basicsPhoneWrap}>
                              <BookMeetingPhoneInput
                                value={values.phoneNumber}
                                onChange={(phone) => {
                                  patchValues({ phoneNumber: phone });
                                  setStepError(null);
                                }}
                              />
                            </div>
                          </label>

                          <label>
                            <span className={logoStyles.basicsLabel}>
                              Business type
                              <span className={logoStyles.basicsRequired}>*</span>
                            </span>
                            <span className={logoStyles.basicsInputWrap}>
                              <Tag
                                className={`${logoStyles.basicsInputIcon} size-4`}
                                strokeWidth={2.25}
                                aria-hidden
                              />
                              <BusinessOptionSelect
                                value={values.businessType}
                                options={[...BUSINESS_TYPE_OPTIONS]}
                                placeholder="Select business type"
                                ariaLabel="Business type"
                                triggerClassName={`${logoStyles.basicsInput} ${logoStyles.basicsSelectTrigger}`}
                                onChange={(nextValue) => {
                                  patchValues({ businessType: nextValue });
                                  setStepError(null);
                                }}
                              />
                            </span>
                          </label>

                          <label>
                            <span className={logoStyles.basicsLabel}>
                              Currency
                              <span className={logoStyles.basicsRequired}>*</span>
                            </span>
                            <span className={logoStyles.basicsInputWrap}>
                              <Banknote
                                className={`${logoStyles.basicsInputIcon} size-4`}
                                strokeWidth={2.25}
                                aria-hidden
                              />
                              <BusinessOptionSelect
                                value={values.currency}
                                options={[...BUSINESS_CURRENCY_OPTIONS]}
                                placeholder="Select currency"
                                ariaLabel="Currency"
                                triggerClassName={`${logoStyles.basicsInput} ${logoStyles.basicsSelectTrigger}`}
                                onChange={(nextValue) => {
                                  patchValues({
                                    currency: nextValue.toUpperCase(),
                                  });
                                  setStepError(null);
                                }}
                              />
                            </span>
                          </label>
                        </div>

                        <div className={logoStyles.basicsSafe}>
                          <span className={logoStyles.basicsSafeIcon} aria-hidden>
                            <Shield className="size-4" strokeWidth={2.25} />
                          </span>
                          <div>
                            <p className={logoStyles.basicsSafeTitle}>
                              Your information is safe with us
                            </p>
                            <p className={logoStyles.basicsSafeText}>
                              We use industry-standard security to keep your data
                              protected.
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className={logoStyles.basicsFields}>
                        <label>
                          <span className={logoStyles.basicsLabel}>
                            Email address
                            <span className={logoStyles.basicsRequired}>*</span>
                          </span>
                          <span className={logoStyles.basicsInputWrap}>
                            <Mail
                              className={`${logoStyles.basicsInputIcon} size-4`}
                              strokeWidth={2.25}
                              aria-hidden
                            />
                            <input
                              type="email"
                              autoComplete="email"
                              autoFocus
                              required
                              className={logoStyles.basicsInput}
                              placeholder="you@business.com"
                              value={values.email}
                              onChange={(event) => {
                                patchValues({ email: event.target.value });
                                setStepError(null);
                              }}
                            />
                          </span>
                        </label>

                        <label>
                          <span className={logoStyles.basicsLabel}>
                            Description
                            <span className={logoStyles.basicsRequired}>*</span>
                          </span>
                          <div className={logoStyles.basicsTextareaWrap}>
                            <PenLine
                              className={`${logoStyles.basicsTextareaIcon} size-4`}
                              strokeWidth={2.25}
                              aria-hidden
                            />
                            <textarea
                              rows={4}
                              maxLength={ABOUT_DESC_MAX}
                              required
                              className={logoStyles.basicsTextarea}
                              placeholder="Tell customers what you do"
                              value={values.description}
                              onChange={(event) => {
                                patchValues({ description: event.target.value });
                                setStepError(null);
                              }}
                            />
                            <span className={logoStyles.basicsCharCount}>
                              {values.description.length}/{ABOUT_DESC_MAX}
                            </span>
                          </div>
                        </label>

                        <label>
                          <span className={logoStyles.basicsLabel}>
                            Website
                            <span className={logoStyles.basicsOptional}>
                              (optional)
                            </span>
                          </span>
                          <span className={logoStyles.basicsInputWrap}>
                            <Globe
                              className={`${logoStyles.basicsInputIcon} size-4`}
                              strokeWidth={2.25}
                              aria-hidden
                            />
                            <input
                              type="text"
                              inputMode="url"
                              className={logoStyles.basicsInput}
                              placeholder="https://yourwebsite.com"
                              value={values.websiteUrl}
                              onChange={(event) => {
                                patchValues({ websiteUrl: event.target.value });
                                setStepError(null);
                              }}
                            />
                          </span>
                        </label>
                      </div>
                    )}

                    {(stepError || errorMessage) && (
                      <div className={logoStyles.basicsError} role="alert">
                        <AlertCircle className="size-4 shrink-0" aria-hidden />
                        <span>{stepError ?? errorMessage}</span>
                      </div>
                    )}

                    {currentStep.id === "about" ? (
                      <div className={logoStyles.basicsActions}>
                        <button
                          type="button"
                          className={logoStyles.basicsBack}
                          onClick={goBack}
                          disabled={submitting}
                        >
                          <ArrowLeft className="size-4" strokeWidth={2.5} aria-hidden />
                          Back
                        </button>
                        <button
                          type="button"
                          className={logoStyles.basicsNext}
                          onClick={() => goNext()}
                          disabled={submitting}
                        >
                          Next
                          <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={logoStyles.basicsNext}
                        onClick={() => goNext()}
                        disabled={submitting}
                      >
                        Next
                        <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
                      </button>
                    )}
                  </div>
                </div>
              )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
