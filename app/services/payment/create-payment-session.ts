import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { isPositiveInt } from "@/app/lib/numbers";

export type CreatePaymentSessionPayload = {
  funnelId: number;
  businessId: number;
  currency: string;
  customerEmail: string;
  customerId?: number;
  checkoutSessionToken?: string;
};

export type CreatePaymentSessionResponse = {
  clientSecret?: string;
  checkoutSessionId?: string;
  paymentIntentId?: string;
  stripePaymentIntentId?: string;
  paymentId?: number;
  status?: string;
  stripeAccountId?: string;
  reused?: boolean;
  alreadyCompleted?: boolean;
};

type CreatePaymentSessionRequestBody = {
  funnelId: number;
  businessId: number;
  currency: string;
  customerEmail: string;
  customerId?: number;
  checkoutSessionToken?: string;
};

function assertPayload(
  payload: CreatePaymentSessionPayload,
): CreatePaymentSessionRequestBody {
  if (!isPositiveInt(payload.funnelId)) {
    throw new Error("Funnel id is required.");
  }
  const businessId = payload.businessId;
  if (!isPositiveInt(businessId)) {
    throw new Error("Business is required.");
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
    businessId,
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

export async function createPaymentSession(
  payload: CreatePaymentSessionPayload,
  accessToken?: string,
): Promise<CreatePaymentSessionResponse> {
  const body = assertPayload(payload);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (accessToken?.trim()) {
    headers.Authorization = `Bearer ${accessToken.trim()}`;
  }

  const res = await fetch(`${getApiBaseUrl()}/payment/session`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not create payment session."),
    );
  }

  return (await res.json()) as CreatePaymentSessionResponse;
}
