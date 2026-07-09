import type { OnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";

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

export function resolveCompletedStepRedirect(
  status: OnboardingStatus,
  step: "business_creation",
): string | null {
  if (step === "business_creation" && status.businessCreated) {
    if (status.onboardingCompleted) {
      return null;
    }
    return resolvePostLoginPath(status);
  }

  return null;
}
