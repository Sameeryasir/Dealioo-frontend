"use client";

import {
  BookMeetingPhoneInput,
  isValidPhoneNumber,
} from "@/app/components/book-meeting/BookMeetingPhoneInput";
import { BusinessIntegrationsPanel } from "@/app/components/business/BusinessIntegrationsPanel";
import { BusinessMembersPanel } from "@/app/components/business/BusinessMembersPanel";
import { Skeleton } from "@/app/components/skeleton";
import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import {
  locationFieldMessage,
  validateBusinessLocation,
} from "@/app/lib/business-location";
import { businessSettingsHref } from "@/app/lib/business-settings-routes";
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
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  FileText,
  GitBranch,
  Globe,
  Link2,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  ScanLine,
  Tag,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";

export type BusinessProfilePreviewSection =
  | "general"
  | "members"
  | "integrations";

type BusinessGeneralSettingsFormProps = {
  businessId: number;
  activeSection?: BusinessProfilePreviewSection;
};

const PREVIEW_TITLES: Record<
  BusinessProfilePreviewSection,
  { title: string; subtitle: string }
> = {
  general: {
    title: "Business profile",
    subtitle: "Manage your business information and settings",
  },
  members: {
    title: "Members",
    subtitle: "Invite teammates and manage access for this business",
  },
  integrations: {
    title: "Integrations",
    subtitle: "Connect Stripe, Meta, and Google Ads for this business",
  },
};

const ICON = {
  blue: { wrap: "bg-[#E8F1FF]", ink: "text-[#2F6BFF]" },
  green: { wrap: "bg-[#E8F8EF]", ink: "text-[#22C55E]" },
  pink: { wrap: "bg-[#FDE8F0]", ink: "text-[#E11D48]" },
  orange: { wrap: "bg-[#FFF1E6]", ink: "text-[#F97316]" },
  purple: { wrap: "bg-[#F3E8FF]", ink: "text-[#8B5CF6]" },
  slate: { wrap: "bg-[#F1F5F9]", ink: "text-[#64748B]" },
} as const;

type IconTone = keyof typeof ICON;

const MAX_LOGO_BYTES = 10 * 1024 * 1024;
const ACCEPT_IMAGES = "image/png,image/jpeg,image/webp";

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

