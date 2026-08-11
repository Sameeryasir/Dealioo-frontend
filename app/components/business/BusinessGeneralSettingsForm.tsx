"use client";

import { BusinessIntegrationsPanel } from "@/app/components/business/BusinessIntegrationsPanel";
import { BusinessMembersPanel } from "@/app/components/business/BusinessMembersPanel";
import { BusinessProfileEditModal } from "@/app/components/business/BusinessProfileEditModal";
import { Skeleton } from "@/app/components/skeleton";
import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import { businessSettingsHref } from "@/app/lib/business-settings-routes";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import { isValidOptionalHttpsWebsiteUrl } from "@/app/lib/website-url";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Building2,
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
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type BusinessProfilePreviewSection =
  | "general"
  | "members"
  | "integrations";

type BusinessGeneralSettingsFormProps = {
  businessId: number;
  activeSection?: BusinessProfilePreviewSection;
  focus?: string | null;
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
  yellow: { wrap: "bg-[#FFF8E8]", ink: "text-[#FCB825]" },
  purple: { wrap: "bg-[#F3E8FF]", ink: "text-[#8B5CF6]" },
  slate: { wrap: "bg-[#F1F5F9]", ink: "text-[#64748B]" },
} as const;

type IconTone = keyof typeof ICON;

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
    <div className={`flex items-start gap-2.5 py-1 ${className}`}>
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
  previewUrl,
  businessName,
}: {
  previewUrl: string | null;
  businessName: string;
}) {
  const shortLabel =
    formatTitleCase(businessName.trim()).split(/\s+/)[0] || "Biz";

  return (
    <div className="relative size-[5.75rem] shrink-0 xl:size-[6.5rem]">
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_10px_28px_rgba(47,107,255,0.22)] ring-1 ring-[#c7d7ff]">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <span
            className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-white"
            style={{
              background:
                "linear-gradient(145deg, #3B82F6 0%, #6366F1 48%, #A855F7 100%)",
            }}
          >
            <Store className="size-7 opacity-95" strokeWidth={1.75} aria-hidden />
            <span className="max-w-full truncate text-[0.72rem] font-bold tracking-tight">
              {shortLabel}
            </span>
          </span>
        )}
      </span>
    </div>
  );
}

function ProfileCityscape({ className }: { className?: string }) {
  // Soft skyline decoration for the page header (visual only).
  return (
    <svg
      viewBox="0 0 220 88"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 78V48l14-8 10 6v32H12Z"
        fill="#BFDBFE"
        opacity="0.85"
      />
      <path d="M42 78V36l18-10 16 9v43H42Z" fill="#93C5FD" opacity="0.9" />
      <path d="M82 78V28l22-14 20 12v52H82Z" fill="#60A5FA" opacity="0.55" />
      <path d="M128 78V42l14-8 12 7v37h-26Z" fill="#A7F3D0" opacity="0.7" />
      <path d="M158 78V34l20-12 18 10v46h-38Z" fill="#93C5FD" opacity="0.75" />
      <path d="M198 78V52l10-6 8 5v27h-18Z" fill="#BFDBFE" opacity="0.9" />
      <rect x="50" y="48" width="4" height="6" rx="1" fill="#EFF6FF" />
      <rect x="58" y="48" width="4" height="6" rx="1" fill="#EFF6FF" />
      <rect x="50" y="58" width="4" height="6" rx="1" fill="#EFF6FF" />
      <rect x="92" y="40" width="4" height="6" rx="1" fill="#DBEAFE" />
      <rect x="100" y="40" width="4" height="6" rx="1" fill="#DBEAFE" />
      <rect x="168" y="46" width="4" height="6" rx="1" fill="#EFF6FF" />
      <rect x="176" y="46" width="4" height="6" rx="1" fill="#EFF6FF" />
    </svg>
  );
}

const GENERAL_FOCUS_IDS: Record<string, string> = {
  info: "business-settings-name",
  logo: "business-settings-logo",
  contact: "business-settings-email",
  address: "business-settings-address",
  branch: "business-settings-branch",
  twilio: "business-settings-twilio",
};

