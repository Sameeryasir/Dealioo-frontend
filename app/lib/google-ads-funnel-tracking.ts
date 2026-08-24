import type { PublicFunnelResponse } from "@/app/services/funnel/get-public-funnel";

export type GoogleAdsFunnelTracking = {
  tagId: string | null;
  signupConversionLabel: string | null;
  purchaseConversionLabel: string | null;
  leadConversionLabel: string | null;
};

export function readGoogleAdsFunnelTracking(
  publicFunnel: PublicFunnelResponse | null | undefined,
): GoogleAdsFunnelTracking {
  return {
    tagId: publicFunnel?.googleTagManagerId?.trim() || null,
    signupConversionLabel:
      publicFunnel?.googleAdsSignupConversionLabel?.trim() || null,
    purchaseConversionLabel:
      publicFunnel?.googleAdsPurchaseConversionLabel?.trim() || null,
    leadConversionLabel:
      publicFunnel?.googleAdsLeadConversionLabel?.trim() || null,
  };
}

function readGclidFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const gclid = new URLSearchParams(window.location.search).get("gclid")?.trim();
  return gclid || null;
}

export function getGoogleAdsAttribution(): { gclid: string | null } {
  return { gclid: readGclidFromUrl() };
}

export function hasGoogleAdsGclid(): boolean {
  return Boolean(getGoogleAdsAttribution().gclid?.trim());
}
