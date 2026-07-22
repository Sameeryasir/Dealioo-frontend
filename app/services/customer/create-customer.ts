import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";

export type CreateCustomerPayload = {
  name: string;
  email: string;
  phone: string;
  rejectDuplicateEmail?: boolean;
};

export type CreateCustomerResponse = {
  id: number;
};

function readCustomerId(data: unknown): number {
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
  return id;
}

export async function createCustomer(
  payload: CreateCustomerPayload,
): Promise<CreateCustomerResponse> {
  if (!payload.name?.trim()) {
    throw new Error("Name is required.");
  }
  if (!payload.email?.trim()) {
    throw new Error("Email is required.");
  }
  if (!payload.phone?.trim()) {
    throw new Error("Phone is required.");
  }

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
    }),
  });

  if (!res.ok) {
    throw new Error(await parseApiErrorMessage(res, "Could not create customer."));
  }

  const json: unknown = await res.json();
  return { id: readCustomerId(json) };
}
