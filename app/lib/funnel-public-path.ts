import { isPositiveInt } from "@/app/lib/numbers";

export type FunnelPublicStep = "landing" | "signup" | "payment" | "confirmation";

export type FunnelPublicPathQuery = {
  campaignId?: number | null;
  restaurantId?: number | null;
};

export type BuildFunnelPublicPathInput = {
  funnelId: number | string;
  step: FunnelPublicStep;
  query?: FunnelPublicPathQuery;
};

export function buildFunnelPublicPath({
  funnelId,
  step,
  query,
}: BuildFunnelPublicPathInput): string {
  const path = `/funnel/${encodeURIComponent(String(funnelId))}/${step}`;
  const params = new URLSearchParams();

  if (isPositiveInt(query?.campaignId)) {
    params.set("campaignId", String(query.campaignId));
  }
  if (isPositiveInt(query?.restaurantId)) {
    params.set("restaurantId", String(query.restaurantId));
  }

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function resolveFunnelRouteId(
  funnelId: number | null | undefined,
  campaignId: number | null | undefined,
): number | null {
  if (isPositiveInt(funnelId)) return funnelId;
  if (isPositiveInt(campaignId)) return campaignId;
  return null;
}
