import type { OnboardingStatus } from "@/app/services/onboarding/get-onboarding-status";

function isSafeReturnPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.startsWith("/auth/login")) return false;
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

export function shouldSkipPasswordSetup(status: OnboardingStatus): boolean {
  return (
    status.twoFactorCompleted ||
    status.restaurantCreated ||
    status.menuCreated ||
    status.onboardingCompleted
  );
}

export function resolveCompletedStepRedirect(
  status: OnboardingStatus,
  step: "two_factor" | "menu_setup" | "restaurant_creation",
): string | null {
  if (step === "two_factor" && status.twoFactorCompleted) {
    return resolvePostLoginPath(status);
  }

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
