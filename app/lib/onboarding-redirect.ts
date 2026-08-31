import type { OnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { fetchMyBusinesses } from "@/app/services/business/get-my-business";
import { getMyUserSubscription } from "@/app/services/subscription/user-subscription";
import { isInvitedTeamUser } from "@/app/lib/is-invited-team-user";

function isPaidSubscriptionStatus(status: string | null | undefined): boolean {
  const normalized = status?.trim().toLowerCase();
  return normalized === "active" || normalized === "trialing";
}

export function resolvePostLoginPath(status: OnboardingStatus): string {
  if (isInvitedTeamUser()) {
    return "/dashboard";
  }

  const fullyIn =
    status.onboardingCompleted || status.businessCreated;

  if (fullyIn) {
    if (
      !status.redirectPath ||
      status.redirectPath.startsWith("/auth/select-plan") ||
      status.redirectPath.startsWith("/business/register")
    ) {
      return "/dashboard";
    }
    return status.redirectPath;
  }

  return status.redirectPath;
}

export function resolvePostAuthPath(status: OnboardingStatus): string {
  if (isInvitedTeamUser()) {
    return "/dashboard";
  }

  if (status.businessCreated || status.onboardingCompleted) {
    return resolvePostLoginPath(status);
  }

  if (status.redirectPath) {
    return status.redirectPath;
  }

  const hasSubscription =
    status.subscriptionCompleted || status.subscriptionSelected;

  if (!hasSubscription) {
    return "/auth/select-plan";
  }

  if (!status.businessCreated) {
    return "/business/register";
  }

  return resolvePostLoginPath(status);
}

export async function fetchAuthenticatedOnboardingDestination(): Promise<string> {
  if (isInvitedTeamUser()) {
    return "/dashboard";
  }

  try {
    const status = await getOnboardingStatus();

    if (
      status.onboardingCompleted ||
      status.businessCreated ||
      status.subscriptionCompleted ||
      status.subscriptionSelected
    ) {
      return resolvePostAuthPath(status);
    }
  } catch {
  }

  let businessListKnownEmpty = false;
  try {
    const list = await fetchMyBusinesses({ page: 1, limit: 1 });
    const count = list.meta?.total ?? list.data?.length ?? 0;
    if (count > 0) {
      return "/dashboard";
    }
    businessListKnownEmpty = true;
  } catch {
  }

  try {
    const subscription = await getMyUserSubscription();
    if (isPaidSubscriptionStatus(subscription?.status)) {
      return businessListKnownEmpty ? "/business/register" : "/dashboard";
    }
  } catch {
  }

  if (isInvitedTeamUser()) {
    return "/dashboard";
  }

  return "/auth/select-plan";
}

export function resolveCompletedStepRedirect(
  status: OnboardingStatus,
  step: "plan_selection" | "business_creation",
): string | null {
  if (isInvitedTeamUser()) {
    return "/dashboard";
  }

  if (step === "plan_selection" && (status.subscriptionCompleted || status.subscriptionSelected)) {
    return status.businessCreated ? null : "/business/register";
  }

  if (step === "business_creation" && status.businessCreated) {
    if (status.onboardingCompleted) {
      return null;
    }
    return resolvePostAuthPath(status);
  }

  return null;
}
