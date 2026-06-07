import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type OnboardingNextStep =
  | "restaurant_creation"
  | "two_factor"
  | "menu_setup"
  | null;

export type OnboardingStatus = {
  restaurantId: number | null;
  twoFactorCompleted: boolean;
  restaurantCreated: boolean;
  menuCreated: boolean;
  onboardingCompleted: boolean;
  nextStep: OnboardingNextStep;
  redirectPath: string;
};

export async function getOnboardingStatus(
  restaurantId?: number,
): Promise<OnboardingStatus> {
  const params = new URLSearchParams();
  if (restaurantId != null && Number.isFinite(restaurantId) && restaurantId >= 1) {
    params.set("restaurantId", String(restaurantId));
  }

  const query = params.toString();
  const url = `${getApiBaseUrl()}/onboarding/status${query ? `?${query}` : ""}`;

  const res = await authenticatedFetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      await parseApiMessageFromResponse(
        res,
        "Could not load onboarding status.",
      ),
    );
  }

  return (await res.json()) as OnboardingStatus;
}

async function parseApiMessageFromResponse(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (data && typeof data === "object" && "message" in data) {
      return parseApiMessage(
        (data as { message: unknown }).message,
        fallback,
      );
    }
  } catch {
  }
  return fallback;
}
