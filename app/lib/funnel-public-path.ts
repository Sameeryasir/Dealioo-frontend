import { isPositiveInt } from "@/app/lib/numbers";
import { getPublicAppUrl } from "@/app/lib/public-app-url";

export type FunnelPublicStep = "landing" | "signup" | "payment" | "confirmation";

export type FunnelPublicPathQuery = {
  campaignId?: number | null;
  businessId?: number | null;
  price?: number | string | null;
  checkoutToken?: string | null;
  campaignType?: "prepaid" | "postpaid" | null;
  preview?: boolean;
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
  const businessId = query?.businessId;
  if (isPositiveInt(businessId)) {
    params.set("businessId", String(businessId));
  }
  if (query?.checkoutToken?.trim()) {
    params.set("checkoutToken", query.checkoutToken.trim());
  }
  if (
    query?.campaignType === "prepaid" ||
    query?.campaignType === "postpaid"
  ) {
    params.set("campaignType", query.campaignType);
  }
  const price = query?.price;
  if (price != null && String(price).trim() !== "") {
    params.set("price", String(price).trim());
  }
  if (query?.preview) {
    params.set("preview", "1");
  }

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function isFunnelDesignPreviewSearch(
  search: string | null | undefined,
): boolean {
  if (!search) return false;
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  return params.get("preview") === "1";
}

export function buildFunnelDesignPreviewPath(
  funnelId: number | string,
  step: FunnelPublicStep,
): string {
  return buildFunnelPublicPath({
    funnelId,
    step,
    query: { preview: true },
  });
}

export function withFunnelDesignPreviewParam(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  try {
    const parsed = new URL(trimmed, "http://local.invalid");
    parsed.searchParams.set("preview", "1");
    if (/^https?:\/\//i.test(trimmed)) {
      return parsed.toString();
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return trimmed.includes("?")
      ? `${trimmed}&preview=1`
      : `${trimmed}?preview=1`;
  }
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

function parseFunnelTrackingPrice(
  raw: number | string | null | undefined,
): number | string | null | undefined {
  if (raw == null) return raw;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const n = Number.parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : raw;
}

export function buildFunnelLandingTrackingUrl(input: {
  funnelId?: number | null;
  campaignId?: number | null;
  businessId?: number | null;
  price?: number | string | null;
  campaignType?: "prepaid" | "postpaid" | null;
}): string {
  const routeId = resolveFunnelRouteId(input.funnelId, input.campaignId);
  const origin = getPublicAppUrl().replace(/\/$/, "");
  if (routeId == null) return origin;

  const path = buildFunnelPublicPath({
    funnelId: routeId,
    step: "landing",
    query: {
      businessId: input.businessId,
      campaignId: input.campaignId,
      price: parseFunnelTrackingPrice(input.price) ?? input.price,
      campaignType:
        input.campaignType === "prepaid" || input.campaignType === "postpaid"
          ? input.campaignType
          : undefined,
    },
  });

  return `${origin}${path}`;
}
