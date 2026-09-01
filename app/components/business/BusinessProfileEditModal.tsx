"use client";

import {
  BookMeetingPhoneInput,
  isValidPhoneNumber,
} from "@/app/components/book-meeting/BookMeetingPhoneInput";
import { ChooseNumberDialog } from "@/app/components/business/ChooseNumberDialog";
import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import {
  locationFieldMessage,
  validateBusinessLocation,
} from "@/app/lib/business-location";
import {
  buildBusinessAddressQuery,
  geocodeBusinessAddress,
  reverseGeocodeBusinessAddress,
} from "@/app/lib/geocode-business-address";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import {
  isValidOptionalHttpsWebsiteUrl,
  optionalHttpsWebsiteUrlMessage,
} from "@/app/lib/website-url";
import { businessQueryKeys } from "@/app/services/business/business-query-keys";
import { updateBusiness } from "@/app/services/business/update-business";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Building2,
  Camera,
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  Globe,
  Lightbulb,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Store,
  Tag,
  X,
  type LucideIcon,
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
  city: string;
  state: string;
  country: string;
  postalCode: string;
  branchCount: string;
};

type NavId =
  | "details"
  | "contact"
  | "address"
  | "about";

// Same icon palette as BusinessGeneralSettingsForm (profile page).
const ICON = {
  blue: { wrap: "bg-[#E8F1FF]", ink: "text-[#2F6BFF]" },
  green: { wrap: "bg-[#E8F8EF]", ink: "text-[#22C55E]" },
  pink: { wrap: "bg-[#FDE8F0]", ink: "text-[#E11D48]" },
  orange: { wrap: "bg-[#FFF1E6]", ink: "text-[#F97316]" },
  yellow: { wrap: "bg-[#FFF8E8]", ink: "text-[#FCB825]" },
  purple: { wrap: "bg-[#F3E8FF]", ink: "text-[#8B5CF6]" },
  slate: { wrap: "bg-[#F1F5F9]", ink: "text-[#64748B]" },
} as const;

type IconTone = keyof typeof ICON;

const NAV: {
  id: NavId;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: IconTone;
}[] = [
  {
    id: "details",
    label: "Business details",
    hint: "Basic information",
    icon: Building2,
    tone: "blue",
  },
  {
    id: "contact",
    label: "Contact information",
    hint: "How customers reach you",
    icon: Phone,
    tone: "green",
  },
  {
    id: "address",
    label: "Business address",
    hint: "Physical location",
    icon: MapPin,
    tone: "orange",
  },
  {
    id: "about",
    label: "About your business",
    hint: "Description & story",
    icon: FileText,
    tone: "slate",
  },
];

const MAX_LOGO_BYTES = 10 * 1024 * 1024;
const ACCEPT_IMAGES = "image/png,image/jpeg,image/webp";
const DESC_MAX = 500;

const inputClass =
  "h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[#93C5FD] focus:ring-4 focus:ring-[#DBEAFE]";

const labelClass = "m-0 mb-1.5 block text-[0.78rem] font-bold text-slate-700";

