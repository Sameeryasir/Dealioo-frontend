import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type BillingPaymentMethod = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

export type BillingAddress = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

export type BillingDetails = {
  name: string | null;
  email: string | null;
  address: BillingAddress | null;
};

export type BillingInvoice = {
  id: string;
  number: string | null;
  createdAt: string;
  amountFormatted: string;
  currency: string;
  status: string;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
};

export type BillingSubscriptionSummary = {
  planName: string;
  planSlug: string;
  billingCycle: "monthly" | "annual";
  status: string;
  priceFormatted: string | null;
  nextBillingDate: string | null;
  cancelAtPeriodEnd: boolean;
  cancellationDate: string | null;
  startedAt: string | null;
};

export type BillingOverview = {
  subscription: BillingSubscriptionSummary | null;
  paymentMethod: BillingPaymentMethod | null;
  billingDetails: BillingDetails;
  invoices: BillingInvoice[];
};

export type UpdateBillingDetailsInput = {
  name?: string;
  email?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
};

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

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeAddress(value: unknown): BillingAddress | null {
  const row = asRecord(value);
  if (!row) return null;
  const address: BillingAddress = {
    line1: asString(row.line1),
    line2: asString(row.line2),
    city: asString(row.city),
    state: asString(row.state),
    postalCode: asString(row.postalCode),
    country: asString(row.country),
  };
  if (
    !address.line1 &&
    !address.city &&
    !address.state &&
    !address.postalCode &&
    !address.country
  ) {
    return null;
  }
  return address;
}

function normalizePaymentMethod(value: unknown): BillingPaymentMethod | null {
  const row = asRecord(value);
  if (!row) return null;
  const last4 = asString(row.last4);
  if (!last4) return null;
  return {
    brand: asString(row.brand) || "card",
    last4,
    expMonth: typeof row.expMonth === "number" ? row.expMonth : 0,
    expYear: typeof row.expYear === "number" ? row.expYear : 0,
  };
}

function normalizeInvoice(value: unknown): BillingInvoice | null {
  const row = asRecord(value);
  if (!row) return null;
  const id = asString(row.id);
  const createdAt = asString(row.createdAt);
  const amountFormatted = asString(row.amountFormatted);
  if (!id || !createdAt || !amountFormatted) return null;
  return {
    id,
    number: asString(row.number),
    createdAt,
    amountFormatted,
    currency: asString(row.currency) || "usd",
    status: asString(row.status) || "unknown",
    hostedInvoiceUrl: asString(row.hostedInvoiceUrl),
    invoicePdfUrl: asString(row.invoicePdfUrl),
  };
}

function normalizeSubscription(
  value: unknown,
): BillingSubscriptionSummary | null {
  const row = asRecord(value);
  if (!row) return null;
  const planName = asString(row.planName);
  if (!planName) return null;
  return {
    planName,
    planSlug: asString(row.planSlug) || "",
    billingCycle: row.billingCycle === "annual" ? "annual" : "monthly",
    status: asString(row.status) || "active",
    priceFormatted: asString(row.priceFormatted),
    nextBillingDate: asString(row.nextBillingDate),
    cancelAtPeriodEnd: row.cancelAtPeriodEnd === true,
    cancellationDate: asString(row.cancellationDate),
    startedAt: asString(row.startedAt),
  };
}

function normalizeOverview(raw: unknown): BillingOverview | null {
  const row = asRecord(raw);
  if (!row) return null;
  const billingDetailsRow = asRecord(row.billingDetails);
  return {
    subscription: normalizeSubscription(row.subscription),
    paymentMethod: normalizePaymentMethod(row.paymentMethod),
    billingDetails: {
      name: asString(billingDetailsRow?.name),
      email: asString(billingDetailsRow?.email),
      address: normalizeAddress(billingDetailsRow?.address),
    },
    invoices: Array.isArray(row.invoices)
      ? row.invoices
          .map((item) => normalizeInvoice(item))
          .filter((item): item is BillingInvoice => item != null)
      : [],
  };
}

export async function getBillingOverview(): Promise<BillingOverview> {
  const res = await authenticatedFetch(`${getApiBaseUrl()}/billing/overview`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      await parseApiMessageFromResponse(
        res,
        "Could not load billing details.",
      ),
    );
  }

  const overview = normalizeOverview(await parseJson(res));
  if (!overview) {
    throw new Error("Could not load billing details.");
  }
  return overview;
}

export async function createBillingSetupIntent(): Promise<{ clientSecret: string }> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/billing/setup-intent`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
    },
    60_000,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiMessageFromResponse(res, "Could not start card update."),
    );
  }

  const row = asRecord(await parseJson(res));
  const clientSecret = asString(row?.clientSecret);
  if (!clientSecret) {
    throw new Error("Could not start card update.");
  }
  return { clientSecret };
}

export async function confirmBillingPaymentMethod(
  setupIntentId: string,
): Promise<BillingPaymentMethod | null> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/billing/payment-method`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ setupIntentId }),
    },
    60_000,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiMessageFromResponse(res, "Could not save your card."),
    );
  }

  const row = asRecord(await parseJson(res));
  return normalizePaymentMethod(row?.paymentMethod);
}

export async function updateBillingDetails(
  input: UpdateBillingDetailsInput,
): Promise<BillingDetails> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/billing/customer`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    60_000,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiMessageFromResponse(
        res,
        "Could not update billing information.",
      ),
    );
  }

  const row = asRecord(await parseJson(res));
  const details = asRecord(row?.billingDetails);
  return {
    name: asString(details?.name),
    email: asString(details?.email),
    address: normalizeAddress(details?.address),
  };
}

export async function resumeUserSubscription(): Promise<void> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/billing/resume`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
    },
    60_000,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiMessageFromResponse(
        res,
        "Could not resume your subscription.",
      ),
    );
  }
}
