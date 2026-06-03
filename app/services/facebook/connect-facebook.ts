import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type MetaConnectResponse = {
  url: string;
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
): Promise<MetaConnectResponse> {
  if (!accessToken.trim()) {
    throw new Error("You're signed out. Sign in again to connect Facebook.");
  }
  if (!Number.isFinite(restaurantId) || restaurantId < 1) {
    throw new Error("Restaurant is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/meta/connect/${encodeURIComponent(String(restaurantId))}`,
    { method: "POST" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not start Facebook connection."),
    );
  }

  const body = (await res.json().catch(() => null)) as unknown;
  const url = extractUrl(body);
  if (!url) {
    throw new Error("Facebook connect URL was not returned by the server.");
  }

  return { url };
}
