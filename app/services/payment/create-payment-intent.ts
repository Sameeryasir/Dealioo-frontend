import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { isPositiveInt } from "@/app/lib/numbers";

export type CreatePaymentIntentPayload = {
  funnelId: number;
  restaurantId: number;
  currency: string;
  customerEmail: string;
  customerId?: number;
  checkoutSessionToken?: string;
};

export type CreatePaymentIntentResponse = {
  clientSecret?: string;
  paymentIntentId?: string;
  stripePaymentIntentId?: string;
  paymentId?: number;
  status?: string;
  stripeAccountId?: string;
  reused?: boolean;
  /** Payment already succeeded in Stripe — do not call confirmCardPayment again. */
  alreadyCompleted?: boolean;
};

type CreatePaymentIntentRequestBody = {
  funnelId: number;
  restaurantId: number;
  currency: string;
  customerEmail: string;
  customerId?: number;
  checkoutSessionToken?: string;
};

function readPaymentIntentId(
  res: CreatePaymentIntentResponse,
): string | undefined {
  return (
    res.paymentIntentId?.trim() ||
    res.stripePaymentIntentId?.trim() ||
    undefined
  );
}

function assertPayload(
  payload: CreatePaymentIntentPayload,
): CreatePaymentIntentRequestBody {
  if (!isPositiveInt(payload.funnelId)) {
    throw new Error("Funnel id is required.");
  }
  if (!isPositiveInt(payload.restaurantId)) {
    throw new Error("Restaurant is required.");
  }
  const currency = payload.currency?.trim().toLowerCase();
  if (!currency) {
    throw new Error("Currency is required.");
  }
  const customerEmail = payload.customerEmail?.trim();
  if (!customerEmail) {
    throw new Error("Customer email is required.");
  }

  return {
    funnelId: payload.funnelId,
    restaurantId: payload.restaurantId,
    currency,
    customerEmail,
    ...(isPositiveInt(payload.customerId)
      ? { customerId: payload.customerId }
      : {}),
    ...(payload.checkoutSessionToken?.trim()
      ? { checkoutSessionToken: payload.checkoutSessionToken.trim() }
      : {}),
  };
}

/** Platform fee and charge amount are calculated on the server only. */
export async function createPaymentIntent(
  payload: CreatePaymentIntentPayload,
  accessToken?: string,
): Promise<CreatePaymentIntentResponse> {
  const body = assertPayload(payload);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (accessToken?.trim()) {
    headers.Authorization = `Bearer ${accessToken.trim()}`;
  }

  const res = await fetch(`${getApiBaseUrl()}/payment/intent`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not create payment intent."),
    );
  }

  const json = (await res.json()) as CreatePaymentIntentResponse;
  return {
    ...json,
    paymentIntentId: readPaymentIntentId(json),
  };
}
