import { businessSettingsHref } from "@/app/lib/business-settings-routes";
import type { AdminBusiness } from "@/app/services/business/get-my-business";

export type ProfileSetupStep = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

export type BusinessProfileSetup = {
  steps: ProfileSetupStep[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  firstIncompleteHref: string | null;
};

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

/** Builds Profile Setup checklist from fields required for business setup. */
export function getBusinessProfileSetup(
  business: AdminBusiness,
  overrides?: {
    metaConnected?: boolean;
    stripeConnected?: boolean;
  },
): BusinessProfileSetup {
  const businessId =
    typeof business.id === "number" && business.id >= 1 ? business.id : null;

  const generalHref =
    businessId != null ? businessSettingsHref(businessId, "general") : "/dashboard";
  const integrationsHref =
    businessId != null
      ? businessSettingsHref(businessId, "integrations")
      : "/dashboard";

  const stripeDone =
    overrides?.stripeConnected ?? hasText(business.stripeAccountId);
  const metaDone =
    overrides?.metaConnected ?? hasText(business.metaUserId);

  const steps: ProfileSetupStep[] = [
    {
      id: "business-information",
      label: "Business Information",
      done: hasText(business.name) && hasText(business.description),
      href: generalHref,
    },
    {
      id: "business-logo",
      label: "Business Logo",
      done: hasText(business.logoUrl),
      href: generalHref,
    },
    {
      id: "contact-details",
      label: "Contact Details",
      done: hasText(business.email) && hasText(business.phoneNumber),
      href: generalHref,
    },
    {
      id: "address",
      label: "Address",
      done: hasText(business.city),
      href: generalHref,
    },
    {
      id: "branch",
      label: "At least one Branch",
      done: (business.branchCount ?? 0) > 0,
      href: generalHref,
    },
    {
      id: "stripe",
      label: "Stripe Connected",
      done: stripeDone,
      href: integrationsHref,
    },
    {
      id: "meta-ads",
      label: "Meta Ads Connected",
      done: metaDone,
      href: integrationsHref,
    },
  ];

  const completedCount = steps.filter((step) => step.done).length;
  const totalCount = steps.length;
  const progressPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const firstIncomplete = steps.find((step) => !step.done);

  return {
    steps,
    completedCount,
    totalCount,
    progressPercent,
    firstIncompleteHref: firstIncomplete?.href ?? null,
  };
}
