import { isPositiveInt } from "@/app/lib/numbers";

export type FunnelPublicStep = "landing" | "signup" | "payment" | "confirmation";

export type FunnelPublicPathQuery = {
  campaignId?: number | null;
  restaurantId?: number | null;
  price?: number | string | null;
  checkoutToken?: string | null;
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
  if (query?.checkoutToken?.trim()) {
    params.set("checkoutToken", query.checkoutToken.trim());
  }
  const price = query?.price;
  if (price != null && String(price).trim() !== "") {
    params.set("price", String(price).trim());
  }

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function buildFunnelPaymentConfirmationPath(
  funnelId: number | string,
  query?: FunnelPublicPathQuery,
  options?: { redirectStatus?: string; paymentConfirmed?: boolean },
): string {
  let path = buildFunnelPublicPath({
    funnelId,
    step: "confirmation",
    query,
  });
  const extra = new URLSearchParams();
  if (options?.redirectStatus?.trim()) {
    extra.set("redirect_status", options.redirectStatus.trim());
  }
  if (options?.paymentConfirmed) {
    extra.set("payment_confirmed", "1");
  }
  const extraQs = extra.toString();
  if (!extraQs) return path;
  return path.includes("?") ? `${path}&${extraQs}` : `${path}?${extraQs}`;
}

export function resolveFunnelRouteId(
  funnelId: number | null | undefined,
  campaignId: number | null | undefined,
): number | null {
  if (isPositiveInt(funnelId)) return funnelId;
  if (isPositiveInt(campaignId)) return campaignId;
  return null;
}
