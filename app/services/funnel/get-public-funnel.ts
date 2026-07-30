import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { isPositiveInt } from "@/app/lib/numbers";
import type { FunnelByCampaignResponse } from "@/app/services/funnel/get-funnel-by-campaign";

export type PublicFunnelResponse = Pick<
  FunnelByCampaignResponse,
  "id" | "campaignId" | "pages"
> & {
  businessId?: number | null;
};

export async function fetchPublicFunnelById(
  funnelId: number,
): Promise<PublicFunnelResponse | null> {
  if (!isPositiveInt(funnelId)) {
    throw new Error("Valid funnelId is required.");
  }

  const res = await fetch(
    `${getApiBaseUrl()}/funnel/public/${encodeURIComponent(String(funnelId))}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(await parseApiErrorMessage(res, "Could not load funnel."));
  }

  return (await res.json()) as PublicFunnelResponse;
}
