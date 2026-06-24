import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";

export type CheckoutSessionDetails = {
  customerId: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  funnelId: number;
  restaurantId: number;
  campaignId: number | null;
  funnelPaymentId: number | null;
};

export type CreateCheckoutSessionResponse = {
  token: string;
  checkoutUrl: string;
  session: CheckoutSessionDetails;
};

export async function getCheckoutSession(
  token: string,
): Promise<CheckoutSessionDetails> {
  const normalized = token.trim();
  if (!normalized) {
    throw new Error("Checkout link is missing or invalid.");
  }

  const params = new URLSearchParams({ token: normalized });
  const res = await fetch(
    `${getApiBaseUrl()}/payment/checkout/resume?${params.toString()}`,
    { method: "GET", cache: "no-store" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "This checkout link is invalid or has expired.",
      ),
    );
  }

  return (await res.json()) as CheckoutSessionDetails;
}

export async function createCheckoutSession(input: {
  customerId: number;
  funnelId: number;
  restaurantId: number;
  campaignId?: number | null;
}): Promise<CreateCheckoutSessionResponse> {
  const res = await fetch(`${getApiBaseUrl()}/payment/checkout/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerId: input.customerId,
      funnelId: input.funnelId,
      restaurantId: input.restaurantId,
      ...(input.campaignId != null ? { campaignId: input.campaignId } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not start checkout session."),
    );
  }

  return (await res.json()) as CreateCheckoutSessionResponse;
}

/** Turn backend checkout URL into an in-app path (pathname + search). */
export function checkoutUrlToAppPath(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    return `${url.pathname}${url.search}`;
  } catch {
    return checkoutUrl.startsWith("/") ? checkoutUrl : `/${checkoutUrl}`;
  }
}