function formatTitleCase(value: string): string {
  return value
    .trim()
    .split(/[\s/_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function isImageMime(mime: string): boolean {
  return mime === "image/png" || mime === "image/jpeg" || mime === "image/webp";
}

function snapshotFromBusiness(business: {
  name?: string | null;
  description?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
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
    city: business.city?.trim() ?? "",
    state: business.state?.trim() ?? "",
    country: business.country?.trim() ?? "",
    postalCode: business.postalCode?.trim() ?? "",
    branchCount: String(business.branchCount ?? 1),
  };
}

function SectionCard({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-4 rounded-2xl border border-[#E8EDF5] bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] sm:p-6"
    >
      <h3 className="m-0 mb-4 text-[1.05rem] font-extrabold tracking-tight text-[#0F172A]">
        {title}
      </h3>
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
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="m-0 mt-1 text-[0.7rem] text-slate-400">{hint}</p>
      ) : null}
      {error ? (
        <p className="m-0 mt-1 text-[0.7rem] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CompletionRing({ percent }: { percent: number }) {
  const size = 88;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = c - (clamped / 100) * c;

  return (
    <div className="relative mx-auto size-[5.5rem]">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#E8EDF5"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#2F6BFF"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold tabular-nums text-[#0F172A]">
          {clamped}%
        </span>
      </div>
    </div>
  );
}

function TipsCityscape() {
  return (
    <svg
      viewBox="0 0 240 64"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full opacity-70"
      fill="none"
      aria-hidden
    >
      <path d="M8 64V36l12-7 8 5v30H8Z" fill="#BFDBFE" />
      <path d="M36 64V28l14-8 12 7v37H36Z" fill="#93C5FD" />
      <path d="M70 64V22l18-11 16 9v44H70Z" fill="#60A5FA" opacity="0.55" />
      <path d="M112 64V34l12-7 10 6v31h-22Z" fill="#A7F3D0" opacity="0.65" />
      <path d="M140 64V26l16-9 14 8v39h-30Z" fill="#93C5FD" opacity="0.8" />
      <path d="M178 64V40l10-6 8 5v25h-18Z" fill="#BFDBFE" />
      <path d="M204 64V32l14-8 12 7v33h-26Z" fill="#60A5FA" opacity="0.45" />
    </svg>
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
  const [activeNav, setActiveNav] = useState<NavId>("details");
  const [form, setForm] = useState<FormSnapshot>({
    name: "",
    description: "",
    phoneNumber: "",
    email: "",
    websiteUrl: "",
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
  const [twilioDialogOpen, setTwilioDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
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
    setActiveNav("details");
    mapPinManualRef.current = false;
    setMapPin(null);
    setTwilioDialogOpen(false);
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
  const shortLabel =
    formatTitleCase(form.name.trim()).split(/\s+/)[0] || "Biz";
  const twilioNumber = business?.twilioPhoneNumber?.trim() || "";
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

  const completion = useMemo(() => {
    const checks = [
      {
        id: "details" as const,
        label: "Business details",
        done: Boolean(form.name.trim()),
      },
      {
        id: "contact" as const,
        label: "Contact information",
        done: Boolean(
          form.phoneNumber.trim() &&
            isValidPhoneNumber(form.phoneNumber) &&
            form.email.trim(),
        ),
      },
      {
        id: "address" as const,
        label: "Business address",
        done: Boolean(
          form.city.trim() &&
            form.state.trim() &&
            form.postalCode.trim() &&
            form.country.trim(),
        ),
      },
      {
        id: "about" as const,
        label: "About your business",
        done: Boolean(form.description.trim()),
      },
    ];
    const doneCount = checks.filter((c) => c.done).length;
    const percent = Math.round((doneCount / checks.length) * 100);
    return { checks, percent };
  }, [form]);

  const canSave = useMemo(() => {
    if (!form.name.trim()) return false;
    if (!form.phoneNumber.trim() || !isValidPhoneNumber(form.phoneNumber)) {
      return false;
    }
    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      return false;
    }
    if (!isValidOptionalHttpsWebsiteUrl(form.websiteUrl)) return false;
    if (
      validateBusinessLocation({
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
      })
    ) {
      return false;
    }
    const branches = Number.parseInt(form.branchCount, 10);
    if (!Number.isFinite(branches) || branches < 1) return false;
    return hasChanges;
  }, [form, hasChanges]);

  const scrollToSection = (id: NavId) => {
    setActiveNav(id);
    const el = document.getElementById(`edit-profile-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
    if (!canSave || saving) return;

    const websiteError = optionalHttpsWebsiteUrlMessage(form.websiteUrl);
    if (websiteError) {
      setFormError(websiteError);
      toast.error(websiteError);
      return;
    }

    const locationError = validateBusinessLocation({
      city: form.city,
      state: form.state,
      postalCode: form.postalCode,
      country: form.country,
    });
    if (locationError) {
      setFormError(locationError);
      toast.error(locationError);
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
        websiteUrl: form.websiteUrl.trim() || undefined,
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
      className="fixed inset-0 z-[90] flex items-stretch justify-center bg-[#0F172A]/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-profile-edit-title"
    >
      <div className="flex h-full w-full max-w-[72rem] flex-col overflow-hidden bg-[#F4F7FB] shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:h-[min(92dvh,56rem)] sm:rounded-2xl sm:ring-1 sm:ring-black/5">
        {/* --- Top bar --- */}
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-[#E8EDF5] bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="business-profile-edit-title"
              className="m-0 text-[1.35rem] font-extrabold tracking-tight text-[#0F172A] sm:text-[1.5rem]"
            >
              Business profile
            </h2>
            <p className="m-0 mt-1 text-sm text-slate-500">
              Edit and update your business information
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#2F6BFF] transition hover:bg-[#F8FAFC] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!canSave || saving || isPending}
              className="inline-flex h-10 min-w-[8.5rem] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#2F6BFF] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(47,107,255,0.28)] transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
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
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition hover:bg-[#F1F5F9] hover:text-slate-600 sm:hidden"
              aria-label="Close"
            >
              <X className="size-5" strokeWidth={2.25} />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[15.5rem_minmax(0,1fr)_15.5rem]">
          {/* --- Left nav --- */}
          <aside className="hidden min-h-0 flex-col border-r border-[#E8EDF5] bg-white lg:flex">
            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                const tone = ICON[item.tone];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${
                      active
                        ? "bg-[#EFF6FF] text-[#1D4ED8] ring-1 ring-[#BFDBFE]"
                        : "text-slate-700 hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone.wrap} ${tone.ink}`}
                    >
                      <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.8rem] font-bold leading-tight">
                        {item.label}
                      </span>
                      <span
                        className={`mt-0.5 block text-[0.68rem] font-medium ${
                          active ? "text-[#3B82F6]" : "text-slate-400"
                        }`}
                      >
                        {item.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* --- Main form --- */}
          <div
            ref={scrollRef}
            className="min-h-0 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5"
          >
            {isPending ? (
              <div className="flex h-48 items-center justify-center text-slate-400">
                <Loader2 className="size-7 animate-spin" aria-hidden />
              </div>
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col gap-4">
                <SectionCard id="edit-profile-details" title="Business details">
                  <div className="space-y-4">
                    <div>
                      <p className={labelClass}>Business logo</p>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept={ACCEPT_IMAGES}
                        className="hidden"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          onLogoPick(e.target.files?.[0] ?? null, e.target);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="relative size-[5.5rem] cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#DBEAFE]"
                        aria-label="Upload business logo"
                      >
                        <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl ring-1 ring-[#C7D7FF] shadow-[0_10px_24px_rgba(47,107,255,0.2)]">
                          {displayLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={displayLogo}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span
                              className="flex h-full w-full flex-col items-center justify-center gap-1 text-white"
                              style={{
                                background:
                                  "linear-gradient(145deg, #3B82F6 0%, #6366F1 48%, #A855F7 100%)",
                              }}
                            >
                              <Store
                                className="size-7"
                                strokeWidth={1.75}
                                aria-hidden
                              />
                              <span className="max-w-[90%] truncate text-[0.7rem] font-bold">
                                {shortLabel}
                              </span>
                            </span>
                          )}
                        </span>
                        <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-[2.5px] border-white bg-[#2F6BFF] text-white shadow-md">
                          <Camera className="size-3.5" strokeWidth={2.25} />
                        </span>
                      </button>
                      {logoError ? (
                        <p className="m-0 mt-1 text-[0.7rem] text-red-600">
                          {logoError}
                        </p>
                      ) : null}
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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field
                        label="Industry"
                        htmlFor="edit-business-country"
                        error={locationFieldMessage("country", form.country)}
                      >
                        <div className="relative">
                          <Building2
                            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8B5CF6]"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                          <input
                            id="edit-business-country"
                            className={`${inputClass} pl-10 pr-9`}
                            value={form.country}
                            onChange={(e) =>
                              patchForm({ country: e.target.value })
                            }
                            placeholder="e.g. Digital Marketing"
                          />
                          <ChevronDown
                            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-300"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                        </div>
                      </Field>
                      <Field
                        label="Business category"
                        htmlFor="edit-business-city"
                        error={locationFieldMessage("city", form.city)}
                      >
                        <div className="relative">
                          <Tag
                            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8B5CF6]"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                          <input
                            id="edit-business-city"
                            className={`${inputClass} pl-10 pr-9`}
                            value={form.city}
                            onChange={(e) =>
                              patchForm({ city: e.target.value })
                            }
                            placeholder="e.g. Marketing Agency"
                          />
                          <ChevronDown
                            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-300"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                        </div>
                      </Field>
                    </div>

                    <Field
                      label="Business description"
                      htmlFor="edit-business-description"
                    >
                      <div className="relative">
                        <textarea
                          id="edit-business-description"
                          rows={4}
                          maxLength={DESC_MAX}
                          className={`${inputClass} h-auto min-h-[7rem] resize-none py-3 leading-relaxed`}
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
                  </div>
                </SectionCard>

                <SectionCard
                  id="edit-profile-contact"
                  title="Contact information"
                >
                  <div className="space-y-4">
                    <Field
                      label="Phone number"
                      htmlFor="edit-business-phone"
                      required
                    >
                      <div className="rounded-xl border border-[#E5E7EB] bg-white px-2 py-1 focus-within:border-[#93C5FD] focus-within:ring-4 focus-within:ring-[#DBEAFE]">
                        <BookMeetingPhoneInput
                          value={form.phoneNumber}
                          onChange={(value) =>
                            patchForm({ phoneNumber: value })
                          }
                          wrapClassName="!gap-1 [&_input]:!text-sm [&_input]:!font-medium"
                        />
                      </div>
                    </Field>

                    <Field
                      label="Twilio number (optional)"
                      htmlFor="edit-business-twilio"
                    >
                      <div className="relative">
                        <MessageSquare
                          className="pointer-events-none absolute left-3 top-1/2 z-[1] size-4 -translate-y-1/2 text-[#8B5CF6]"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <button
                          id="edit-business-twilio"
                          type="button"
                          onClick={() => setTwilioDialogOpen(true)}
                          disabled={saving}
                          className={`${inputClass} flex cursor-pointer items-center gap-2 pl-10 pr-3 text-left disabled:cursor-not-allowed disabled:opacity-60`}
                          aria-label={
                            twilioNumber
                              ? `Change Twilio number (${twilioNumber})`
                              : "Choose a Twilio number"
                          }
                        >
                          <span
                            className={`min-w-0 flex-1 truncate ${
                              twilioNumber
                                ? "font-medium text-slate-900"
                                : "font-normal text-slate-400"
                            }`}
                          >
                            {twilioNumber || "Choose a Twilio number"}
                          </span>
                          <ChevronDown
                            className="size-4 shrink-0 text-slate-400"
                            strokeWidth={2.25}
                            aria-hidden
                          />
                        </button>
                      </div>
                      <p className="m-0 mt-1.5 text-[0.7rem] text-slate-500">
                        Pick the SMS number this business will send from.
                      </p>
                    </Field>

                    <Field
                      label="Email address"
                      htmlFor="edit-business-email"
                      required
                    >
                      <div className="relative">
                        <Mail
                          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8B5CF6]"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <input
                          id="edit-business-email"
                          type="email"
                          className={`${inputClass} pl-10`}
                          value={form.email}
                          onChange={(e) =>
                            patchForm({ email: e.target.value })
                          }
                          autoComplete="email"
                          placeholder="business@email.com"
                        />
                      </div>
                    </Field>

                    <Field
                      label="Website (optional)"
                      htmlFor="edit-business-website"
                      error={optionalHttpsWebsiteUrlMessage(form.websiteUrl)}
                    >
                      <div className="relative">
                        <Globe
                          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8B5CF6]"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <input
                          id="edit-business-website"
                          type="url"
                          className={`${inputClass} pl-10 pr-10`}
                          value={form.websiteUrl}
                          onChange={(e) =>
                            patchForm({ websiteUrl: e.target.value })
                          }
                          placeholder="https://yourbusiness.com"
                        />
                        {websiteHref &&
                        isValidOptionalHttpsWebsiteUrl(websiteHref) ? (
                          <a
                            href={websiteHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#2F6BFF] hover:bg-[#EFF6FF]"
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

                <SectionCard id="edit-profile-address" title="Business address">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                    <div>
                      <p className={labelClass}>Location on map</p>
                      <p className="m-0 mb-2 text-[0.72rem] leading-snug text-slate-500">
                        {mapGeocoding
                          ? "Finding this address on the map…"
                          : mapPin
                            ? "Pin shows the saved address. Click the map to move it."
                            : "Enter an address above to place a pin on the map."}
                      </p>
                      <RegisterBusinessLocationMap
                        latitude={mapPin?.latitude ?? null}
                        longitude={mapPin?.longitude ?? null}
                        dropPinMode
                        onDropPin={handleMapDropPin}
                      />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  id="edit-profile-about"
                  title="About your business"
                >
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

          {/* --- Right rail --- */}
          <aside className="hidden min-h-0 flex-col gap-3 overflow-y-auto border-l border-[#E8EDF5] bg-[#F8FAFC] p-3 lg:flex">
            <section className="rounded-2xl border border-[#E8EDF5] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
              <CompletionRing percent={completion.percent} />
              <p className="m-0 mt-2 text-center text-sm font-bold text-[#0F172A]">
                {completion.percent >= 100
                  ? "All set!"
                  : completion.percent >= 70
                    ? "Almost done!"
                    : "Keep going"}
              </p>
              <ul className="m-0 mt-4 list-none space-y-2 p-0">
                {completion.checks.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    {item.done ? (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="size-5 shrink-0 rounded-full border border-dashed border-slate-300" />
                    )}
                    <span
                      className={`text-[0.78rem] font-semibold ${
                        item.done ? "text-slate-700" : "text-slate-400"
                      }`}
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="relative overflow-hidden rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 pb-14 pt-4">
              <div className="relative z-[1] flex items-start gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#F59E0B] ring-1 ring-[#FDE68A]">
                  <Lightbulb className="size-4" strokeWidth={2.25} />
                </span>
                <p className="m-0 text-[0.78rem] font-medium leading-relaxed text-[#1E3A8A]">
                  Keep your business information up to date so customers and
                  teammates always see the right details.
                </p>
              </div>
              <TipsCityscape />
            </section>
          </aside>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {modal}
      <ChooseNumberDialog
        open={twilioDialogOpen}
        businessId={businessId}
        overlayClassName="z-[100]"
        title="Choose a Twilio number"
        description="Pick the SMS number this business will send from."
        confirmLabel="Save number"
        confirmingLabel="Saving number…"
        onClose={() => setTwilioDialogOpen(false)}
        onConfirmed={async (selected) => {
          setTwilioDialogOpen(false);
          toast.success(`Twilio number set to ${selected.phoneNumber}.`);
          await queryClient.invalidateQueries({
            queryKey: businessQueryKeys.detail(businessId),
          });
          await queryClient.invalidateQueries({
            queryKey: businessQueryKeys.myLists(),
          });
        }}
      />
    </>,
    document.body,
  );
}
