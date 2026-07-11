"use client";

/**
 * Change: Colorful business profile editor synced with dashboard brand tones.
 * Why: Page felt too plain; owners need a clear, always-visible way to save updates.
 * Related: BusinessSettingsPanel.tsx, update-business.ts, dashboard-brand-tones.ts
 * MCP Context 7: Brand colors without visual clutter; save always visible.
 */

import {
  BookMeetingPhoneInput,
  isValidPhoneNumber,
} from "@/app/components/book-meeting/BookMeetingPhoneInput";
import { Skeleton } from "@/app/components/skeleton";
import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import { DASHBOARD_KPI_ICON } from "@/app/lib/dashboard-brand-tones";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import { businessQueryKeys } from "@/app/services/business/business-query-keys";
import { updateBusiness } from "@/app/services/business/update-business";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Building2,
  Camera,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  X,
} from "lucide-react";
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

type BusinessGeneralSettingsFormProps = {
  businessId: number;
};

const inputClass =
  "brand-input h-11 w-full rounded-xl border-[#e2e8f0] bg-white py-2 text-[0.92rem] text-slate-900 shadow-sm transition focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/15";

const textareaClass =
  "brand-input min-h-[5.5rem] w-full resize-y rounded-xl border-[#e2e8f0] bg-white py-2.5 text-[0.92rem] text-slate-900 shadow-sm transition focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/15";

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

// --- Section themes (match integrations + dashboard KPI colors) ---
const sectionThemes = {
  identity: {
    accent: "bg-gradient-to-r from-[#1877f2] via-[#3b82f6] to-[#1877f2]",
    surface: "bg-gradient-to-br from-white to-[#f4f8ff]",
    icon: "blue" as const,
  },
  contact: {
    accent: "bg-gradient-to-r from-[#34a853] via-[#22c55e] to-[#34a853]",
    surface: "bg-gradient-to-br from-white to-[#f0fdf4]",
    icon: "green" as const,
  },
  location: {
    accent: "bg-gradient-to-r from-[#f77737] via-[#fb923c] to-[#f77737]",
    surface: "bg-gradient-to-br from-white to-[#fff7ed]",
    icon: "orange" as const,
  },
} as const;

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

function isValidOptionalUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return true;
  } catch {
    return false;
  }
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

function ColoredFormField({
  label,
  htmlFor,
  icon: Icon,
  tone,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  icon: typeof Building2;
  tone: keyof typeof DASHBOARD_KPI_ICON;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.05rem] border border-[#e8edf5] bg-gradient-to-b from-white to-[#f8faff] p-4 shadow-[0_4px_14px_rgba(15,23,42,0.03)] ${className}`}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${DASHBOARD_KPI_ICON[tone]}`}
        >
          <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
        </span>
        <label
          htmlFor={htmlFor}
          className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-500"
        >
          {label}
        </label>
      </div>
      {children}
      {hint ? (
        <p className="m-0 mt-2 text-[0.72rem] leading-relaxed text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function SettingsSection({
  theme,
  title,
  description,
  icon: Icon,
  children,
}: {
  theme: keyof typeof sectionThemes;
  title: string;
  description: string;
  icon: typeof Building2;
  children: ReactNode;
}) {
  const t = sectionThemes[theme];
  return (
    <section
      className={`overflow-hidden rounded-[1.25rem] border border-[#e8edf5] shadow-[0_6px_18px_rgba(15,23,42,0.04)] ${t.surface}`}
    >
      <div className={`h-1.5 w-full ${t.accent}`} aria-hidden />
      <header className="border-b border-[#e8edf5]/80 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${DASHBOARD_KPI_ICON[t.icon]}`}
          >
            <Icon className="size-4" strokeWidth={2.25} aria-hidden />
          </span>
          <div>
            <h3 className="m-0 text-[0.95rem] font-bold tracking-tight text-slate-900">
              {title}
            </h3>
            <p className="m-0 mt-1 text-xs leading-relaxed text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </header>
      <div className="space-y-4 p-5 sm:p-6">{children}</div>
    </section>
  );
}

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

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      validateAndSet(event.target.files?.[0] ?? null, event.target);
    },
    [validateAndSet],
  );

  return (
    <div className="shrink-0">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_IMAGES}
        className="hidden"
        disabled={disabled}
        onChange={onChange}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="group relative size-[5.5rem] cursor-pointer overflow-hidden rounded-2xl border-2 border-white bg-[#e8f2ff] shadow-[0_8px_24px_rgba(24,119,242,0.2)] ring-2 ring-[#bfdbfe] transition hover:ring-[#1877f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2] disabled:cursor-not-allowed disabled:opacity-60 sm:size-[6.5rem]"
        aria-label="Change business logo"
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg font-bold text-[#1877f2]">
            {initials}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-[#1877f2]/70 opacity-0 transition group-hover:opacity-100">
          <Camera className="size-5 text-white" strokeWidth={2} aria-hidden />
        </span>
      </button>

      {file ? (
        <button
          type="button"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "";
            onFile(null);
          }}
          className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1 text-[0.68rem] font-semibold text-[#e1306c] transition hover:text-[#be185d]"
        >
          <X className="size-3" aria-hidden />
          Undo logo change
        </button>
      ) : (
        <p className="m-0 mt-2 max-w-[6.5rem] text-center text-[0.65rem] font-semibold leading-snug text-[#1877f2]">
          Click to upload logo
        </p>
      )}

      {localError ? (
        <p className="mt-1 max-w-[6.5rem] text-center text-[0.65rem] text-red-600">
          {localError}
        </p>
      ) : null}
    </div>
  );
}

