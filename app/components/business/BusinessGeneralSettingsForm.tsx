"use client";

import dynamic from "next/dynamic";
import { BusinessProfileEditModal } from "@/app/components/business/BusinessProfileEditModal";
import { BusinessDetailRow } from "@/app/components/business/business-profile/BusinessDetailRow";
import { BusinessProfileSkeleton } from "@/app/components/business/business-profile/BusinessProfileSkeleton";
import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import { businessSettingsHref } from "@/app/lib/business-settings-routes";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import { isValidOptionalHttpsWebsiteUrl } from "@/app/lib/website-url";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  ChevronRight,
  FileText,
  Globe,
  Link2,
  Mail,
  MapPin,
  Megaphone,
  Pencil,
  Phone,
  Settings2,
  Sparkles,
  Users,
  UtensilsCrossed,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const BusinessIntegrationsPanel = dynamic(
  () =>
    import("@/app/components/business/BusinessIntegrationsPanel").then(
      (mod) => mod.BusinessIntegrationsPanel,
    ),
  { ssr: false },
);
const BusinessMembersPanel = dynamic(
  () =>
    import("@/app/components/business/BusinessMembersPanel").then(
      (mod) => mod.BusinessMembersPanel,
    ),
  { ssr: false },
);

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
    title: "Team",
    subtitle: "Invite teammates and manage access for this business",
  },
  integrations: {
    title: "Integrations",
    subtitle: "Connect Stripe, Meta, and Google Ads for this business.",
  },
};

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

