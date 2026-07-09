import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type StripeDashboardLinkResponse = {
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

export async function getStripeDashboardLink(
  accessToken: string,
  restaurantId: number,
): Promise<StripeDashboardLinkResponse> {
  if (!accessToken.trim()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/stripe/dashboard-link/${encodeURIComponent(String(restaurantId))}`,
    {
      method: "GET",
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not open Stripe dashboard."),
    );
  }

  const body = (await res.json().catch(() => null)) as unknown;
  const url = extractUrl(body);

  if (!url) {
    throw new Error("Stripe dashboard URL was not returned by the server.");
  }

  return { url };
}