export function BusinessGeneralSettingsForm({
  businessId,
  activeSection = "general",
  focus = null,
}: BusinessGeneralSettingsFormProps) {
  const detailsRef = useRef<HTMLElement>(null);
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
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (activeSection !== "general") return;
    const key = focus?.trim().toLowerCase() ?? "";
    const targetId = GENERAL_FOCUS_IDS[key];
    if (!targetId) return;
    const timer = window.setTimeout(() => {
      const el =
        document.getElementById(targetId) ??
        (key === "twilio"
          ? document.getElementById("business-details")
          : null);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLInputElement) {
        el.focus();
      }
    }, 80);
    return () => window.clearTimeout(timer);
  }, [activeSection, focus, isPending]);

  useEffect(() => {
    if (!business) return;
    const next = snapshotFromBusiness(business);
    setForm(next);
  }, [business]);

  const logoSrc = resolveUploadImageUrl(business?.logoUrl ?? null);
  const locationLabel = formatLocation(form.city, form.state, form.country);
  const displayName = formatTitleCase(form.name.trim() || "Your business");
  const twilioNumber = business?.twilioPhoneNumber?.trim() || "";

  const openEditModal = () => setEditOpen(true);

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
      Boolean(logoSrc),
    ];
    const filled = checks.filter(Boolean).length;
    const live = Math.round((filled / checks.length) * 100);
    return business?.summary?.monthlyUsagePercent ?? live;
  }, [business?.summary?.monthlyUsagePercent, form, logoSrc]);

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

  const websiteHref = form.websiteUrl.trim();

  const profileMain = (
    <>
          {/* Overview card — matches business profile mock */}
          <section className="shrink-0 rounded-2xl border border-[#E8EDF5] bg-white px-5 py-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)] xl:px-6 xl:py-5">
            <div className="flex items-start gap-4 sm:gap-5">
              <div id="business-settings-logo" className="scroll-mt-24">
                <BusinessLogoAvatar
                  previewUrl={logoSrc}
                  businessName={form.name}
                />
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="m-0 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Business name
                    </p>
                    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                      <h2 className="m-0 truncate text-[1.35rem] font-extrabold tracking-tight text-[#0F172A] xl:text-[1.5rem]">
                        {displayName}
                      </h2>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[0.68rem] font-bold text-[#15803D] ring-1 ring-[#BBF7D0]">
                        <span className="size-1.5 rounded-full bg-[#22C55E]" aria-hidden />
                        Active
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openEditModal}
                    className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#BFDBFE] bg-white px-3 text-[0.8rem] font-semibold text-[#2F6BFF] transition hover:bg-[#EFF6FF]"
                  >
                    <Pencil className="size-3.5" strokeWidth={2.25} aria-hidden />
                    Edit profile
                  </button>
                </div>

                <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[0.82rem] text-slate-600">
                  <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                    <MapPin
                      className="size-3.5 shrink-0 text-slate-400"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    <span className="truncate">{locationLabel}</span>
                  </span>
                  <span className="hidden h-3.5 w-px bg-[#E5E7EB] sm:block" aria-hidden />
                  <span
                    id="business-settings-branch"
                    className="inline-flex shrink-0 items-center gap-1.5"
                  >
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
            className="flex min-h-0 flex-1 scroll-mt-24 flex-col overflow-hidden rounded-2xl border border-[#E8EDF5] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)]"
          >
            <header className="flex shrink-0 items-center gap-3 px-5 py-3.5 xl:px-6">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#E8F1FF] text-[#2F6BFF]">
                <FileText className="size-4" strokeWidth={2.25} aria-hidden />
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

            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-5 pb-3 xl:px-6">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <DetailField
                  label="Business name"
                  htmlFor="business-settings-name"
                  icon={Building2}
                  tone="slate"
                >
                  <p
                    id="business-settings-name"
                    className={`${fieldInputClass} m-0`}
                  >
                    {form.name.trim() || "—"}
                  </p>
                </DetailField>

                <DetailField
                  label="Phone number"
                  htmlFor="business-settings-phone"
                  icon={Phone}
                  tone="green"
                >
                  <p
                    id="business-settings-phone"
                    className={`${fieldInputClass} m-0`}
                  >
                    {form.phoneNumber.trim() || "—"}
                  </p>
                </DetailField>

                {twilioNumber ? (
                  <DetailField
                    label="Twilio number"
                    htmlFor="business-settings-twilio"
                    icon={MessageSquare}
                    tone="purple"
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
                  tone="blue"
                >
                  <p
                    id="business-settings-email"
                    className={`${fieldInputClass} m-0`}
                  >
                    {form.email.trim() || "—"}
                  </p>
                </DetailField>

                <DetailField
                  label="Website"
                  htmlFor="business-settings-website"
                  icon={Globe}
                  tone="blue"
                >
                  {websiteHref &&
                  isValidOptionalHttpsWebsiteUrl(websiteHref) ? (
                    <a
                      id="business-settings-website"
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${fieldInputClass} m-0 block truncate text-[#2F6BFF] no-underline hover:underline`}
                      title={websiteHref}
                    >
                      {websiteHref}
                    </a>
                  ) : (
                    <p
                      id="business-settings-website"
                      className={`${fieldInputClass} m-0 text-slate-400`}
                    >
                      {websiteHref || "—"}
                    </p>
                  )}
                </DetailField>

                <DetailField
                  label="Address"
                  htmlFor="business-settings-address"
                  icon={MapPin}
                  tone="blue"
                >
                  <p
                    id="business-settings-address"
                    className={`${fieldInputClass} m-0`}
                  >
                    {locationLabel === "Add your location" ? "—" : locationLabel}
                  </p>
                </DetailField>
              </div>

              <DetailField
                label="Business description"
                htmlFor="business-settings-description"
                icon={FileText}
                tone="slate"
              >
                <p
                  id="business-settings-description"
                  className={`${fieldInputClass} m-0 min-h-[2.75rem] leading-relaxed`}
                >
                  {form.description.trim() || "—"}
                </p>
              </DetailField>

            </div>
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
      <BusinessProfileEditModal
        open={editOpen}
        businessId={businessId}
        onClose={() => setEditOpen(false)}
      />
      <header className="relative mb-3 shrink-0 pr-[7.5rem] sm:pr-[10rem]">
        <h1 className="m-0 text-[1.5rem] font-extrabold tracking-tight text-[#0F172A] xl:text-[1.7rem]">
          {previewMeta.title}
        </h1>
        <p className="m-0 mt-1 text-[0.88rem] text-slate-500">
          {previewMeta.subtitle}
        </p>
        {isProfileView ? (
          <ProfileCityscape className="pointer-events-none absolute -right-1 top-0 h-[4.5rem] w-[9rem] opacity-90 sm:h-[5.25rem] sm:w-[11rem]" />
        ) : null}
      </header>

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:gap-3.5">
        <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden">
          {isProfileView ? profileMain : previewMain}
        </div>

        <aside className="flex min-h-0 flex-col gap-2.5 overflow-y-auto xl:gap-3">
          <section className="shrink-0 overflow-hidden rounded-2xl border border-[#E8EDF5] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
            <header className="border-b border-[#E8EDF5] px-3.5 py-2.5">
              <h3 className="m-0 text-[0.86rem] font-bold text-[#0F172A]">
                Quick actions
              </h3>
            </header>
            <ul className="m-0 list-none divide-y divide-[#F1F5F9] p-0">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const selected = previewSection === action.id;
                return (
                  <li key={action.href}>
                    <Link
                      href={action.href}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 text-[0.8rem] font-semibold no-underline transition ${
                        selected
                          ? "bg-[#F8FAFC] text-[#0F172A]"
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

          <section className="shrink-0 overflow-hidden rounded-2xl border border-[#E8EDF5] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
            <header className="flex items-center gap-2 border-b border-[#E8EDF5] px-3.5 py-2.5">
              <ToneIcon icon={BarChart3} tone="purple" size="sm" />
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
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#E8EDF5]">
                  <div
                    className="h-full rounded-full bg-[#2F6BFF] transition-[width]"
                    style={{ width: `${Math.min(100, Math.max(0, usagePercent))}%` }}
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
