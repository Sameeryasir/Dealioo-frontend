"use client";

import {
  BarChart3,
  Building2,
  CreditCard,
  Link2,
  ScanLine,
  User,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { clearSetupUser } from "@/app/lib/setup-user";
import { isAdminOrSuperAdminUser } from "@/app/lib/is-admin-or-super-admin-user";
import type { BusinessProfilePreviewSection } from "@/app/components/business/BusinessGeneralSettingsForm";
import { businessQueryKeys } from "@/app/services/business/business-query-keys";
import { getBusinessTwilioPhoneNumbers } from "@/app/services/business/twilio-phone-numbers";
import {
  businessSettingsHref,
  orgSettingsHref,
  type BusinessSettingsSection,
} from "@/app/lib/business-settings-routes";
import { DASHBOARD_KPI_ICON } from "@/app/lib/dashboard-brand-tones";
import { logoutSession } from "@/app/services/auth/logout";

const BusinessGeneralSettingsForm = dynamic(
  () =>
    import("@/app/components/business/BusinessGeneralSettingsForm").then(
      (mod) => mod.BusinessGeneralSettingsForm,
    ),
  { ssr: false },
);
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
const OwnerProfileForm = dynamic(
  () =>
    import("@/app/components/profile/OwnerProfileForm").then(
      (mod) => mod.OwnerProfileForm,
    ),
  { ssr: false },
);
const OwnerSubscriptionSection = dynamic(
  () =>
    import("@/app/components/profile/OwnerSubscriptionSection").then(
      (mod) => mod.OwnerSubscriptionSection,
    ),
  { ssr: false },
);

const DASHBOARD_HREF = "/dashboard" as const;

type SectionId = BusinessSettingsSection;

type NavItem = {
  id: SectionId;
  label: string;
  icon: typeof User;
  tone: keyof typeof DASHBOARD_KPI_ICON;
};

const accountNav: NavItem[] = [
  { id: "account", label: "Account", icon: User, tone: "blue" },
  { id: "billing", label: "Subscription & Billing", icon: CreditCard, tone: "blue" },
];

const billingNav: NavItem[] = [
  { id: "billing", label: "Subscription & Billing", icon: CreditCard, tone: "blue" },
];

const organizationNav: NavItem[] = [
  { id: "general", label: "Business profile", icon: Building2, tone: "blue" },
  { id: "members", label: "Team", icon: Users, tone: "green" },
  { id: "integrations", label: "Integrations", icon: Link2, tone: "pink" },
  { id: "usage", label: "Usage", icon: BarChart3, tone: "orange" },
  { id: "scanning", label: "Scanning", icon: ScanLine, tone: "blue" },
];

const sectionTitles: Record<SectionId, string> = {
  account: "Account",
  billing: "Subscription & Billing",
  general: "Business profile",
  members: "Team",
  integrations: "Integrations",
  usage: "Usage",
  scanning: "Scanning",
};

type BusinessSettingsPanelProps = {
  section: SectionId;
  businessId?: number;
};

export function BusinessSettingsPanel({
  section,
  businessId,
}: BusinessSettingsPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const settingsFocus = searchParams.get("focus")?.trim().toLowerCase() || "";
  const canManageBilling = isAdminOrSuperAdminUser();
  const visibleAccountNav = accountNav.filter(
    (item) => item.id !== "billing" || canManageBilling,
  );
  const visibleBillingNav = canManageBilling ? billingNav : [];

  useEffect(() => {
    if (section !== "scanning" || businessId == null) return;
    router.replace(`/business/${businessId}/dashboard/scanning`);
  }, [section, businessId, router]);

  useEffect(() => {
    if (businessId == null) return;
    if (section === "integrations" || section === "members") return;
    void queryClient.prefetchQuery({
      queryKey: businessQueryKeys.twilioPhoneNumbers(businessId),
      queryFn: () => getBusinessTwilioPhoneNumbers(businessId),
      staleTime: 5 * 60_000,
    });
  }, [businessId, queryClient, section]);

  const handleSignOut = useCallback(async () => {
    await logoutSession();
    clearSetupUser();
    router.push("/auth/login");
  }, [router]);

  const settingsHref = useCallback(
    (targetSection: SectionId) => {
      if (businessId != null) {
        return businessSettingsHref(businessId, targetSection);
      }
      return orgSettingsHref(targetSection);
    },
    [businessId],
  );

  const navLink = (item: NavItem) => {
    const Icon = item.icon;
    const selected = section === item.id;
    const hoverBorder =
      item.tone === "pink"
        ? "hover:border-[#e1306c]/35"
        : item.tone === "green"
          ? "hover:border-[#34a853]/35"
          : item.tone === "orange"
            ? "hover:border-[#f77737]/35"
            : "hover:border-[#1877f2]/35";

    return (
      <Link
        key={item.id}
        href={settingsHref(item.id)}
        className={`flex items-center gap-2.5 rounded-[0.95rem] border px-2.5 py-2.5 text-left text-sm font-semibold no-underline transition duration-200 ${
          selected
            ? "border-[#1877f2]/30 bg-[#1877f2]/[0.07] text-[#1877f2] shadow-[0_4px_14px_rgba(24,119,242,0.12)]"
            : `border-[#e8edf5] bg-white text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.03)] ${hoverBorder}`
        }`}
        aria-current={selected ? "page" : undefined}
      >
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
            selected ? DASHBOARD_KPI_ICON[item.tone] : DASHBOARD_KPI_ICON[item.tone]
          }`}
        >
          <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      </Link>
    );
  };

  if (section === "scanning" && businessId != null) {
    return null;
  }

  const profilePreviewSections: BusinessProfilePreviewSection[] = [
    "general",
    "members",
    "integrations",
  ];
  if (
    businessId != null &&
    profilePreviewSections.includes(section as BusinessProfilePreviewSection)
  ) {
    const activeSection = section as BusinessProfilePreviewSection;
    return (
      <section
        className="rd-premium rd-premium--fill business-profile-page"
        aria-label={sectionTitles[activeSection]}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-0.5 py-0.5 sm:px-1">
          <BusinessGeneralSettingsForm
            businessId={businessId}
            activeSection={activeSection}
            focus={settingsFocus}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="rd-premium rd-premium--fill" aria-label="Settings">
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(14.5rem,16.5rem)_minmax(0,1fr)] lg:items-stretch">
        <aside className="relative flex flex-col overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white px-3.5 py-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]">
          <span
            className="pointer-events-none absolute -top-8 left-1/2 size-28 -translate-x-1/2 rounded-full bg-[#1877f2]/10 blur-3xl"
            aria-hidden
          />
          <p className="relative m-0 text-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">
            Menu
          </p>

          <div className="relative mt-3 flex flex-col gap-3">
            {businessId != null ? (
              <div>
                <p className="mb-2 px-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Organization
                </p>
                <div className="flex flex-col gap-2">
                  {organizationNav.map(navLink)}
                </div>
              </div>
            ) : null}
            {businessId == null ? (
              <div>
                <p className="mb-2 px-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Account
                </p>
                <div className="flex flex-col gap-2">{visibleAccountNav.map(navLink)}</div>
              </div>
            ) : visibleBillingNav.length > 0 ? (
              <div>
                <p className="mb-2 px-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Account
                </p>
                <div className="flex flex-col gap-2">{visibleBillingNav.map(navLink)}</div>
              </div>
            ) : null}
            {businessId == null ? (
              <div>
                <p className="mb-2 px-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Organization
                </p>
                <div className="flex flex-col gap-2">
                  {organizationNav.map(navLink)}
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <article className="relative flex min-h-0 flex-col overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.02]">
          <header className="shrink-0 border-b border-[#e8edf5] bg-white px-5 py-4 sm:px-7 sm:py-5">
            <p className="m-0 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#1877f2]">
              {section === "billing" || businessId == null
                ? "Account"
                : "Organization"}
            </p>
            <h2 className="m-0 mt-1 text-[clamp(1.2rem,2vw,1.5rem)] font-extrabold tracking-tight text-slate-900">
              {sectionTitles[section]}
            </h2>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            {section === "members" && businessId != null ? (
              <BusinessMembersPanel businessId={businessId} embedded />
            ) : section === "billing" && !canManageBilling ? (
              <div className="max-w-xl rounded-[1.2rem] border border-[#e8edf5] bg-white p-6">
                <p className="m-0 text-sm font-semibold text-slate-900">
                  Only the account owner can manage billing.
                </p>
                <p className="m-0 mt-2 text-sm text-slate-600">
                  Ask the owner if you need invoices or card updates.
                </p>
              </div>
            ) : section === "billing" ? (
              <div className="max-w-5xl">
                <OwnerSubscriptionSection
                  variant="light"
                  layout="page"
                  showHeading={false}
                />
              </div>
            ) : section === "account" && businessId == null ? (
              <div className="flex max-w-3xl flex-col gap-8">
                <OwnerProfileForm variant="light" layout="compact" />
                <div className="flex flex-col gap-3 border-t border-[#e8edf5] pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      router.push(DASHBOARD_HREF);
                    }}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#1877f2]/25 bg-[#f8faff] px-4 py-3 text-sm font-medium text-[#1877f2] transition-colors hover:border-[#1877f2]/40 hover:bg-[#1877f2]/10"
                  >
                    <Building2 className="size-4 shrink-0" aria-hidden strokeWidth={2} />
                    Switch Organization
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="w-full cursor-pointer rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500 active:bg-red-700"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : section === "integrations" ? (
              businessId != null ? (
                <BusinessIntegrationsPanel
                  businessId={businessId}
                  focus={settingsFocus}
                />
              ) : (
                <p className="max-w-md text-sm leading-relaxed text-slate-500">
                  Open a business to manage Stripe, Meta, Google Ads, and Twilio.
                </p>
              )
            ) : (
              <p className="max-w-md text-sm leading-relaxed text-slate-500">
                {sectionTitles[section]} settings will be available here.
              </p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
