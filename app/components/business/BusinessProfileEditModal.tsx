"use client";

import {
  BookMeetingPhoneInput,
  isValidPhoneNumber,
} from "@/app/components/book-meeting/BookMeetingPhoneInput";
import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import {
  locationFieldMessage,
  validateBusinessLocation,
} from "@/app/lib/business-location";
import {
  BUSINESS_CURRENCY_OPTIONS,
  BUSINESS_TYPE_OPTIONS,
} from "@/app/lib/business-type-currency";
import {
  buildBusinessAddressQuery,
  geocodeBusinessAddress,
  reverseGeocodeBusinessAddress,
  searchBusinessLocations,
  type BusinessLocationSearchResult,
} from "@/app/lib/geocode-business-address";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import {
  isValidOptionalHttpsWebsiteUrl,
  optionalHttpsWebsiteUrlMessage,
  withAutomaticHttps,
} from "@/app/lib/website-url";
import { businessQueryKeys } from "@/app/services/business/business-query-keys";
import { updateBusiness } from "@/app/services/business/update-business";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Building2,
  Camera,
  ExternalLink,
  Loader2,
  MapPin,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

const RegisterBusinessLocationMap = dynamic(
  () =>
    import("@/app/components/register-business/RegisterBusinessLocationMap").then(
      (mod) => mod.RegisterBusinessLocationMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-xl border border-[#E8EDF5] bg-[#F8FAFC] text-sm text-slate-500">
        Loading map…
      </div>
    ),
  },
);

type FormSnapshot = {
  name: string;
  description: string;
  phoneNumber: string;
  email: string;
  websiteUrl: string;
  businessType: string;
  currency: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  branchCount: string;
};

const MAX_LOGO_BYTES = 10 * 1024 * 1024;
const ACCEPT_IMAGES = "image/png,image/jpeg,image/webp";
const DESC_MAX = 500;

const inputClass =
  "h-11 w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 text-sm font-medium text-[#07111f] outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-[#cbd5e1] focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/15";

const labelClass =
  "m-0 w-full shrink-0 pt-2.5 text-sm font-semibold text-[#07111f] sm:w-[9.5rem]";

function isImageMime(mime: string): boolean {
  return mime === "image/png" || mime === "image/jpeg" || mime === "image/webp";
}

function snapshotFromBusiness(business: {
  name?: string | null;
  description?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  businessType?: string | null;
  currency?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  branchCount?: number | null;
}): FormSnapshot {
  return {
    name: business.name?.trim() ?? "",
    description: business.description?.trim() ?? "",
    phoneNumber: business.phoneNumber?.trim() ?? "",
    email: business.email?.trim() ?? "",
    websiteUrl: business.websiteUrl?.trim() ?? "",
    businessType: business.businessType?.trim() ?? "",
    currency: business.currency?.trim().toUpperCase() ?? "",
    city: business.city?.trim() ?? "",
    state: business.state?.trim() ?? "",
    country: business.country?.trim() ?? "",
    postalCode: business.postalCode?.trim() ?? "",
    branchCount: String(business.branchCount ?? 1),
  };
}

