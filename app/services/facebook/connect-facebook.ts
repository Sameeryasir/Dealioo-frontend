import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type MetaConnectResponse = {
  url: string;
  scopes?: string[];
};

function extractUrl(body: unknown): string | null {
  if (typeof body === "string" && body.trim()) return body.trim();
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (typeof o.url === "string" && o.url.trim()) return o.url.trim();
  return null;
}

export async function connectFacebook(
  accessToken: string,
  restaurantId: number,
  scopes: string[],
): Promise<MetaConnectResponse> {
  if (!accessToken.trim()) {
    throw new Error("You're signed out. Sign in again to connect Meta.");
  }
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Business is required.");
  }
  if (!scopes.length) {
    throw new Error("Select at least one Meta Ads permission before connecting.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/facebook/connect/${encodeURIComponent(String(restaurantId))}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scopes }),
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not start Meta connection."),
    );
  }

  const body = (await res.json().catch(() => null)) as unknown;
  const url = extractUrl(body);
  if (!url) {
    throw new Error("Meta connect URL was not returned by the server.");
  }

  const scopesOut =
    body &&
    typeof body === "object" &&
    Array.isArray((body as { scopes?: unknown }).scopes)
      ? ((body as { scopes: string[] }).scopes)
      : scopes;

  return { url, scopes: scopesOut };
}
