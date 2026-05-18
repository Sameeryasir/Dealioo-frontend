import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";

export type StripeConnectResponse = {
  url: string;
};

function extractUrl(body: unknown): string | null {
  if (typeof body === "string" && body.trim().length > 0) return body.trim();
  if (!body || typeof body !== "object") return null;

  const o = body as Record<string, unknown>;
  if (typeof o.url === "string" && o.url.trim().length > 0) return o.url.trim();

  const data = o.data;
  if (data && typeof data === "object") {
    const inner = (data as Record<string, unknown>).url;
    if (typeof inner === "string" && inner.trim().length > 0)
      return inner.trim();
  }
  return null;
}

export async function connectStripe(
  accessToken: string,
  restaurantId: number,
): Promise<StripeConnectResponse> {
  if (!accessToken.trim()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Restaurant is required.");
  }

  const res = await fetch(
    `${getApiBaseUrl()}/stripe/connect/${encodeURIComponent(String(restaurantId))}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not start Stripe connection."),
    );
  }

  const body = (await res.json().catch(() => null)) as unknown;
  const url = extractUrl(body);

  if (!url) {
    throw new Error("Stripe connect URL was not returned by the server.");
  }

  return { url };
}
