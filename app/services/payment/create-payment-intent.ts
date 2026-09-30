import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { isPositiveInt } from "@/app/lib/numbers";

export type CreatePaymentIntentPayload = {
  funnelId: number;
  businessId: number;
  customerEmail: string;
  checkoutSessionToken: string;
  currency?: string;
  customerId?: number;
};

export type CreatePaymentIntentResponse = {
  clientSecret?: string;
  paymentIntentId?: string;
  stripePaymentIntentId?: string;
  paymentId?: number;
  status?: string;
  stripeAccountId?: string;
  reused?: boolean;
  alreadyCompleted?: boolean;
};

type CreatePaymentIntentRequestBody = {
  funnelId: number;
  businessId: number;
  customerEmail: string;
  checkoutSessionToken: string;
  customerId?: number;
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

export async function createPaymentIntent(
  payload: CreatePaymentIntentPayload,
  accessToken?: string,
): Promise<CreatePaymentIntentResponse> {
  const body = assertPayload(payload);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const token = accessToken?.trim() ?? "";
  if (token.includes(".")) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${getApiBaseUrl()}/payment/intent`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not create payment intent."),
    );
  }

  const json = (await res.json()) as CreatePaymentIntentResponse & {
    checkoutSessionId?: string;
  };
  return {
    ...json,
    paymentIntentId: readPaymentIntentId(json),
  };
}