function SectionCard({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-4">
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-4">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <div className="min-w-0 flex-1">
        {children}
        {hint && !error ? (
          <p className="m-0 mt-1 text-xs text-slate-400">{hint}</p>
        ) : null}
        {error ? (
          <p className="m-0 mt-1 text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function BusinessProfileEditModal({
  open,
  businessId,
  onClose,
}: {
  open: boolean;
  businessId: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: business, isPending } = useBusinessByIdQuery(businessId);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<FormSnapshot>({
    name: "",
    description: "",
    phoneNumber: "",
    email: "",
    websiteUrl: "",
    businessType: "",
    currency: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    branchCount: "1",
  });
  const [baseline, setBaseline] = useState<FormSnapshot | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [mapPin, setMapPin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapGeocoding, setMapGeocoding] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState<
    BusinessLocationSearchResult[]
  >([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const locationSearchRef = useRef<HTMLDivElement>(null);
  const mapPinManualRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !business) return;
    const next = snapshotFromBusiness(business);
    setForm(next);
    setBaseline(next);
    setLogoFile(null);
    setLogoError(null);
    setFormError(null);
    mapPinManualRef.current = false;
    setMapPin(null);
    setLocationSearch("");
    setLocationResults([]);
    setLocationSearchOpen(false);
  }, [open, business]);

  useEffect(() => {
    if (!open) return;
    if (mapPinManualRef.current) return;

    const query = buildBusinessAddressQuery({
      city: form.city,
      state: form.state,
      postalCode: form.postalCode,
      country: form.country,
    });

    if (!query) {
      setMapPin(null);
      setMapGeocoding(false);
      return;
    }

    let cancelled = false;
    setMapGeocoding(true);
    const timer = window.setTimeout(() => {
      void geocodeBusinessAddress(query)
        .then((coords) => {
          if (cancelled || mapPinManualRef.current) return;
          setMapPin(coords);
        })
        .finally(() => {
          if (!cancelled) setMapGeocoding(false);
        });
    }, 700);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, form.city, form.state, form.postalCode, form.country]);

  const handleMapDropPin = useCallback(
    (latitude: number, longitude: number) => {
      mapPinManualRef.current = true;
      setMapPin({ latitude, longitude });
      void reverseGeocodeBusinessAddress(latitude, longitude).then((place) => {
        if (!place) return;
        setForm((prev) => ({
          ...prev,
          city: place.city || prev.city,
          state: place.state || prev.state,
          postalCode: place.postalCode || prev.postalCode,
          country: place.country || prev.country,
        }));
      });
    },
    [],
  );

  const applyLocationResult = useCallback(
    (result: BusinessLocationSearchResult) => {
      mapPinManualRef.current = true;
      setMapPin({ latitude: result.latitude, longitude: result.longitude });
      setForm((prev) => ({
        ...prev,
        city: result.city || prev.city,
        state: result.state || prev.state,
        postalCode: result.postalCode || prev.postalCode,
        country: result.country || prev.country,
      }));
      setLocationSearch(result.label);
      setLocationResults([]);
      setLocationSearchOpen(false);
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const query = locationSearch.trim();
    if (query.length < 2) {
      setLocationResults([]);
      setLocationSearching(false);
      return;
    }

    let cancelled = false;
    setLocationSearching(true);
    const timer = window.setTimeout(() => {
      void searchBusinessLocations(query)
        .then((results) => {
          if (cancelled) return;
          setLocationResults(results);
        })
        .finally(() => {
          if (!cancelled) setLocationSearching(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, locationSearch]);

  useEffect(() => {
    if (!open || !locationSearchOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!locationSearchRef.current?.contains(event.target as Node)) {
        setLocationSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, locationSearchOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, saving]);

  const logoSrc = resolveUploadImageUrl(business?.logoUrl ?? null);
  const filePreviewUrl = useMemo(() => {
    if (!logoFile || !isImageMime(logoFile.type)) return null;
    return URL.createObjectURL(logoFile);
  }, [logoFile]);

  useEffect(() => {
    if (!filePreviewUrl) return;
    return () => URL.revokeObjectURL(filePreviewUrl);
  }, [filePreviewUrl]);

  const displayLogo = filePreviewUrl ?? logoSrc;
  const websiteHref = form.websiteUrl.trim();

  const patchForm = useCallback((patch: Partial<FormSnapshot>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const hasChanges = useMemo(() => {
    if (!baseline) return false;
    if (logoFile) return true;
    return (Object.keys(baseline) as (keyof FormSnapshot)[]).some(
      (key) => form[key] !== baseline[key],
    );
  }, [baseline, form, logoFile]);

  const getSaveBlockReason = useCallback((): string | null => {
    if (!form.name.trim()) return "Please enter a business name.";
    if (!form.businessType.trim()) return "Please select a business type.";
    if (!form.currency.trim()) return "Please select a currency.";
    if (!form.phoneNumber.trim() || !isValidPhoneNumber(form.phoneNumber)) {
      return "Please enter a valid phone number.";
    }
    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      return "Please enter a valid email address.";
    }
    const websiteError = optionalHttpsWebsiteUrlMessage(
      withAutomaticHttps(form.websiteUrl),
    );
    if (websiteError) return websiteError;
    const locationError = validateBusinessLocation({
      city: form.city,
      state: form.state,
      postalCode: form.postalCode,
      country: form.country,
    });
    if (locationError) return locationError;
    const branches = Number.parseInt(form.branchCount, 10);
    if (!Number.isFinite(branches) || branches < 1) {
      return "Please enter at least 1 branch.";
    }
    if (!hasChanges) return "No changes to save.";
    return null;
  }, [form, hasChanges]);

  const onLogoPick = (file: File | null, inputEl: HTMLInputElement | null) => {
    setLogoError(null);
    if (!file) {
      setLogoFile(null);
      return;
    }
    if (!ACCEPT_IMAGES.split(",").includes(file.type)) {
      setLogoError("Use PNG, JPG, or WEBP only.");
      if (inputEl) inputEl.value = "";
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("File must be 10MB or smaller.");
      if (inputEl) inputEl.value = "";
      return;
    }
    setLogoFile(file);
  };

  const handleCancel = () => {
    if (hasChanges && !window.confirm("Discard unsaved changes?")) return;
    onClose();
  };

  const handleSave = async () => {
    if (saving || isPending) return;

    const block = getSaveBlockReason();
    if (block) {
      setFormError(block);
      toast.error(block);
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await updateBusiness(businessId, {
        name: form.name.trim(),
        description: form.description.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || undefined,
        websiteUrl: withAutomaticHttps(form.websiteUrl).trim() || undefined,
        businessType: form.businessType.trim() || undefined,
        currency: form.currency.trim().toUpperCase() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        country: form.country.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
        branchCount: Number.parseInt(form.branchCount, 10),
        logoFile,
      });
      await queryClient.invalidateQueries({
        queryKey: businessQueryKeys.detail(businessId),
      });
      await queryClient.invalidateQueries({
        queryKey: businessQueryKeys.myLists(),
      });
      toast.success("Business profile updated.");
      onClose();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Could not update business profile.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#07111f]/45 p-4 backdrop-blur-[2px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-profile-edit-title"
    >
      <div className="flex max-h-[min(92vh,840px)] w-full max-w-[820px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_28px_80px_rgba(14,24,43,0.28)] ring-1 ring-black/5">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#eef2f7] px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-[0_8px_18px_rgba(24,119,242,0.25)]">
              <Building2 className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2
                id="business-profile-edit-title"
                className="m-0 text-lg font-extrabold tracking-tight text-[#07111f]"
              >
                Edit Business
              </h2>
              <p className="m-0 mt-1 text-sm text-slate-500">
                Update your business information
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e2e8f0] text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
            aria-label="Close"
          >
            <X className="size-4" strokeWidth={2.25} />
          </button>
        </header>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {isPending ? (
            <div className="flex h-48 items-center justify-center text-slate-400">
              <Loader2 className="size-7 animate-spin" aria-hidden />
            </div>
          ) : (
            <div className="flex flex-col gap-5">
                <SectionCard id="edit-profile-details">
                  <div className="space-y-5">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-4">
                      <p className={labelClass}>Business logo</p>
                      <div className="min-w-0 flex-1">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept={ACCEPT_IMAGES}
                          className="hidden"
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            onLogoPick(e.target.files?.[0] ?? null, e.target);
                          }}
                        />
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="relative size-[5.5rem] shrink-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/30"
                            aria-label="Upload business logo"
                          >
                            <span
                              className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full ring-4 ring-[#dbeafe] shadow-[0_8px_22px_rgba(15,23,42,0.08)] ${
                                displayLogo ? "bg-[#f1f5f9]" : "bg-white"
                              }`}
                            >
                              {displayLogo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={displayLogo}
                                  alt=""
                                  className="size-full object-contain object-center p-1.5"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center bg-white text-slate-400">
                                  <Camera
                                    className="size-7"
                                    strokeWidth={1.75}
                                    aria-hidden
                                  />
                                </span>
                              )}
                            </span>
                            <span className="absolute -bottom-0.5 -right-0.5 flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#1877f2] text-white shadow-md">
                              <Camera className="size-3.5" strokeWidth={2.25} />
                            </span>
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="m-0 text-sm font-semibold text-[#07111f]">
                              Upload a square logo
                            </p>
                            <p className="m-0 mt-1 text-xs leading-relaxed text-slate-500">
                              PNG, JPG, or WebP · ideally 512×512
                            </p>
                            <button
                              type="button"
                              onClick={() => logoInputRef.current?.click()}
                              className="mt-2.5 text-sm font-semibold text-[#1877f2] transition hover:text-[#166fe0]"
                            >
                              {displayLogo ? "Replace image" : "Upload image"}
                            </button>
                          </div>
                        </div>
                        {logoError ? (
                          <p className="m-0 mt-1 text-xs text-red-600">
                            {logoError}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <Field
                      label="Business name"
                      htmlFor="edit-business-name"
                      required
                    >
                      <input
                        id="edit-business-name"
                        className={inputClass}
                        value={form.name}
                        onChange={(e) => patchForm({ name: e.target.value })}
                        autoComplete="organization"
                        placeholder="Your business name"
                      />
                    </Field>

                    <div className="space-y-4">
                      <Field
                        label="Business type"
                        htmlFor="edit-business-type"
                        required
                      >
                        <select
                          id="edit-business-type"
                          className={`${inputClass} appearance-none bg-transparent`}
                          value={form.businessType}
                          aria-label="Business type"
                          onChange={(e) =>
                            patchForm({ businessType: e.target.value })
                          }
                        >
                          <option value="">Select business type</option>
                          {BUSINESS_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field
                        label="Currency"
                        htmlFor="edit-business-currency"
                        required
                      >
                        <select
                          id="edit-business-currency"
                          className={`${inputClass} appearance-none bg-transparent`}
                          value={form.currency}
                          aria-label="Currency"
                          onChange={(e) =>
                            patchForm({
                              currency: e.target.value.toUpperCase(),
                            })
                          }
                        >
                          <option value="">Select currency</option>
                          {BUSINESS_CURRENCY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard id="edit-profile-contact">
                  <div className="space-y-4">
                    <Field
                      label="Phone number"
                      htmlFor="edit-business-phone"
                      required
                    >
                      <div
                        className={`${inputClass} flex items-center !py-0 focus-within:border-[#1877f2] focus-within:ring-2 focus-within:ring-[#1877f2]/15`}
                      >
                        <BookMeetingPhoneInput
                          value={form.phoneNumber}
                          onChange={(value) =>
                            patchForm({ phoneNumber: value })
                          }
                          variant="boxed"
                          wrapClassName="!w-full !gap-2 [&_input]:!h-full [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!px-0 [&_input]:!py-0 [&_input]:!text-sm [&_input]:!font-medium [&_input]:!text-[#07111f] [&_input]:!outline-none [&_input]:!ring-0"
                        />
                      </div>
                    </Field>

                    <Field
                      label="Email address"
                      htmlFor="edit-business-email"
                      required
                    >
                      <input
                        id="edit-business-email"
                        type="email"
                        className={inputClass}
                        value={form.email}
                        onChange={(e) =>
                          patchForm({ email: e.target.value })
                        }
                        autoComplete="email"
                        placeholder="business@email.com"
                      />
                    </Field>

                    <Field
                      label="Website (optional)"
                      htmlFor="edit-business-website"
                      error={optionalHttpsWebsiteUrlMessage(
                        withAutomaticHttps(form.websiteUrl),
                      )}
                    >
                      <div className="relative">
                        <input
                          id="edit-business-website"
                          type="url"
                          className={`${inputClass}${
                            websiteHref &&
                            isValidOptionalHttpsWebsiteUrl(websiteHref)
                              ? " pr-10"
                              : ""
                          }`}
                          value={form.websiteUrl}
                          onChange={(e) =>
                            patchForm({
                              websiteUrl: withAutomaticHttps(e.target.value),
                            })
                          }
                          placeholder="https://yourbusiness.com"
                        />
                        {websiteHref &&
                        isValidOptionalHttpsWebsiteUrl(websiteHref) ? (
                          <a
                            href={websiteHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#1877f2] hover:bg-[#eff6ff]"
                            aria-label="Open website"
                          >
                            <ExternalLink
                              className="size-3.5"
                              strokeWidth={2.25}
                            />
                          </a>
                        ) : null}
                      </div>
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard id="edit-profile-address">
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <Field
                        label="City"
                        htmlFor="edit-business-address-city"
                        error={locationFieldMessage("city", form.city)}
                      >
                        <input
                          id="edit-business-address-city"
                          className={inputClass}
                          value={form.city}
                          onChange={(e) => {
                            mapPinManualRef.current = false;
                            patchForm({ city: e.target.value });
                          }}
                          placeholder="City"
                        />
                      </Field>
                      <Field
                        label="Country"
                        htmlFor="edit-business-address-country"
                        error={locationFieldMessage("country", form.country)}
                      >
                        <input
                          id="edit-business-address-country"
                          className={inputClass}
                          value={form.country}
                          onChange={(e) => {
                            mapPinManualRef.current = false;
                            patchForm({ country: e.target.value });
                          }}
                          placeholder="Country"
                        />
                      </Field>
                      <Field
                        label="State / province"
                        htmlFor="edit-business-state"
                        error={locationFieldMessage("state", form.state)}
                      >
                        <input
                          id="edit-business-state"
                          className={inputClass}
                          value={form.state}
                          onChange={(e) => {
                            mapPinManualRef.current = false;
                            patchForm({ state: e.target.value });
                          }}
                          placeholder="State or province"
                        />
                      </Field>
                      <Field
                        label="Postal code"
                        htmlFor="edit-business-postal"
                        error={locationFieldMessage("postalCode", form.postalCode)}
                      >
                        <input
                          id="edit-business-postal"
                          className={inputClass}
                          value={form.postalCode}
                          onChange={(e) => {
                            mapPinManualRef.current = false;
                            patchForm({ postalCode: e.target.value });
                          }}
                          placeholder="Postal / ZIP code"
                        />
                      </Field>
                    </div>

                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-4">
                      <p className={labelClass}>Location on map</p>
                      <div className="min-w-0 flex-1">
                      <p className="m-0 mb-2 text-xs leading-snug text-slate-500">
                        {mapGeocoding
                          ? "Finding this address on the map…"
                          : mapPin
                            ? "Pin shows the saved address. Search or click the map to move it."
                            : "Search for a place or enter an address above to place a pin."}
                      </p>

                      <div ref={locationSearchRef} className="relative mb-3">
                        <label className="sr-only" htmlFor="edit-business-location-search">
                          Search location
                        </label>
                        <span className="relative block">
                          <input
                            id="edit-business-location-search"
                            type="search"
                            className={inputClass}
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

                        {locationSearchOpen &&
                        locationSearch.trim().length >= 2 ? (
                          <div
                            className="absolute left-0 right-0 z-20 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-[#E8EDF5] bg-white py-1 shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                            role="listbox"
                          >
                            {locationSearching ? (
                              <p className="m-0 px-3 py-2.5 text-[0.78rem] text-slate-500">
                                Searching…
                              </p>
                            ) : locationResults.length === 0 ? (
                              <p className="m-0 px-3 py-2.5 text-[0.78rem] text-slate-500">
                                No matching locations. Try another search.
                              </p>
                            ) : (
                              locationResults.map((result) => (
                                <button
                                  key={result.id}
                                  type="button"
                                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-[0.8rem] font-medium text-slate-800 transition hover:bg-[#F8FBFF]"
                                  onClick={() => applyLocationResult(result)}
                                >
                                  <MapPin
                                    className="mt-0.5 size-4 shrink-0 text-[#1877F2]"
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

                      <RegisterBusinessLocationMap
                        latitude={mapPin?.latitude ?? null}
                        longitude={mapPin?.longitude ?? null}
                        dropPinMode
                        onDropPin={handleMapDropPin}
                      />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard id="edit-profile-about">
                  <Field
                    label="Business description"
                    htmlFor="edit-business-about-description"
                    hint="Tell customers what you offer and what makes you different."
                  >
                    <div className="relative">
                      <textarea
                        id="edit-business-about-description"
                        rows={5}
                        maxLength={DESC_MAX}
                        className={`${inputClass} h-auto min-h-[8rem] resize-none py-3 leading-relaxed`}
                        value={form.description}
                        onChange={(e) =>
                          patchForm({ description: e.target.value })
                        }
                        placeholder="What makes your business stand out?"
                      />
                      <span className="pointer-events-none absolute bottom-2.5 right-3 text-[0.68rem] font-semibold tabular-nums text-slate-400">
                        {form.description.length}/{DESC_MAX}
                      </span>
                    </div>
                  </Field>
                </SectionCard>

                {formError ? (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                ) : null}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#eef2f7] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || isPending}
            className="inline-flex h-10 min-w-[8.5rem] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#1877f2] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {modal}
    </>,
    document.body,
  );
}
