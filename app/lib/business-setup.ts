/**
 * Change: Single calculator for Business Setup (8 equal steps + nextRecommendedStep).
 * Why: Stripe/Meta/Twilio are integrations, not profile fields — one source of truth for %.
 * Related: BusinessDashboardCard, BusinessSetupPopover, sanitize-business-list-item.ts
 * MCP Context 7: keep scoring equal-weight; do not mix with signup onboarding.
 */
import { businessSettingsHref } from "@/app/lib/business-settings-routes";
import type { AdminBusiness } from "@/app/services/business/get-my-business";

export type BusinessSetupGroupId =
  | "business_profile"
  | "operations"
  | "payments"
  | "marketing";

export type BusinessSetupStepId =
  | "business-information"
  | "business-logo"
  | "contact-details"
  | "address"
  | "branch"
  | "twilio-number"
  | "stripe"
  | "meta-ads";

export type BusinessSetupStep = {
  id: BusinessSetupStepId;
  label: string;
  done: boolean;
  href: string;
  group: BusinessSetupGroupId;
  ctaLabel: string;
};

export type BusinessSetupGroup = {
  id: BusinessSetupGroupId;
  label: string;
  steps: BusinessSetupStep[];
};

export type BusinessSetupRecommendedStep = {
  id: BusinessSetupStepId;
  label: string;
  href: string;
  ctaLabel: string;
};

export type BusinessSetup = {
  steps: BusinessSetupStep[];
  groups: BusinessSetupGroup[];
  completedCount: number;
  remainingCount: number;
  totalCount: number;
  progressPercent: number;
  isComplete: boolean;
  nextRecommendedStep: BusinessSetupRecommendedStep | null;
};

const GROUP_ORDER: BusinessSetupGroupId[] = [
  "business_profile",
  "operations",
  "payments",
  "marketing",
];

const GROUP_LABELS: Record<BusinessSetupGroupId, string> = {
  business_profile: "Business Profile",
  operations: "Operations",
  payments: "Payments",
  marketing: "Marketing",
};

/** Useful actions first — logo last (cosmetic). */
const RECOMMENDED_STEP_ORDER: BusinessSetupStepId[] = [
  "stripe",
  "twilio-number",
  "contact-details",
  "business-information",
  "address",
  "branch",
  "meta-ads",
  "business-logo",
];

export function hasNonEmptyText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function hasMeaningfulAddress(input: {
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
}): boolean {
  const city = input.city?.trim() ?? "";
  if (city.length < 2) return false;
  const extra = [input.state, input.country, input.postalCode].some((part) =>
    hasNonEmptyText(part),
  );
  return extra;
}

function isExplicitlyConnected(flag: boolean | null | undefined): boolean {
  return flag === true;
}

export function getBusinessSetup(
  business: AdminBusiness,
  overrides?: {
    metaConnected?: boolean;
    stripeConnected?: boolean;
    twilioConnected?: boolean;
  },
): BusinessSetup {
  const businessId =
    typeof business.id === "number" && business.id >= 1 ? business.id : null;

  const general = (focus: string) =>
    businessId != null
      ? businessSettingsHref(businessId, "general", { focus })
      : "/dashboard";
  const integrations = (focus: string) =>
    businessId != null
      ? businessSettingsHref(businessId, "integrations", { focus })
      : "/dashboard";

  const stripeDone =
    overrides?.stripeConnected ?? isExplicitlyConnected(business.stripeConnected);
  const metaDone =
    overrides?.metaConnected ?? isExplicitlyConnected(business.metaConnected);
  const twilioDone =
    overrides?.twilioConnected ??
    isExplicitlyConnected(business.twilioConnected);

  const steps: BusinessSetupStep[] = [
    {
      id: "business-information",
      label: "Business Information",
      ctaLabel: "Add business name",
      done: hasNonEmptyText(business.name),
      href: general("info"),
      group: "business_profile",
    },
    {
      id: "business-logo",
      label: "Business Logo",
      ctaLabel: "Upload logo",
      done: hasNonEmptyText(business.logoUrl),
      href: general("logo"),
      group: "business_profile",
    },
    {
      id: "contact-details",
      label: "Contact Details",
      ctaLabel: "Add contact details",
      done:
        hasNonEmptyText(business.email) && hasNonEmptyText(business.phoneNumber),
      href: general("contact"),
      group: "business_profile",
    },
    {
      id: "address",
      label: "Address",
      ctaLabel: "Add address",
      done: hasMeaningfulAddress(business),
      href: general("address"),
      group: "business_profile",
    },
    {
      id: "branch",
      label: "At least one Branch",
      ctaLabel: "Add a branch",
      done: (business.branchCount ?? 0) > 0,
      href: general("branch"),
      group: "operations",
    },
    {
      id: "twilio-number",
      label: "Twilio Number Selected",
      ctaLabel: "Select Twilio number",
      done: twilioDone,
      href: general("twilio"),
      group: "operations",
    },
    {
      id: "stripe",
      label: "Stripe Connected",
      ctaLabel: "Connect Stripe",
      done: stripeDone,
      href: integrations("stripe"),
      group: "payments",
    },
    {
      id: "meta-ads",
      label: "Meta Ads Connected",
      ctaLabel: "Connect Meta",
      done: metaDone,
      href: integrations("meta"),
      group: "marketing",
    },
  ];

  const completedCount = steps.filter((step) => step.done).length;
  const totalCount = steps.length;
  const remainingCount = Math.max(0, totalCount - completedCount);
  const progressPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const isComplete = remainingCount === 0 && totalCount > 0;

  const nextIncomplete = RECOMMENDED_STEP_ORDER.map((id) =>
    steps.find((step) => step.id === id && !step.done),
  ).find((step): step is BusinessSetupStep => Boolean(step));

  const nextRecommendedStep: BusinessSetupRecommendedStep | null =
    nextIncomplete
      ? {
          id: nextIncomplete.id,
          label: nextIncomplete.label,
          href: nextIncomplete.href,
          ctaLabel: nextIncomplete.ctaLabel,
        }
      : null;

  const groups: BusinessSetupGroup[] = GROUP_ORDER.map((groupId) => ({
    id: groupId,
    label: GROUP_LABELS[groupId],
    steps: steps.filter((step) => step.group === groupId),
  }));

  return {
    steps,
    groups,
    completedCount,
    remainingCount,
    totalCount,
    progressPercent,
    isComplete,
    nextRecommendedStep,
  };
}