export function BusinessGeneralSettingsForm({
  businessId,
}: BusinessGeneralSettingsFormProps) {
  const queryClient = useQueryClient();
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
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return false;
    }
    if (!isValidOptionalUrl(form.websiteUrl)) return false;
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

  const handleSave = async () => {
    if (!canSave || saving) return;
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

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton funnel className="h-36 w-full rounded-[1.25rem]" />
        <Skeleton funnel className="h-64 w-full rounded-[1.25rem]" />
        <Skeleton funnel className="h-48 w-full rounded-[1.25rem]" />
      </div>
    );
  }

  if (error) {
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

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-4">
      {/* --- Identity header with brand gradient --- */}
      <section className="overflow-hidden rounded-[1.25rem] border border-[#e8edf5] bg-gradient-to-br from-white via-[#f8faff] to-[#fdf2f8] shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <div
          className="h-1.5 w-full bg-gradient-to-r from-[#1877f2] via-[#e1306c] to-[#34a853]"
          aria-hidden
        />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <BusinessLogoAvatar
              disabled={saving}
              previewUrl={logoSrc}
              file={logoFile}
              businessName={form.name}
              onFile={setLogoFile}
            />

            <div className="min-w-0 flex-1">
              <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#1877f2]">
                Public profile
              </p>
              <h3 className="m-0 mt-1 text-[clamp(1.35rem,2.5vw,1.75rem)] font-extrabold tracking-tight text-slate-900">
                {displayName}
              </h3>
              <p className="m-0 mt-1 max-w-prose text-sm leading-relaxed text-slate-600">
                {form.description.trim() ||
                  "Add a short description so customers know what you offer."}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#e8f2ff] px-2.5 py-1 text-[0.72rem] font-semibold text-[#1877f2] ring-1 ring-[#bfdbfe]">
                  <MapPin className="size-3 shrink-0" strokeWidth={2.25} />
                  <span className="truncate">{locationLabel}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[0.72rem] font-semibold text-[#166534] ring-1 ring-[#bbf7d0]">
                  <Building2 className="size-3 shrink-0" strokeWidth={2.25} />
                  {form.branchCount}{" "}
                  {Number(form.branchCount) === 1 ? "branch" : "branches"}
                </span>
                {hasChanges ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff7ed] px-2.5 py-1 text-[0.72rem] font-bold text-[#c2410c] ring-1 ring-[#fed7aa]">
                    <span className="size-1.5 rounded-full bg-[#f77737]" />
                    Unsaved
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SettingsSection
        theme="identity"
        title="Business details"
        description="Core information customers see on your dashboard and campaigns."
        icon={Building2}
      >
        <ColoredFormField
          label="Business name"
          htmlFor="business-settings-name"
          icon={Building2}
          tone="blue"
        >
          <input
            id="business-settings-name"
            className={inputClass}
            value={form.name}
            onChange={(e) => patchForm({ name: e.target.value })}
            autoComplete="organization"
          />
        </ColoredFormField>

        <ColoredFormField
          label="Description"
          htmlFor="business-settings-description"
          icon={Building2}
          tone="green"
          hint="One or two sentences is enough."
        >
          <textarea
            id="business-settings-description"
            className={textareaClass}
            value={form.description}
            onChange={(e) => patchForm({ description: e.target.value })}
            placeholder="What makes your business stand out?"
          />
        </ColoredFormField>

        <ColoredFormField
          label="Branches"
          htmlFor="business-settings-branches"
          icon={Building2}
          tone="orange"
        >
          <input
            id="business-settings-branches"
            type="number"
            min={1}
            className={`${inputClass} max-w-[8rem]`}
            value={form.branchCount}
            onChange={(e) => patchForm({ branchCount: e.target.value })}
          />
        </ColoredFormField>
      </SettingsSection>

      <SettingsSection
        theme="contact"
        title="Contact"
        description="How customers and your team reach this business."
        icon={Phone}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ColoredFormField
            label="Phone"
            htmlFor="business-settings-phone"
            icon={Phone}
            tone="green"
          >
            <BookMeetingPhoneInput
              value={form.phoneNumber}
              onChange={(value) => patchForm({ phoneNumber: value })}
            />
          </ColoredFormField>

          <ColoredFormField
            label="Email"
            htmlFor="business-settings-email"
            icon={Mail}
            tone="pink"
          >
            <input
              id="business-settings-email"
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => patchForm({ email: e.target.value })}
              autoComplete="email"
              placeholder="business@email.com"
            />
          </ColoredFormField>
        </div>

        <ColoredFormField
          label="Website"
          htmlFor="business-settings-website"
          icon={Globe}
          tone="blue"
        >
          <input
            id="business-settings-website"
            className={inputClass}
            value={form.websiteUrl}
            onChange={(e) => patchForm({ websiteUrl: e.target.value })}
            placeholder="https://yourbusiness.com"
          />
        </ColoredFormField>
      </SettingsSection>

      <SettingsSection
        theme="location"
        title="Location"
        description="Shown on your dashboard and in location-based campaigns."
        icon={MapPin}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ColoredFormField
            label="City"
            htmlFor="business-settings-city"
            icon={MapPin}
            tone="blue"
          >
            <input
              id="business-settings-city"
              className={inputClass}
              value={form.city}
              onChange={(e) => patchForm({ city: e.target.value })}
              placeholder="Islamabad"
            />
          </ColoredFormField>

          <ColoredFormField
            label="State / province"
            htmlFor="business-settings-state"
            icon={MapPin}
            tone="green"
          >
            <input
              id="business-settings-state"
              className={inputClass}
              value={form.state}
              onChange={(e) => patchForm({ state: e.target.value })}
              placeholder="Punjab"
            />
          </ColoredFormField>

          <ColoredFormField
            label="Country"
            htmlFor="business-settings-country"
            icon={MapPin}
            tone="pink"
          >
            <input
              id="business-settings-country"
              className={inputClass}
              value={form.country}
              onChange={(e) => patchForm({ country: e.target.value })}
              placeholder="Pakistan"
            />
          </ColoredFormField>

          <ColoredFormField
            label="Postal code"
            htmlFor="business-settings-postal"
            icon={MapPin}
            tone="orange"
          >
            <input
              id="business-settings-postal"
              className={inputClass}
              value={form.postalCode}
              onChange={(e) => patchForm({ postalCode: e.target.value })}
              placeholder="44000"
            />
          </ColoredFormField>
        </div>
      </SettingsSection>

      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={2.25} />
          <span>{formError}</span>
        </div>
      ) : null}

      {/* --- Always-visible save bar so update is obvious --- */}
      <div className="sticky bottom-3 z-10">
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-[1.15rem] border px-4 py-3.5 shadow-[0_12px_32px_rgba(15,23,42,0.1)] backdrop-blur-md sm:px-5 ${
            hasChanges
              ? "border-[#bfdbfe] bg-gradient-to-r from-white via-[#f8faff] to-white"
              : "border-[#e8edf5] bg-white/95"
          }`}
        >
          <div className="flex items-center gap-2">
            {hasChanges ? (
              <>
                <span
                  className="size-2 shrink-0 rounded-full bg-[#f77737]"
                  aria-hidden
                />
                <p className="m-0 text-sm font-semibold text-slate-700">
                  You have unsaved changes
                </p>
              </>
            ) : (
              <>
                <span
                  className="size-2 shrink-0 rounded-full bg-[#34a853]"
                  aria-hidden
                />
                <p className="m-0 text-sm text-slate-500">
                  Profile is up to date — edit any field to update
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {hasChanges ? (
              <button
                type="button"
                onClick={handleDiscard}
                disabled={saving}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Discard
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!canSave || saving}
              className="inline-flex h-11 min-w-[11.5rem] cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.32)] transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" strokeWidth={2.25} />
                  Saving…
                </>
              ) : (
                "Save business profile"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
