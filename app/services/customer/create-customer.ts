import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type CreateCustomerPayload = {
  name: string;
  email: string;
  phone: string;
  rejectDuplicateEmail?: boolean;
  rejectDuplicatePhone?: boolean;
  businessId?: number;
};

export type CreateCustomerResponse = {
  id: number;
  isNewCustomer: boolean;
};

function readCustomerCreateResult(data: unknown): CreateCustomerResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid customer response from server.");
  }
  const o = data as Record<string, unknown>;
  const id =
    typeof o.id === "number"
      ? o.id
      : typeof o.customer === "object" &&
          o.customer !== null &&
          typeof (o.customer as { id?: unknown }).id === "number"
        ? (o.customer as { id: number }).id
        : null;
  if (id == null || !Number.isFinite(id) || id < 1) {
    throw new Error("Invalid customer response from server.");
  }
  return {
    id,
    isNewCustomer: o.isNewCustomer === true,
  };
}

function requireGuestFields(payload: {
  name?: string;
  email?: string;
  phone?: string;
}): void {
  if (!payload.name?.trim()) {
    throw new Error("Name is required.");
  }
  if (!payload.email?.trim()) {
    throw new Error("Email is required.");
  }
  if (!payload.phone?.trim()) {
    throw new Error("Phone is required.");
  }
}

export async function createCustomer(
  payload: CreateCustomerPayload,
): Promise<CreateCustomerResponse> {
  requireGuestFields(payload);

  const res = await fetch(`${getApiBaseUrl()}/customer/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: payload.name.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      ...(payload.rejectDuplicateEmail
        ? { rejectDuplicateEmail: true }
        : {}),
      ...(payload.rejectDuplicatePhone
        ? { rejectDuplicatePhone: true }
        : {}),
      ...(payload.businessId != null && payload.businessId > 0
        ? { businessId: payload.businessId }
        : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(await parseApiErrorMessage(res, "Could not create customer."));
  }

  const json: unknown = await res.json();
  return readCustomerCreateResult(json);
}

export async function createScannerGuest(
  businessId: number,
  payload: Pick<CreateCustomerPayload, "name" | "email" | "phone">,
): Promise<CreateCustomerResponse> {
  if (!Number.isFinite(businessId) || businessId < 1) {
    throw new Error("Invalid business.");
  }
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  requireGuestFields(payload);

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/customer/business/${businessId}/scanner/guests`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: payload.name.trim(),
        email: payload.email.trim(),
        phone: payload.phone.trim(),
      }),
    },
  );

  if (!res.ok) {
    throw new Error(await parseApiErrorMessage(res, "Could not create customer."));
  }

  const json: unknown = await res.json();
  return readCustomerCreateResult(json);
}
