import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";

export type CreateCustomerPayload = {
  name: string;
  email: string;
};

export async function createCustomer(
  payload: CreateCustomerPayload,
): Promise<unknown> {
  if (!payload.name?.trim()) {
    throw new Error("Name is required.");
  }
  if (!payload.email?.trim()) {
    throw new Error("Email is required.");
  }

  const res = await fetch(`${getApiBaseUrl()}/customer/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: payload.name.trim(),
      email: payload.email.trim(),
    }),
  });

  if (!res.ok) {
    throw new Error(await parseApiErrorMessage(res, "Could not create customer."));
  }

  return res.json() as Promise<unknown>;
}
