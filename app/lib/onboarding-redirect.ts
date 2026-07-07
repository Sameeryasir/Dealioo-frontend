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
  step: "menu_setup" | "restaurant_creation",
): string | null {
  if (step === "restaurant_creation" && status.restaurantCreated) {
    if (status.onboardingCompleted) {
      return null;
    }
    return resolvePostLoginPath(status);
  }

  if (step === "menu_setup" && status.menuCreated) {
    return status.redirectPath;
  }

  return null;
}
