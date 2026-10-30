"use client";

import dynamic from "next/dynamic";
import { BusinessProfileEditModal } from "@/app/components/business/BusinessProfileEditModal";
import { BusinessDetailRow } from "@/app/components/business/business-profile/BusinessDetailRow";
import { BusinessProfileSkeleton } from "@/app/components/business/business-profile/BusinessProfileSkeleton";
import { ProfileCompletionRing } from "@/app/components/business/business-profile/ProfileCompletionRing";
import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import { businessSettingsHref } from "@/app/lib/business-settings-routes";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import { isValidOptionalHttpsWebsiteUrl } from "@/app/lib/website-url";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Camera,
  Check,
  ChevronRight,
  FileText,
  MapPin,
  Pencil,
  Sparkles,
  UtensilsCrossed,
  Zap,
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

  const profileCompletion = useMemo(() => {
    const items = [
      {
        id: "basic",
        label: "Basic information",
        done: Boolean(form.name.trim() && logoSrc),
      },
      {
        id: "contact",
        label: "Contact details",
        done: Boolean(form.phoneNumber.trim() && form.email.trim()),
      },
      {
        id: "details",
        label: "Business details",
        done: Boolean(form.websiteUrl.trim() && form.description.trim()),
      },
      {
        id: "location",
        label: "Location information",
        done: Boolean(
          form.city.trim() &&
            form.state.trim() &&
            form.country.trim() &&
            form.postalCode.trim() &&
            Number.parseInt(form.branchCount, 10) >= 1,
        ),
      },
    ];
    const doneCount = items.filter((item) => item.done).length;
    const percent = Math.round((doneCount / items.length) * 100);
    return { items, percent, complete: percent === 100 };
  }, [form, logoSrc]);

  const descriptionText = form.description.trim();
  const locationBadge = [form.city.trim(), form.state.trim()]
    .filter(Boolean)
    .join(", ");
  const branchLabel = `${form.branchCount} ${
    Number(form.branchCount) === 1 ? "branch" : "branches"
  }`;
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

  const profileHeader = (
      <section
        className={`relative overflow-hidden ${cardClass} px-3.5 py-3 sm:px-5 sm:py-3.5`}
      >
        <div className="relative mb-3 min-w-0">
          <p className="m-0 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#1464ff]">
            — Business profile
          </p>
          <h1 className="m-0 mt-0.5 text-[1.25rem] font-extrabold tracking-tight text-[#101a35] sm:text-[1.35rem] xl:text-[1.5rem]">
            {previewMeta.title}
          </h1>
          <p className="m-0 mt-0.5 text-[0.8rem] text-[#7183a4] sm:text-[0.82rem]">
            {previewMeta.subtitle}
          </p>
        </div>

        <div className="relative grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
            <div
              id="business-settings-logo"
              className="relative size-[4.25rem] shrink-0 sm:size-[4.75rem] xl:size-[5.25rem]"
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
                    className="size-7 text-slate-300"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                )}
              </span>
              <button
                type="button"
                onClick={openEditModal}
                aria-label="Update business logo"
                className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full bg-[#09b66f] text-white shadow-[0_4px_10px_rgba(9,182,111,0.3)] ring-2 ring-white transition hover:brightness-105"
              >
                <Camera className="size-3" strokeWidth={2.25} aria-hidden />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <p className="m-0 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#7183a4]">
                Business name
              </p>
              <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="m-0 max-w-full truncate text-[1.1rem] font-extrabold tracking-tight text-[#101a35] sm:text-[1.2rem] xl:text-[1.3rem]">
                  {displayName}
                </h2>
                {isBusinessActive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[0.65rem] font-bold text-[#15803d] ring-1 ring-[#bbf7d0]">
                    <span
                      className="size-1.5 rounded-full bg-[#22c55e]"
                      aria-hidden
                    />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[0.65rem] font-bold text-amber-700 ring-1 ring-amber-200">
                    <span
                      className="size-1.5 rounded-full bg-amber-500"
                      aria-hidden
                    />
                    Inactive
                  </span>
                )}
              </div>
              {descriptionText ? (
                <p className="m-0 mt-1 line-clamp-2 text-[0.8rem] leading-snug text-[#7183a4] sm:line-clamp-1 sm:text-[0.82rem]">
                  {descriptionText}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e8edf5] bg-[#f8faff] px-2.5 py-2 sm:px-3 sm:py-2.5">
              <div className="flex items-center gap-1.5">
                <UtensilsCrossed
                  className="size-3.5 shrink-0 text-[#1464ff]"
                  strokeWidth={2.25}
                  aria-hidden
                />
                <p className="m-0 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-[#94a3b8]">
                  Type
                </p>
              </div>
              <p className="m-0 mt-1 truncate text-[0.78rem] font-bold text-[#101a35] sm:text-[0.8rem]">
                {businessTypeLabel}
              </p>
            </div>
            <div className="rounded-xl border border-[#e8edf5] bg-[#f8faff] px-2.5 py-2 sm:px-3 sm:py-2.5">
              <div className="flex items-center gap-1.5">
                <MapPin
                  className="size-3.5 shrink-0 text-[#1464ff]"
                  strokeWidth={2.25}
                  aria-hidden
                />
                <p className="m-0 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-[#94a3b8]">
                  Location
                </p>
              </div>
              <p className="m-0 mt-1 truncate text-[0.78rem] font-bold text-[#101a35] sm:text-[0.8rem]">
                {locationBadge || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-[#e8edf5] bg-[#f8faff] px-2.5 py-2 sm:px-3 sm:py-2.5">
              <div className="flex items-center gap-1.5">
                <Building2
                  className="size-3.5 shrink-0 text-[#1464ff]"
                  strokeWidth={2.25}
                  aria-hidden
                />
                <p className="m-0 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-[#94a3b8]">
                  Branches
                </p>
              </div>
              <p
                id="business-settings-branch"
                className="m-0 mt-1 truncate text-[0.78rem] font-bold text-[#101a35] sm:text-[0.8rem]"
              >
                {branchLabel}
              </p>
            </div>
          </div>
        </div>
      </section>
  );

  const profileDetails = (
      <section
        ref={detailsRef}
        id="business-details"
        className={`scroll-mt-24 flex min-h-0 flex-col ${cardClass} px-4 py-4 sm:px-6 sm:py-6 xl:h-full xl:px-8 xl:py-9`}
      >
        <header className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#1464ff] sm:size-10">
              <FileText className="size-4 sm:size-5" strokeWidth={2.25} aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="m-0 text-[1rem] font-bold text-[#101a35] sm:text-[1.05rem]">
                Business details
              </h3>
              <p className="m-0 mt-0.5 text-[0.78rem] text-[#7183a4] sm:text-[0.8rem]">
                Core information about your business
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openEditModal}
            className="inline-flex h-10 w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#bfdbfe] bg-white px-3.5 text-[0.82rem] font-semibold text-[#1464ff] transition hover:bg-[#eff6ff] sm:w-auto"
          >
            <Pencil className="size-3.5" strokeWidth={2.25} aria-hidden />
            Edit Details
          </button>
        </header>

        <div className="mt-2 grid min-h-0 flex-1 grid-cols-1 gap-x-8 sm:grid-cols-2">
          <div className="flex min-h-0 min-w-0 flex-col">
            <BusinessDetailRow
              label="Business name"
              htmlFor="business-settings-name"
              value={displayOrDash(form.name)}
            />
            <BusinessDetailRow
              label="Currency"
              htmlFor="business-settings-currency"
              value={displayOrDash(business?.currency ?? "")}
            />
            <BusinessDetailRow
              label="Email address"
              htmlFor="business-settings-email"
              value={displayOrDash(form.email)}
              href={emailHref}
            />
            <BusinessDetailRow
              label="City"
              htmlFor="business-settings-city"
              value={displayOrDash(form.city)}
            />
            <BusinessDetailRow
              label="Country"
              htmlFor="business-settings-country"
              value={displayOrDash(form.country)}
              showDivider={false}
            />
          </div>
          <div className="flex min-h-0 min-w-0 flex-col">
            <BusinessDetailRow
              label="Business type"
              htmlFor="business-settings-type"
              value={businessTypeLabel}
            />
            <BusinessDetailRow
              label="Phone number"
              htmlFor="business-settings-phone"
              value={displayOrDash(form.phoneNumber)}
              href={phoneHref}
            />
            <BusinessDetailRow
              label="Website"
              htmlFor="business-settings-website"
              value={displayOrDash(websiteHref)}
              href={websiteValid ? websiteHref : null}
            />
            <BusinessDetailRow
              label="State"
              htmlFor="business-settings-state"
              value={displayOrDash(form.state)}
            />
            <BusinessDetailRow
              label="Postal code"
              htmlFor="business-settings-address"
              value={displayOrDash(form.postalCode)}
              showDivider={false}
            />
          </div>
        </div>

      </section>
  );

  return (
    <div className="business-profile-fit flex min-h-full w-full min-w-0 flex-col bg-[#f1f5fb]/40">
      <BusinessProfileEditModal
        open={editOpen}
        businessId={businessId}
        onClose={() => setEditOpen(false)}
      />

      {previewSection === "members" ? (
        <header className="relative mb-4 shrink-0 pt-1">
          <h1 className="m-0 text-[1.5rem] font-extrabold tracking-tight text-[#101a35] xl:text-[1.7rem]">
            {previewMeta.title}
          </h1>
          <p className="m-0 mt-1 text-[0.88rem] text-[#7183a4]">
            {previewMeta.subtitle}
          </p>
        </header>
      ) : null}

      <div
        className={`flex min-w-0 flex-col gap-4 pb-4 ${
          isProfileView ? "" : "min-h-0 flex-1"
        }`}
      >
        {isProfileView ? (
          <>
            {profileHeader}
            <div className="grid min-w-0 items-stretch gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_16.5rem]">
              {profileDetails}
              <aside className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:h-full xl:flex-col">
                <section className={`shrink-0 ${cardClass} px-3.5 py-3 sm:px-4`}>
                  <header className="flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f1ff] text-[#1464ff]">
                      <Zap className="size-3.5" strokeWidth={2.25} aria-hidden />
                    </span>
                    <h3 className="m-0 text-[0.82rem] font-bold text-[#101a35]">
                      Quick actions
                    </h3>
                  </header>
                  <div className="mt-2 space-y-0.5">
                    <QuickActionRow
                      href={businessSettingsHref(businessId, "members")}
                      title="Manage members"
                    />
                    <QuickActionRow
                      href={businessSettingsHref(businessId, "integrations")}
                      title="Integrations"
                    />
                  </div>
                </section>

                <section className={`shrink-0 ${cardClass} px-3.5 py-3 sm:px-4`}>
                  <header className="flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f3e8ff] text-[#8b5cf6]">
                      <Sparkles
                        className="size-3.5"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </span>
                    <h3 className="m-0 text-[0.82rem] font-bold text-[#101a35]">
                      Business summary
                    </h3>
                  </header>
                  <div className="mt-2 space-y-0.5">
                    <SummaryStatRow
                      label="Total campaigns"
                      value={formatCount(totalCampaigns)}
                    />
                    <SummaryStatRow
                      label="Total customers"
                      value={formatCount(totalCustomers)}
                    />
                    <SummaryStatRow
                      label="Active automations"
                      value={formatCount(activeAutomations)}
                    />
                  </div>
                </section>

                <section className="relative flex min-h-0 flex-col overflow-hidden rounded-[1.15rem] border border-[#d7ede4] bg-[linear-gradient(145deg,#ffffff_0%,#f3fbf7_100%)] px-3.5 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.045)] sm:col-span-2 sm:px-4 sm:py-4 xl:mt-auto xl:min-h-[11.5rem] xl:flex-1 xl:py-5">
                  <header className="relative flex shrink-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#dcfce7] text-[#09b66f]">
                        <Check
                          className="size-3.5"
                          strokeWidth={2.75}
                          aria-hidden
                        />
                      </span>
                      <h3 className="m-0 truncate text-[0.82rem] font-bold text-[#101a35]">
                        Profile completion
                      </h3>
                    </div>
                    {profileCompletion.complete ? (
                      <span className="inline-flex shrink-0 rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[0.62rem] font-bold text-[#15803d] ring-1 ring-[#bbf7d0]">
                        All set!
                      </span>
                    ) : null}
                  </header>

                  <div className="relative mt-3 flex min-h-0 flex-1 items-center gap-3">
                    <ProfileCompletionRing
                      percent={profileCompletion.percent}
                      size={64}
                    />
                    <ul className="m-0 flex min-h-0 min-w-0 flex-1 list-none flex-col justify-evenly gap-1.5 p-0">
                      {profileCompletion.items.map((item) => (
                        <li key={item.id} className="flex items-center gap-1.5">
                          <span
                            className={`flex size-3.5 shrink-0 items-center justify-center rounded-full ${
                              item.done
                                ? "bg-[#09b66f] text-white"
                                : "bg-[#e2e8f0] text-transparent"
                            }`}
                            aria-hidden
                          >
                            <Check className="size-2" strokeWidth={3} />
                          </span>
                          <span
                            className={`truncate text-[0.7rem] font-semibold ${
                              item.done ? "text-[#101a35]" : "text-[#94a3b8]"
                            }`}
                          >
                            {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </aside>
            </div>
          </>
        ) : (
          previewMain
        )}
      </div>
    </div>
  );
}

function QuickActionRow({
  href,
  title,
}: {
  href: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl bg-transparent px-1 py-1.5 no-underline transition hover:bg-[#f8faff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1464ff]"
    >
      <span className="min-w-0 flex-1 truncate text-[0.78rem] font-semibold text-[#101a35]">
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
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-transparent px-1 py-1.5">
      <span className="min-w-0 flex-1 truncate text-[0.8rem] font-semibold text-[#101a35]">
        {label}
      </span>
      <span className="shrink-0 text-[0.86rem] font-bold text-[#101a35]">
        {value}
      </span>
    </div>
  );
}
