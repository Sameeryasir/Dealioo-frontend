import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type UserSubscription = {
  id: string;
  planId: string;
  planSlug: string;
  planName: string;
  billingCycle: "monthly" | "annual";
  status: string;
  startedAt: string | null;
};

export type SelectUserPlanInput = {
  planSlug: string;
  billingCycle: "monthly" | "annual";
};

export type UserSubscriptionCheckout = {
  checkoutUrl: string;
  sessionId: string;
};

function normalizeUserSubscription(raw: unknown): UserSubscription | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  const planSlug =
    typeof record.planSlug === "string" ? record.planSlug.trim() : "";
  const planId = typeof record.planId === "string" ? record.planId.trim() : "";

  if (!planSlug || !planId) return null;

  return {
    id: typeof record.id === "string" ? record.id : "",
    planId,
    planSlug,
    planName:
      typeof record.planName === "string" ? record.planName : planSlug,
    billingCycle: record.billingCycle === "annual" ? "annual" : "monthly",
    status: typeof record.status === "string" ? record.status : "active",
    startedAt:
      typeof record.startedAt === "string" ? record.startedAt : null,
  };
}

function normalizeCheckout(raw: unknown): UserSubscriptionCheckout | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  const checkoutUrl =
    typeof record.checkoutUrl === "string" ? record.checkoutUrl.trim() : "";
  const sessionId =
    typeof record.sessionId === "string" ? record.sessionId.trim() : "";

  if (!checkoutUrl || !sessionId) return null;
  return { checkoutUrl, sessionId };
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

export async function getMyUserSubscription(): Promise<UserSubscription | null> {
  const res = await authenticatedFetch(`${getApiBaseUrl()}/user-subscriptions/me`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (res.status === 404 || res.status === 204) return null;

  if (!res.ok) {
    throw new Error(
      await parseApiMessageFromResponse(
        res,
        "Could not load your subscription.",
      ),
    );
  }

  const data: unknown = await res.json();
  if (data == null) return null;
  return normalizeUserSubscription(data);
}

export async function startUserPlanCheckout(
  input: SelectUserPlanInput,
): Promise<UserSubscriptionCheckout> {
  const res = await authenticatedFetch(`${getApiBaseUrl()}/user-subscriptions/checkout`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(
      await parseApiMessageFromResponse(
        res,
        "Could not start checkout for your plan.",
      ),
    );
  }

  const checkout = normalizeCheckout(await res.json());
  if (!checkout) {
    throw new Error("Could not start checkout for your plan.");
  }

  return checkout;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** Waits until the Stripe webhook activates the user's subscription. */
export async function waitForActiveUserSubscription(options?: {
  maxAttempts?: number;
  intervalMs?: number;
}): Promise<UserSubscription> {
  const maxAttempts = options?.maxAttempts ?? 30;
  const intervalMs = options?.intervalMs ?? 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const subscription = await getMyUserSubscription();
    if (subscription?.status === "active") {
      return subscription;
    }
    if (attempt < maxAttempts - 1) {
      await sleep(intervalMs);
    }
  }

  throw new Error(
    "Your payment was received but the subscription is not active yet. " +
      "If testing locally, run stripe listen --forward-to localhost:4001/api/payment/webhook " +
      "and set STRIPE_WEBHOOK_SECRET in the backend .env.",
  );
}

export async function completeUserPlanCheckout(
  sessionId: string,
): Promise<UserSubscription> {
  const params = new URLSearchParams({ session_id: sessionId });
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/user-subscriptions/complete?${params.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiMessageFromResponse(
        res,
        "Could not complete your subscription.",
      ),
    );
  }

  const subscription = normalizeUserSubscription(await res.json());
  if (!subscription) {
    throw new Error("Could not complete your subscription.");
  }

  return subscription;
}
