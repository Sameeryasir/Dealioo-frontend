import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type BillingPortalSession = {
  url: string;
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

export async function openBillingPortal(): Promise<BillingPortalSession> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/billing/portal`,
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
        "Could not open billing portal.",
      ),
    );
  }

  const data: unknown = await res.json();
  const url =
    data && typeof data === "object" && typeof (data as { url?: unknown }).url === "string"
      ? (data as { url: string }).url.trim()
      : "";

  if (!url) {
    throw new Error("Could not open billing portal.");
  }

  return { url };
}
