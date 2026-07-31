import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { isPositiveInt } from "@/app/lib/numbers";
import type { FunnelByCampaignResponse } from "@/app/services/funnel/get-funnel-by-campaign";

export type PublicFunnelStep =
  | "landing"
  | "signup"
  | "payment"
  | "confirmation";

export type PublicFunnelResponse = Pick<
  FunnelByCampaignResponse,
  "id" | "campaignId" | "pages"
> & {
  businessId?: number | null;
  pixelId?: string | null;
  googleTagManagerId?: string | null;
  step?: PublicFunnelStep | string;
};

export async function fetchPublicFunnelById(
  funnelId: number,
  options?: {
    businessId?: number | null;
    step?: PublicFunnelStep | null;
  },
): Promise<PublicFunnelResponse | null> {
  if (!isPositiveInt(funnelId)) {
    throw new Error("Valid funnelId is required.");
  }

  const params = new URLSearchParams();
  if (isPositiveInt(options?.businessId)) {
    params.set("businessId", String(options.businessId));
  }
  if (options?.step) {
    params.set("step", options.step);
  }
  const query = params.toString();

  const res = await fetch(
    `${getApiBaseUrl()}/funnel/public/${encodeURIComponent(String(funnelId))}${
      query ? `?${query}` : ""
    }`,
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
