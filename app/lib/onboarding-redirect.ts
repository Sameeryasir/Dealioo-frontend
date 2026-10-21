import type { OnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import {
  getOnboardingStatus,
  invalidateOnboardingStatusCache,
} from "@/app/services/onboarding/get-onboarding-status";
import { fetchMyBusinesses } from "@/app/services/business/get-my-business";
import { getMyUserSubscription } from "@/app/services/subscription/user-subscription";
import { isInvitedTeamUser } from "@/app/lib/is-invited-team-user";
import { isSuperAdminUser } from "@/app/lib/is-super-admin-user";

function isPaidSubscriptionStatus(status: string | null | undefined): boolean {
  const normalized = status?.trim().toLowerCase();
  return normalized === "active" || normalized === "trialing";
}

function isSelectPlanPath(path: string | null | undefined): boolean {
  return Boolean(path?.startsWith("/auth/select-plan"));
}

function requiresPaidSubscription(status: OnboardingStatus): boolean {
  if (status.subscriptionCompleted || status.subscriptionSelected) {
    return false;
  }
  return true;
}

export function resolvePostLoginPath(status: OnboardingStatus): string {
  if (isSuperAdminUser()) {
    return "/admin";
  }

  if (isInvitedTeamUser()) {
    return "/dashboard";
  }

  if (requiresPaidSubscription(status)) {
    return "/auth/select-plan";
  }

  const fullyIn = status.onboardingCompleted || status.businessCreated;

  if (fullyIn) {
    if (
      !status.redirectPath ||
      status.redirectPath.startsWith("/business/register") ||
      isSelectPlanPath(status.redirectPath)
    ) {
      return "/dashboard";
    }
    return status.redirectPath;
  }

  return status.redirectPath || "/business/register";
}

export function resolvePostAuthPath(status: OnboardingStatus): string {
  if (isSuperAdminUser()) {
    return "/admin";
  }

  if (isInvitedTeamUser()) {
    return "/dashboard";
  }

  if (requiresPaidSubscription(status)) {
    return "/auth/select-plan";
  }

  if (status.businessCreated || status.onboardingCompleted) {
    return resolvePostLoginPath(status);
  }

  if (status.redirectPath && !isSelectPlanPath(status.redirectPath)) {
    return status.redirectPath;
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
  if (isSuperAdminUser()) {
    return "/admin";
  }

  if (isInvitedTeamUser()) {
    return "/dashboard";
  }

  const status = await loadOnboardingStatusWithRetry();
  if (status) {
    return resolvePostAuthPath(status);
  }

  let businessListKnownEmpty = false;
  try {
    const list = await fetchMyBusinesses({ page: 1, limit: 1 });
    const count = list.meta?.total ?? list.data?.length ?? 0;
    businessListKnownEmpty = count === 0;
  } catch {
  }

  try {
    const subscription = await getMyUserSubscription();
    if (isPaidSubscriptionStatus(subscription?.status)) {
      return businessListKnownEmpty ? "/business/register" : "/dashboard";
    }
  } catch {
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

  if (
    step === "plan_selection" &&
    (status.subscriptionCompleted || status.subscriptionSelected)
  ) {
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
