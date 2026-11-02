"use client";

import dynamic from "next/dynamic";
import { BusinessProfileEditModal } from "@/app/components/business/BusinessProfileEditModal";
import { BusinessDetailsCard } from "@/app/components/business/business-profile/BusinessDetailsCard";
import { BusinessProfileHero } from "@/app/components/business/business-profile/BusinessProfileHero";
import { BusinessProfileSidePanel } from "@/app/components/business/business-profile/BusinessProfileSidePanel";
import { BusinessProfileSkeleton } from "@/app/components/business/business-profile/BusinessProfileSkeleton";
import { useBusinessByIdQuery } from "@/app/hooks/use-business-by-id-query";
import { businessSettingsHref } from "@/app/lib/business-settings-routes";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";
import { isValidOptionalHttpsWebsiteUrl } from "@/app/lib/website-url";
import { AlertCircle, ArrowLeft } from "lucide-react";
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
  "flex h-full flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_14px_40px_rgba(14,24,43,0.06)]";

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

  const isBusinessActive =
    business?.owner?.isActive !== false && Boolean(business);

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
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#eef2f7] px-4 py-3 sm:px-5">
        <Link
          href={businessSettingsHref(businessId, "general")}
          className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-[#1877f2] no-underline hover:underline"
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

  return (
    <div className="business-profile-fit flex min-h-full w-full min-w-0 flex-col">
      <BusinessProfileEditModal
        open={editOpen}
        businessId={businessId}
        onClose={() => setEditOpen(false)}
      />

      {previewSection === "members" ? (
        <header className="relative mb-5 shrink-0 pt-1">
          <h1 className="m-0 text-[1.5rem] font-extrabold tracking-tight text-[#07111f]">
            {previewMeta.title}
          </h1>
          <p className="m-0 mt-1 text-sm text-slate-500">
            {previewMeta.subtitle}
          </p>
        </header>
      ) : null}

      <div
        className={`flex min-w-0 flex-col gap-5 pb-5 ${
          isProfileView ? "" : "min-h-0 flex-1"
        }`}
      >
        {isProfileView ? (
          <>
            <BusinessProfileHero
              displayName={displayName}
              descriptionText={descriptionText}
              logoSrc={logoSrc}
              isBusinessActive={isBusinessActive}
              businessTypeLabel={businessTypeLabel}
              locationBadge={locationBadge}
              branchLabel={branchLabel}
              onEdit={openEditModal}
              onEditLogo={openEditModal}
            />

            <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,20rem)]">
              <div className="min-h-0 h-full min-w-0">
                <BusinessDetailsCard
                  detailsRef={detailsRef}
                  displayName={displayOrDash(form.name)}
                  businessTypeLabel={businessTypeLabel}
                  currencyLabel={displayOrDash(business?.currency ?? "")}
                  phoneDisplay={displayOrDash(form.phoneNumber)}
                  phoneHref={phoneHref}
                  emailDisplay={displayOrDash(form.email)}
                  emailHref={emailHref}
                  websiteDisplay={displayOrDash(websiteHref)}
                  websiteHref={websiteValid ? websiteHref : null}
                  branchLabel={branchLabel}
                  city={displayOrDash(form.city)}
                  state={displayOrDash(form.state)}
                  country={displayOrDash(form.country)}
                  postalCode={displayOrDash(form.postalCode)}
                  description={descriptionText}
                />
              </div>

              <div className="min-h-0 h-full min-w-0">
                <BusinessProfileSidePanel
                  businessId={businessId}
                  totalCampaigns={formatCount(totalCampaigns)}
                  totalCustomers={formatCount(totalCustomers)}
                  activeAutomations={formatCount(activeAutomations)}
                  completionPercent={profileCompletion.percent}
                  completionComplete={profileCompletion.complete}
                  completionItems={profileCompletion.items}
                />
              </div>
            </div>
          </>
        ) : (
          previewMain
        )}
      </div>
    </div>
  );
}
