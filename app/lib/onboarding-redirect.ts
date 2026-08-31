import type { OnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import {
  getOnboardingStatus,
  invalidateOnboardingStatusCache,
} from "@/app/services/onboarding/get-onboarding-status";
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

async function loadOnboardingStatusWithRetry(): Promise<OnboardingStatus | null> {
  try {
    return await getOnboardingStatus();
  } catch {
  }

  invalidateOnboardingStatusCache();
  await new Promise((resolve) => setTimeout(resolve, 400));

  try {
    return await getOnboardingStatus();
  } catch {
    return null;
  }
}

export async function fetchAuthenticatedOnboardingDestination(): Promise<string> {
  if (isInvitedTeamUser()) {
    return "/dashboard";
  }

  const status = await loadOnboardingStatusWithRetry();
  if (status) {
    if (
      status.onboardingCompleted ||
      status.businessCreated ||
      status.subscriptionCompleted ||
      status.subscriptionSelected
    ) {
      return resolvePostAuthPath(status);
    }
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

  // Unknown / API flaky: prefer dashboard over wrongly forcing select-plan
  // for users who already finished onboarding (e.g. testdeveloper).
  return status ? "/auth/select-plan" : "/dashboard";
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