function formatLocation(
  city?: string | null,
  state?: string | null,
  country?: string | null,
): string {
  const parts = [city, state, country]
    .map((part) => part?.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Add your location";
}

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

function snapshotFromBusiness(
  business: NonNullable<ReturnType<typeof useBusinessByIdQuery>["data"]>,
): FormSnapshot {
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

function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function ToneIcon({
  icon: Icon,
  tone,
  size = "md",
}: {
  icon: LucideIcon;
  tone: IconTone;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "size-7 rounded-lg" : "size-8 rounded-[0.65rem]";
  const glyph = size === "sm" ? "size-3.5" : "size-4";
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${box} ${ICON[tone].wrap} ${ICON[tone].ink}`}
    >
      <Icon className={glyph} strokeWidth={2.25} aria-hidden />
    </span>
  );
}

function DetailField({
  label,
  htmlFor,
  icon,
  tone,
  error,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  icon: LucideIcon;
  tone: IconTone;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border border-[#E8EDF5] bg-[#F8FAFC] px-3 py-2 ${className}`}
    >
      <ToneIcon icon={icon} tone={tone} size="sm" />
      <div className="min-w-0 flex-1">
        <label
          htmlFor={htmlFor}
          className="m-0 block text-[0.65rem] font-medium text-slate-500"
        >
          {label}
        </label>
        <div className="mt-0.5">{children}</div>
        {error ? (
          <p className="m-0 mt-0.5 text-[0.65rem] text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

const fieldInputClass =
  "w-full border-0 bg-transparent p-0 text-[0.86rem] font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400 focus:ring-0";

function BusinessLogoAvatar({
  disabled,
  previewUrl,
  file,
  businessName,
  onFile,
}: {
  disabled: boolean;
  previewUrl: string | null;
  file: File | null;
  businessName: string;
  onFile: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const filePreviewUrl = useMemo(() => {
    if (!file || !isImageMime(file.type)) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (!filePreviewUrl) return;
    return () => URL.revokeObjectURL(filePreviewUrl);
  }, [filePreviewUrl]);

  const displayUrl = filePreviewUrl ?? previewUrl;
  const initials = businessName.trim().slice(0, 2).toUpperCase() || "BZ";

  const validateAndSet = useCallback(
    (nextFile: File | null, inputEl: HTMLInputElement | null) => {
      setLocalError(null);
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

  return (
    <div className="flex shrink-0 flex-col items-center">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_IMAGES}
        className="hidden"
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          validateAndSet(event.target.files?.[0] ?? null, event.target);
        }}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="group relative size-[5.5rem] cursor-pointer focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 xl:size-[6.25rem]"
        aria-label="Upload business logo"
      >
        <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-[0_8px_22px_rgba(15,23,42,0.1)] ring-1 ring-[#E2E8F0] transition group-hover:ring-[#2F6BFF]/35 group-focus-visible:ring-4 group-focus-visible:ring-[#2F6BFF]/25 xl:p-2.5">
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-xl bg-[#0B2340] text-lg font-bold tracking-wide text-white/90">
              {initials}
            </span>
          )}
        </span>
        <span className="absolute -bottom-1.5 -right-1.5 z-10 flex size-7 items-center justify-center rounded-full border-[2.5px] border-white bg-white text-slate-500 shadow-md">
          <Pencil className="size-3" strokeWidth={2.5} aria-hidden />
        </span>
      </button>

      {file ? (
        <button
          type="button"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "";
            onFile(null);
          }}
          className="mt-2 inline-flex cursor-pointer items-center gap-0.5 text-[0.78rem] font-semibold text-[#E11D48]"
        >
          <X className="size-3" aria-hidden />
          Undo
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="mt-2 cursor-pointer text-[0.82rem] font-semibold text-[#2F6BFF] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          Upload logo
        </button>
      )}

      {localError ? (
        <p className="mt-0.5 max-w-[6.5rem] text-center text-[0.65rem] text-red-600">
          {localError}
        </p>
      ) : null}
    </div>
  );
}

export function BusinessGeneralSettingsForm({
  businessId,
  activeSection = "general",
}: BusinessGeneralSettingsFormProps) {
  const queryClient = useQueryClient();
  const detailsRef = useRef<HTMLElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const previewSection: BusinessProfilePreviewSection =
    activeSection === "members" || activeSection === "integrations"
      ? activeSection
      : "general";
  const isProfileView = previewSection === "general";
  const previewMeta = PREVIEW_TITLES[previewSection];

  const { data: business, isPending, error } = useBusinessByIdQuery(businessId);

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
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!business) return;
    const next = snapshotFromBusiness(business);
    setForm(next);
    setBaseline(next);
    setLogoFile(null);
  }, [business]);

  const patchForm = useCallback((patch: Partial<FormSnapshot>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const logoSrc = resolveUploadImageUrl(business?.logoUrl ?? null);
  const locationLabel = formatLocation(form.city, form.state, form.country);
  const displayName = formatTitleCase(form.name.trim() || "Your business");
  const twilioNumber = business?.twilioPhoneNumber?.trim() || "";

  const hasChanges = useMemo(() => {
    if (!baseline) return false;
    if (logoFile) return true;
    return (
      form.name !== baseline.name ||
      form.description !== baseline.description ||
      form.phoneNumber !== baseline.phoneNumber ||
      form.email !== baseline.email ||
      form.websiteUrl !== baseline.websiteUrl ||
      form.city !== baseline.city ||
      form.state !== baseline.state ||
      form.country !== baseline.country ||
      form.postalCode !== baseline.postalCode ||
      form.branchCount !== baseline.branchCount
    );
  }, [baseline, form, logoFile]);

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

  const handleDiscard = () => {
    if (!baseline) return;
    setForm(baseline);
    setLogoFile(null);
    setFormError(null);
  };

  const focusDetails = () => {
    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    window.setTimeout(() => nameInputRef.current?.focus(), 200);
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

      setLogoFile(null);
      toast.success("Business profile updated.");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Could not update business profile.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const totalCampaigns = business?.summary?.totalCampaigns ?? 0;
  const totalCustomers = business?.summary?.totalCustomers ?? 0;
  const activeAutomations = business?.summary?.activeAutomations ?? 0;
  const usagePercent = useMemo(() => {
    // Keep the bar in sync while the owner edits fields before save.
    const checks = [
      form.name.trim(),
      form.phoneNumber.trim(),
      form.email.trim(),
      form.websiteUrl.trim(),
      form.city.trim(),
      form.country.trim(),
      form.description.trim(),
      Boolean(logoSrc || logoFile),
    ];
    const filled = checks.filter(Boolean).length;
    const live = Math.round((filled / checks.length) * 100);
    if (hasChanges) return live;
    return business?.summary?.monthlyUsagePercent ?? live;
  }, [business?.summary?.monthlyUsagePercent, form, hasChanges, logoFile, logoSrc]);

  const quickActions = [
    {
      id: "members" as const,
      href: businessSettingsHref(businessId, "members"),
      label: "Manage members",
      icon: Users,
      tone: "green" as const,
    },
    {
      id: "integrations" as const,
      href: businessSettingsHref(businessId, "integrations"),
      label: "Integrations",
      icon: Link2,
      tone: "pink" as const,
    },
  ];

  if (isProfileView && isPending) {
    return (
      <div className="grid h-full gap-3 lg:grid-cols-[minmax(0,1fr)_17.5rem]" aria-busy="true">
        <Skeleton funnel className="h-full w-full rounded-2xl" />
        <Skeleton funnel className="h-full w-full rounded-2xl" />
      </div>
    );
  }

  if (isProfileView && error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={2.25} />
        <span>{error}</span>
      </div>
    );
  }

  const profileMain = (
    <>
          {/* Overview card — exact mock */}
          <section className="shrink-0 rounded-2xl border border-[#E8EDF5] bg-white px-5 py-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)] xl:px-6 xl:py-5">
            <div className="flex items-start gap-5">
              <BusinessLogoAvatar
                disabled={saving}
                previewUrl={logoSrc}
                file={logoFile}
                businessName={form.name}
                onFile={setLogoFile}
              />

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="m-0 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Business name
                    </p>
                    <h2 className="m-0 mt-1 truncate text-[1.35rem] font-extrabold tracking-tight text-[#0F172A] xl:text-[1.5rem]">
                      {displayName}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={focusDetails}
                    className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3 text-[0.8rem] font-semibold text-slate-700 transition hover:bg-[#F8FAFC]"
                  >
                    <Pencil className="size-3.5" strokeWidth={2.25} aria-hidden />
                    Edit profile
                  </button>
                </div>

                <p className="m-0 mt-2 line-clamp-2 text-[0.88rem] leading-relaxed text-slate-500">
                  {form.description.trim() ||
                    "Add a short description so customers know what you offer."}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-0 gap-y-1.5 text-[0.82rem] text-slate-600">
                  <span className="inline-flex min-w-0 items-center gap-1.5 pr-3">
                    <MapPin
                      className="size-3.5 shrink-0 text-slate-400"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    <span className="truncate">{locationLabel}</span>
                  </span>
                  <span className="hidden h-3.5 w-px bg-[#E5E7EB] sm:block" aria-hidden />
                  <span className="inline-flex items-center gap-1.5 sm:pl-3">
                    <GitBranch
                      className="size-3.5 shrink-0 text-slate-400"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    {form.branchCount}{" "}
                    {Number(form.branchCount) === 1 ? "branch" : "branches"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Business details — exact mock fields */}
          <section
            ref={detailsRef}
            id="business-details"
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#E8EDF5] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)]"
          >
            <header className="flex shrink-0 items-center gap-3 px-5 py-3.5 xl:px-6">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#E8F1FF] text-[#2F6BFF]">
                <Building2 className="size-4" strokeWidth={2.25} aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="m-0 text-[1rem] font-bold text-[#0F172A]">
                  Business details
                </h3>
                <p className="m-0 mt-0.5 text-[0.78rem] text-slate-500">
                  Core information about your business
                </p>
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-2.5 overflow-hidden px-5 pb-3 xl:px-6">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <DetailField
                  label="Business name"
                  htmlFor="business-settings-name"
                  icon={Building2}
                  tone="slate"
                >
                  <input
                    ref={nameInputRef}
                    id="business-settings-name"
                    className={fieldInputClass}
                    value={form.name}
                    onChange={(e) => patchForm({ name: e.target.value })}
                    autoComplete="organization"
                    placeholder="Your business name"
                  />
                </DetailField>

                <DetailField
                  label="Phone number"
                  htmlFor="business-settings-phone"
                  icon={Phone}
                  tone="slate"
                >
                  <BookMeetingPhoneInput
                    value={form.phoneNumber}
                    onChange={(value) => patchForm({ phoneNumber: value })}
                    wrapClassName="!gap-1 [&_input]:!text-[0.86rem] [&_input]:!font-semibold"
                  />
                </DetailField>

                {twilioNumber ? (
                  <DetailField
                    label="Twilio number"
                    htmlFor="business-settings-twilio"
                    icon={MessageSquare}
                    tone="slate"
                  >
                    <p
                      id="business-settings-twilio"
                      className={`${fieldInputClass} m-0`}
                    >
                      {twilioNumber}
                    </p>
                  </DetailField>
                ) : null}

                <DetailField
                  label="Email address"
                  htmlFor="business-settings-email"
                  icon={Mail}
                  tone="slate"
                >
                  <input
                    id="business-settings-email"
                    type="email"
                    className={fieldInputClass}
                    value={form.email}
                    onChange={(e) => patchForm({ email: e.target.value })}
                    autoComplete="email"
                    placeholder="business@email.com"
                  />
                </DetailField>

                <DetailField
                  label="Website"
                  htmlFor="business-settings-website"
                  icon={Globe}
                  tone="slate"
                  error={optionalHttpsWebsiteUrlMessage(form.websiteUrl)}
                >
                  <input
                    id="business-settings-website"
                    type="url"
                    inputMode="url"
                    className={fieldInputClass}
                    value={form.websiteUrl}
                    onChange={(e) => patchForm({ websiteUrl: e.target.value })}
                    placeholder="https://yourbusiness.com"
                  />
                </DetailField>

                <DetailField
                  label="Business category"
                  htmlFor="business-settings-city"
                  icon={Tag}
                  tone="slate"
                  error={locationFieldMessage("city", form.city)}
                >
                  <input
                    id="business-settings-city"
                    className={fieldInputClass}
                    value={form.city}
                    onChange={(e) => patchForm({ city: e.target.value })}
                    placeholder="e.g. Marketing Agency"
                  />
                </DetailField>

                <DetailField
                  label="Industry"
                  htmlFor="business-settings-country"
                  icon={Briefcase}
                  tone="slate"
                  error={locationFieldMessage("country", form.country)}
                >
                  <input
                    id="business-settings-country"
                    className={fieldInputClass}
                    value={form.country}
                    onChange={(e) => patchForm({ country: e.target.value })}
                    placeholder="e.g. Digital Marketing"
                  />
                </DetailField>
              </div>

              <DetailField
                label="Business description"
                htmlFor="business-settings-description"
                icon={FileText}
                tone="slate"
              >
                <textarea
                  id="business-settings-description"
                  rows={3}
                  className={`${fieldInputClass} min-h-[3.25rem] resize-none leading-relaxed`}
                  value={form.description}
                  onChange={(e) => patchForm({ description: e.target.value })}
                  placeholder="What makes your business stand out?"
                />
              </DetailField>

              {formError ? (
                <div
                  role="alert"
                  className="flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[0.72rem] text-red-700"
                >
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              ) : null}
            </div>

            <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-[#E8EDF5] px-5 py-3 xl:px-6">
              <div className="flex min-w-0 items-center gap-2">
                {hasChanges ? (
                  <>
                    <span className="size-2 shrink-0 rounded-full bg-[#F97316]" />
                    <p className="m-0 truncate text-[0.84rem] font-medium text-slate-700">
                      Unsaved changes
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle2
                      className="size-4 shrink-0 text-[#22C55E]"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    <p className="m-0 truncate text-[0.84rem] text-slate-500">
                      Profile is up to date
                    </p>
                  </>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                {hasChanges ? (
                  <button
                    type="button"
                    onClick={handleDiscard}
                    disabled={saving}
                    className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-[#E5E7EB] bg-white px-3.5 text-[0.84rem] font-semibold text-slate-600 disabled:opacity-60"
                  >
                    Discard
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={!canSave || saving}
                  className="inline-flex h-10 min-w-[8.25rem] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#2F6BFF] px-5 text-[0.84rem] font-bold text-white shadow-[0_6px_14px_rgba(47,107,255,0.28)] transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
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
            </footer>
          </section>
    </>
  );

  const previewMain = (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#E8EDF5] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E8EDF5] px-4 py-3 sm:px-5">
        <Link
          href={businessSettingsHref(businessId, "general")}
          className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-[#2F6BFF] no-underline hover:underline"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2.25} aria-hidden />
          Back to profile
        </Link>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {previewSection === "members" ? (
          <BusinessMembersPanel businessId={businessId} embedded />
        ) : null}
        {previewSection === "integrations" ? (
          <BusinessIntegrationsPanel businessId={businessId} />
        ) : null}
      </div>
    </section>
  );

  return (
    <div className="business-profile-fit flex h-full min-h-0 flex-col overflow-hidden">
      <header className="mb-3 shrink-0">
        <h1 className="m-0 text-[1.5rem] font-extrabold tracking-tight text-[#0F172A] xl:text-[1.7rem]">
          {previewMeta.title}
        </h1>
        <p className="m-0 mt-1 text-[0.88rem] text-slate-500">
          {previewMeta.subtitle}
        </p>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_17.25rem] xl:gap-3.5">
        <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
          {isProfileView ? profileMain : previewMain}
        </div>

        <aside className="flex min-h-0 flex-col gap-2.5 overflow-hidden xl:gap-3">
          <section className="shrink-0 overflow-hidden rounded-2xl border border-[#E8EDF5] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
            <header className="border-b border-[#E8EDF5] px-3.5 py-2.5">
              <h3 className="m-0 text-[0.86rem] font-bold text-[#0F172A]">
                Quick actions
              </h3>
            </header>
            <ul className="m-0 list-none p-1.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const selected = previewSection === action.id;
                return (
                  <li key={action.href}>
                    <Link
                      href={action.href}
                      className={`flex items-center gap-2.5 rounded-xl px-2 py-2 text-[0.8rem] font-semibold no-underline transition ${
                        selected
                          ? "bg-[#F1F5F9] text-[#0F172A]"
                          : "text-slate-700 hover:bg-[#F8FAFC]"
                      }`}
                      aria-current={selected ? "page" : undefined}
                    >
                      <ToneIcon icon={Icon} tone={action.tone} size="sm" />
                      <span className="min-w-0 flex-1 truncate">
                        {action.label}
                      </span>
                      <ChevronRight
                        className="size-3.5 shrink-0 text-slate-300"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#E8EDF5] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
            <header className="flex items-center gap-2 border-b border-[#E8EDF5] px-3.5 py-2.5">
              <ToneIcon icon={ScanLine} tone="blue" size="sm" />
              <h3 className="m-0 text-[0.86rem] font-bold text-[#0F172A]">
                Business summary
              </h3>
            </header>
            <div className="space-y-2.5 px-3.5 py-3">
              <SummaryRow
                label="Total campaigns"
                value={formatCount(totalCampaigns)}
              />
              <SummaryRow
                label="Total customers"
                value={formatCount(totalCustomers)}
              />
              <SummaryRow
                label="Active automations"
                value={formatCount(activeAutomations)}
              />
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="m-0 text-[0.78rem] text-slate-500">
                    Monthly usage
                  </p>
                  <p className="m-0 text-[0.78rem] font-bold text-[#0F172A]">
                    {usagePercent}% of limit
                  </p>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E8EDF5]">
                  <div
                    className="h-full rounded-full bg-[#2F6BFF] transition-[width]"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

        </aside>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  loading,
  trend,
}: {
  label: string;
  value: string;
  loading?: boolean;
  trend?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="m-0 text-[0.78rem] text-slate-500">{label}</p>
      {loading ? (
        <Loader2 className="size-3.5 animate-spin text-slate-400" aria-hidden />
      ) : (
        <div className="flex items-center gap-1.5">
          <p className="m-0 text-[0.86rem] font-bold text-[#0F172A]">{value}</p>
          {trend ? (
            <span className="inline-flex items-center gap-0.5 text-[0.68rem] font-semibold text-[#22C55E]">
              <ArrowUpRight className="size-3" strokeWidth={2.5} aria-hidden />
              {trend}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