function displayOrDash(value: string): string {
  return value.trim() || "—";
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

const GENERAL_FOCUS_IDS: Record<string, string> = {
  info: "business-settings-name",
  logo: "business-settings-logo",
  contact: "business-settings-email",
  address: "business-settings-address",
  branch: "business-settings-branch",
};

const cardClass =
  "rounded-[1.15rem] border border-[#e5edf7] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.045)]";

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

  const { data: business, isPending, error } = useBusinessByIdQuery(
    previewSection === "general" ? businessId : null,
  );

  const [editOpen, setEditOpen] = useState(false);

  const form = useMemo<FormSnapshot>(() => {
    if (!business) {
      return {
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
      };
    }
    return snapshotFromBusiness(business);
  }, [business]);

  useEffect(() => {
    if (activeSection !== "general") return;
    const key = focus?.trim().toLowerCase() ?? "";
    const targetId = GENERAL_FOCUS_IDS[key];
    if (!targetId) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(targetId);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLInputElement) {
        el.focus();
      }
    }, 80);
    return () => window.clearTimeout(timer);
  }, [activeSection, focus, isPending]);

  const logoSrc = resolveUploadImageUrl(business?.logoUrl ?? null);
  const displayName = formatTitleCase(form.name.trim() || "Your business");
  const openEditModal = () => setEditOpen(true);

  const totalCampaigns = business?.summary?.totalCampaigns ?? 0;
  const totalCustomers = business?.summary?.totalCustomers ?? 0;
  const activeAutomations = business?.summary?.activeAutomations ?? 0;

  const isBusinessActive = business?.owner?.isActive !== false && Boolean(business);

  const locationLine = [
    form.city.trim() || null,
    form.state.trim() || null,
    `${form.branchCount} ${
      Number(form.branchCount) === 1 ? "branch" : "branches"
    }`,
  ]
    .filter(Boolean)
    .join(" | ");

  const locationBadge = [form.city.trim(), form.state.trim()]
    .filter(Boolean)
    .join(", ");

  const businessTypeLabel = displayOrDash(business?.businessType ?? "");
  const websiteHref = form.websiteUrl.trim();
  const websiteValid =
    websiteHref.length > 0 && isValidOptionalHttpsWebsiteUrl(websiteHref);
  const phoneHref = form.phoneNumber.trim()
    ? `tel:${form.phoneNumber.trim()}`
    : null;
  const emailHref = form.email.trim() ? `mailto:${form.email.trim()}` : null;

  if (isProfileView && !business && !error) {
    return <BusinessProfileSkeleton />;
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

  const previewMain = (
    <section className={`flex min-h-0 flex-1 flex-col overflow-hidden ${cardClass}`}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e5edf7] px-4 py-3 sm:px-5">
        <Link
          href={businessSettingsHref(businessId, "general")}
          className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-[#1464ff] no-underline hover:underline"
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
          <BusinessIntegrationsPanel
            businessId={businessId}
            focus={focus ?? undefined}
          />
        ) : null}
      </div>
    </section>
  );

  const profileMain = (
    <>
      <section
        className={`relative overflow-visible ${cardClass} px-4 py-3.5 sm:px-5 sm:py-4`}
      >
        <span
          className="pointer-events-none absolute -right-12 -top-16 size-40 rounded-full bg-[#1464ff]/[0.06] blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
            <div
              id="business-settings-logo"
              className="relative size-[5.75rem] shrink-0 xl:size-[6.5rem]"
            >
              <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)] ring-1 ring-[#e8edf5]">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoSrc}
                    alt=""
                    className="size-full object-contain object-center p-1.5"
                  />
                ) : (
                  <Camera
                    className="size-8 text-slate-300"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                )}
              </span>
              <button
                type="button"
                onClick={openEditModal}
                aria-label="Update business logo"
                className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full bg-[#09b66f] text-white shadow-[0_4px_10px_rgba(9,182,111,0.3)] ring-2 ring-white transition hover:brightness-105"
              >
                <Camera className="size-3.5" strokeWidth={2.25} aria-hidden />
              </button>
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <p className="m-0 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#7183a4]">
                Business name
              </p>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="m-0 truncate text-[1.35rem] font-extrabold tracking-tight text-[#101a35] xl:text-[1.5rem]">
                  {displayName}
                </h2>
                {isBusinessActive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[0.68rem] font-bold text-[#15803d] ring-1 ring-[#bbf7d0]">
                    <span
                      className="size-1.5 rounded-full bg-[#22c55e]"
                      aria-hidden
                    />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[0.68rem] font-bold text-amber-700 ring-1 ring-amber-200">
                    <span
                      className="size-1.5 rounded-full bg-amber-500"
                      aria-hidden
                    />
                    Inactive
                  </span>
                )}
              </div>

              <p
                id="business-settings-branch"
                className="m-0 mt-1.5 flex min-w-0 items-center gap-1.5 truncate text-[0.82rem] font-medium text-[#7183a4]"
              >
                <MapPin className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
                <span className="min-w-0 truncate">{locationLine || "—"}</span>
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {businessTypeLabel !== "—" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#eef2f7] px-2 py-0.5 text-[0.68rem] font-semibold text-[#344564]">
                    <UtensilsCrossed className="size-3" strokeWidth={2.25} aria-hidden />
                    {businessTypeLabel}
                  </span>
                ) : null}
                {locationBadge ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#eef2f7] px-2 py-0.5 text-[0.68rem] font-semibold text-[#344564]">
                    <MapPin className="size-3" strokeWidth={2.25} aria-hidden />
                    {locationBadge}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openEditModal}
            className="inline-flex h-9 w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#2f6bff_0%,#1464ff_100%)] px-3 text-[0.8rem] font-semibold text-white shadow-[0_8px_18px_rgba(20,100,255,0.22)] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1464ff] sm:w-auto"
          >
            <Pencil className="size-3.5" strokeWidth={2.25} aria-hidden />
            Edit Profile
            <ArrowRight className="size-3.5" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </section>

      <section
        ref={detailsRef}
        id="business-details"
        className={`scroll-mt-24 ${cardClass} px-5 py-5 sm:px-6 sm:py-6`}
      >
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#1464ff]">
              <FileText className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="m-0 text-[1.05rem] font-bold text-[#101a35]">
                Business details
              </h3>
              <p className="m-0 mt-0.5 text-[0.8rem] text-[#7183a4]">
                Core information about your business
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openEditModal}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#bfdbfe] bg-white px-3.5 text-[0.82rem] font-semibold text-[#1464ff] transition hover:bg-[#eff6ff]"
          >
            <Pencil className="size-3.5" strokeWidth={2.25} aria-hidden />
            Edit Details
          </button>
        </header>

        <div className="mt-2 grid grid-cols-1 gap-x-8 md:grid-cols-2">
          <div className="min-w-0">
            <BusinessDetailRow
              icon={Building2}
              tone="blue"
              label="Business name"
              htmlFor="business-settings-name"
              value={displayOrDash(form.name)}
            />
            <BusinessDetailRow
              icon={Wallet}
              tone="amber"
              label="Currency"
              htmlFor="business-settings-currency"
              value={displayOrDash(business?.currency ?? "")}
            />
            <BusinessDetailRow
              icon={Mail}
              tone="purple"
              label="Email address"
              htmlFor="business-settings-email"
              value={displayOrDash(form.email)}
              href={emailHref}
            />
            <BusinessDetailRow
              icon={MapPin}
              tone="green"
              label="City"
              htmlFor="business-settings-city"
              value={displayOrDash(form.city)}
            />
            <BusinessDetailRow
              icon={Globe}
              tone="sky"
              label="Country"
              htmlFor="business-settings-country"
              value={displayOrDash(form.country)}
              showDivider={false}
            />
          </div>
          <div className="min-w-0">
            <BusinessDetailRow
              icon={UtensilsCrossed}
              tone="orange"
              label="Business type"
              htmlFor="business-settings-type"
              value={businessTypeLabel}
            />
            <BusinessDetailRow
              icon={Phone}
              tone="teal"
              label="Phone number"
              htmlFor="business-settings-phone"
              value={displayOrDash(form.phoneNumber)}
              href={phoneHref}
            />
            <BusinessDetailRow
              icon={Link2}
              tone="indigo"
              label="Website"
              htmlFor="business-settings-website"
              value={displayOrDash(websiteHref)}
              href={websiteValid ? websiteHref : null}
            />
            <BusinessDetailRow
              icon={MapPin}
              tone="pink"
              label="State"
              htmlFor="business-settings-state"
              value={displayOrDash(form.state)}
            />
            <BusinessDetailRow
              icon={Building2}
              tone="rose"
              label="Postal code"
              htmlFor="business-settings-address"
              value={displayOrDash(form.postalCode)}
              showDivider={false}
            />
          </div>
        </div>

      </section>

    </>
  );

  return (
    <div className="business-profile-fit flex min-h-0 w-full min-w-0 flex-col bg-[#f1f5fb]/40">
      <BusinessProfileEditModal
        open={editOpen}
        businessId={businessId}
        onClose={() => setEditOpen(false)}
      />

      {previewSection === "integrations" ? null : (
        <header className="relative mb-4 shrink-0 pt-1">
          <h1 className="m-0 text-[1.5rem] font-extrabold tracking-tight text-[#101a35] xl:text-[1.7rem]">
            {previewMeta.title}
          </h1>
          <p className="m-0 mt-1 text-[0.88rem] text-[#7183a4]">
            {previewMeta.subtitle}
          </p>
        </header>
      )}

      <div
        className={`grid min-w-0 gap-4 pb-4 ${
          isProfileView
            ? "xl:grid-cols-[minmax(0,1fr)_16.5rem]"
            : "min-h-0 flex-1"
        }`}
      >
        <div className="flex min-w-0 flex-col gap-4">
          {isProfileView ? profileMain : previewMain}
        </div>

        {isProfileView ? (
          <aside className="flex min-w-0 flex-col gap-4">
            <section className={`${cardClass} px-4 py-4 sm:px-5`}>
              <header className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f1ff] text-[#1464ff]">
                  <Zap className="size-3.5" strokeWidth={2.25} aria-hidden />
                </span>
                <h3 className="m-0 text-[0.86rem] font-bold text-[#101a35]">
                  Quick actions
                </h3>
              </header>
              <div className="mt-3 space-y-2.5">
                <QuickActionRow
                  href={businessSettingsHref(businessId, "members")}
                  icon={Users}
                  tone="green"
                  title="Manage members"
                />
                <QuickActionRow
                  href={businessSettingsHref(businessId, "integrations")}
                  icon={Link2}
                  tone="pink"
                  title="Integrations"
                />
              </div>
            </section>

            <section className={`${cardClass} px-4 py-4 sm:px-5`}>
              <header className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f3e8ff] text-[#8b5cf6]">
                  <Sparkles className="size-3.5" strokeWidth={2.25} aria-hidden />
                </span>
                <h3 className="m-0 text-[0.86rem] font-bold text-[#101a35]">
                  Business summary
                </h3>
              </header>
              <div className="mt-3 space-y-2">
                <SummaryStatRow
                  icon={Megaphone}
                  tone="blue"
                  label="Total campaigns"
                  value={formatCount(totalCampaigns)}
                />
                <SummaryStatRow
                  icon={Users}
                  tone="purple"
                  label="Total customers"
                  value={formatCount(totalCustomers)}
                />
                <SummaryStatRow
                  icon={Settings2}
                  tone="orange"
                  label="Active automations"
                  value={formatCount(activeAutomations)}
                />
              </div>
            </section>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function QuickActionRow({
  href,
  icon: Icon,
  tone,
  title,
}: {
  href: string;
  icon: LucideIcon;
  tone: "green" | "pink";
  title: string;
}) {
  const toneClass =
    tone === "green"
      ? "bg-[#e8f8ef] text-[#22c55e]"
      : "bg-[#fde8f0] text-[#e11d48]";

  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-xl bg-transparent px-1 py-2 no-underline transition hover:bg-[#f8faff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1464ff]"
    >
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${toneClass}`}
      >
        <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate text-[0.8rem] font-semibold text-[#101a35]">
        {title}
      </span>
      <ChevronRight
        className="size-3.5 shrink-0 text-slate-300"
        strokeWidth={2.25}
        aria-hidden
      />
    </Link>
  );
}

function SummaryStatRow({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: LucideIcon;
  tone: "blue" | "purple" | "orange";
  label: string;
  value: string;
}) {
  const toneMap = {
    blue: "bg-[#e8f1ff] text-[#1464ff]",
    purple: "bg-[#f3e8ff] text-[#8b5cf6]",
    orange: "bg-[#fff1e6] text-[#f97316]",
  } as const;

  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-transparent px-1 py-2">
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${toneMap[tone]}`}
      >
        <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate text-[0.8rem] font-semibold text-[#101a35]">
        {label}
      </span>
      <span className="shrink-0 text-[0.86rem] font-bold text-[#101a35]">
        {value}
      </span>
    </div>
  );
}
