import { parseRoutePositiveInt } from "@/app/lib/numbers";

/** Read business id from URL query (supports legacy `restaurantId`). */
export function readBusinessIdFromSearchParams(
  params: URLSearchParams,
): number | undefined {
  return (
    parseRoutePositiveInt(params.get("businessId")) ??
    parseRoutePositiveInt(params.get("restaurantId"))
  );
}

export function businessIdQueryString(businessId: number): string {
  return `businessId=${encodeURIComponent(String(businessId))}`;
}

export function withBusinessIdQuery(path: string, businessId: number): string {
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}${businessIdQueryString(businessId)}`;
}
