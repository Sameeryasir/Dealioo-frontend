import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export async function createFunnelPreviewToken(
  funnelId: number,
): Promise<string> {
  if (!isPositiveInt(funnelId)) {
    throw new Error("Valid funnelId is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/funnel/${encodeURIComponent(String(funnelId))}/preview-token`,
    { method: "POST", headers: { Accept: "application/json" } },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not create preview link."),
    );
  }

  const data = (await res.json()) as { previewToken?: string };
  const token = data.previewToken?.trim();
  if (!token) {
    throw new Error("Could not create preview link.");
  }
  return token;
}
