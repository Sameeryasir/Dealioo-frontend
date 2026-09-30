import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { isPositiveInt } from "@/app/lib/numbers";

export type CreatePaymentSessionPayload = {
  funnelId: number;
  businessId: number;
  customerEmail: string;
  checkoutSessionToken: string;
  currency?: string;
  customerId?: number;
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
  customerEmail: string;
  checkoutSessionToken: string;
  customerId?: number;
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
  const customerEmail = payload.customerEmail?.trim();
  if (!customerEmail) {
    throw new Error("Customer email is required.");
  }
  const checkoutSessionToken = payload.checkoutSessionToken?.trim();
  if (!checkoutSessionToken) {
    throw new Error("Checkout token is required.");
  }

  return {
    funnelId: payload.funnelId,
    businessId,
    customerEmail,
    checkoutSessionToken,
    ...(isPositiveInt(payload.customerId)
      ? { customerId: payload.customerId }
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
  const token = accessToken?.trim() ?? "";
  if (token.includes(".")) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${getApiBaseUrl()}/payment/session`, {
    method: "POST",
    credentials: "include",
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
