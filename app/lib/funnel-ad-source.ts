import { getGoogleAdsAttribution } from "@/app/lib/google-ads-funnel-tracking";
import { getFunnelMetaAttribution } from "@/app/lib/funnel-meta-attribution";
import { captureFunnelUtmAttribution } from "@/app/lib/funnel-utm-attribution";

export type FunnelClientAdSource = {
  adSource: "meta" | "google" | "utm";
  adSourceLabel: string;
  adSourceDetail?: string;
};

export function resolveFunnelClientAdSource(): FunnelClientAdSource | null {
  if (typeof window === "undefined") return null;

  const meta = getFunnelMetaAttribution();
  if (meta.fbclid?.trim() || meta.fbc?.trim()) {
    return { adSource: "meta", adSourceLabel: "Facebook" };
  }

  const google = getGoogleAdsAttribution();
  if (google.gclid?.trim()) {
    return { adSource: "google", adSourceLabel: "Google" };
  }

  const utm = captureFunnelUtmAttribution();
  const source = (utm.utmSource ?? "").trim().toLowerCase();
  const medium = (utm.utmMedium ?? "").trim().toLowerCase();
  if (!source && !medium) return null;

  const blob = `${source} ${medium}`;
  const detail = utm.utmCampaign?.trim() || undefined;

  if (
    blob.includes("facebook") ||
    blob.includes("fb") ||
    blob.includes("instagram") ||
    blob.includes("meta")
  ) {
    return {
      adSource: "meta",
      adSourceLabel: "Facebook",
      ...(detail ? { adSourceDetail: detail } : {}),
    };
  }

  if (blob.includes("google") || blob.includes("gclid") || medium === "cpc") {
    return {
      adSource: "google",
      adSourceLabel: "Google",
      ...(detail ? { adSourceDetail: detail } : {}),
    };
  }

  return {
    adSource: "utm",
    adSourceLabel: utm.utmSource?.trim() || utm.utmMedium?.trim() || "Ad",
    ...(detail ? { adSourceDetail: detail } : {}),
  };
}
