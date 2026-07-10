import type { OnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { getOnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";
import { getMyUserSubscription } from "@/app/services/subscription/user-subscription";

function isPaidSubscriptionStatus(status: string | null | undefined): boolean {
  const normalized = status?.trim().toLowerCase();
  return normalized === "active" || normalized === "trialing";
}

function isSafeReturnPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.startsWith("/auth/login")) return false;
  if (path.startsWith("/auth/signup")) return false;
  return true;
}

export function resolvePostLoginPath(
  status: OnboardingStatus,
  returnTo?: string | null,
): string {
  if (
    status.onboardingCompleted &&
    returnTo &&
    isSafeReturnPath(returnTo)
  ) {
    return returnTo;
  }

  return status.redirectPath;
}

export function resolvePostAuthPath(
  status: OnboardingStatus,
  returnTo?: string | null,
): string {
  if (status.onboardingCompleted) {
    return resolvePostLoginPath(status, returnTo);
  }

  if (!status.subscriptionSelected) {
    return "/auth/select-plan";
  }

  if (!status.businessCreated) {
    return "/business/register";
  }

  return resolvePostLoginPath(status, returnTo);
}

export async function fetchAuthenticatedOnboardingDestination(
  returnTo?: string | null,
): Promise<string> {
  try {
    const status = await getOnboardingStatus();
    if (status.subscriptionSelected) {
      return resolvePostAuthPath(status, returnTo);
    }
  } catch {
    // Fall back to direct subscription lookup below.
  }

  try {
    const subscription = await getMyUserSubscription();
    if (isPaidSubscriptionStatus(subscription?.status)) {
      return "/business/register";
    }
  } catch {
    // Ignore and send user to plan selection.
  }

  return "/auth/select-plan";
}

export function resolveCompletedStepRedirect(
  status: OnboardingStatus,
  step: "plan_selection" | "business_creation",
): string | null {
  if (step === "plan_selection" && status.subscriptionSelected) {
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
