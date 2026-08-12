import { buildFunnelLandingTrackingUrl } from "@/app/lib/funnel-public-path";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-business";
import type {
  DestinationTypeId,
  GoogleCampaignBuilderDraft,
} from "@/app/components/google-ads/campaign-builder/types";

const DEALIOO_PUBLIC_ORIGIN = (
  process.env.NEXT_PUBLIC_DEALIOO_PUBLIC_URL || "https://www.dealioo.io"
).replace(/\/$/, "");

function isDevTunnelHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host.includes("ngrok") ||
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "127.0.0.1"
  );
}

/** Google Ads final URLs must use the public Dealioo host, not local/ngrok tunnels. */
export function toDealiooPublicAdsUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (!isDevTunnelHost(parsed.hostname)) return trimmed;
    return `${DEALIOO_PUBLIC_ORIGIN}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return trimmed;
  }
}

export function isFunnelPublished(funnel: Funnel): boolean {
  if (funnel.published === true) return true;
  if (funnel.published === false) return false;
  return funnel.status?.trim().toLowerCase() === "published";
}

export function resolveCampaignDestinationUrl(
  draft: Pick<
    GoogleCampaignBuilderDraft,
    "destinationType" | "websiteUrl" | "landingPageUrl"
  >,
): string {
  const primary = (draft.landingPageUrl || draft.websiteUrl).trim();
  const fallback = (draft.websiteUrl || draft.landingPageUrl).trim();

  if (
    draft.destinationType === "dealioo_funnel" ||
    draft.destinationType === "external_website"
  ) {
    const url = primary || fallback;
    return draft.destinationType === "dealioo_funnel"
      ? toDealiooPublicAdsUrl(url)
      : url;
  }

  return fallback || primary;
}

export function destinationLabel(
  draft: Pick<
    GoogleCampaignBuilderDraft,
    "destinationType" | "selectedFunnelName" | "websiteUrl" | "landingPageUrl"
  >,
): string {
  switch (draft.destinationType) {
    case "dealioo_funnel":
      return draft.selectedFunnelName.trim() || "Dealioo Funnel";
    case "external_website":
      return "Website";
    case "google_lead_form":
      return "Google Lead Form";
    case "phone":
      return "Phone";
    case "physical_location":
      return "Physical Location";
    default: {
      const url = resolveCampaignDestinationUrl(draft);
      return url || "Not set";
    }
  }
}

export function applyFunnelDestination(
  funnel: Funnel,
  businessId: number,
): Partial<GoogleCampaignBuilderDraft> {
  const url = toDealiooPublicAdsUrl(
    buildFunnelLandingTrackingUrl({
      funnelId: funnel.id,
      campaignId: funnel.id,
      businessId,
      price: funnel.price,
      campaignType: funnel.campaignType,
    }),
  );

  return {
    destinationType: "dealioo_funnel",
    selectedFunnelId: funnel.id,
    selectedFunnelName: funnel.campaignName,
    websiteUrl: url,
    landingPageUrl: url,
  };
}

export function applyExternalWebsiteDestination(
  url: string,
): Partial<GoogleCampaignBuilderDraft> {
  const trimmed = url.trim();
  return {
    destinationType: "external_website",
    selectedFunnelId: null,
    selectedFunnelName: "",
    websiteUrl: trimmed,
    landingPageUrl: trimmed,
  };
}

export function applyNonUrlDestination(
  type: Extract<
    DestinationTypeId,
    "google_lead_form" | "phone" | "physical_location"
  >,
): Partial<GoogleCampaignBuilderDraft> {
  return {
    destinationType: type,
    selectedFunnelId: null,
    selectedFunnelName: "",
  };
}

export function withSyncedAdFinalUrl(
  draft: GoogleCampaignBuilderDraft,
  patch: Partial<GoogleCampaignBuilderDraft>,
): Partial<GoogleCampaignBuilderDraft> {
  const next = { ...draft, ...patch };
  const url = resolveCampaignDestinationUrl(next);
  if (!url || !draft.ads[0]) return patch;

  return {
    ...patch,
    ads: [{ ...draft.ads[0], finalUrl: url }],
  };
}

export function formatBusinessAddressLine(parts: {
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
}): string {
  return [parts.city, parts.state, parts.postalCode, parts.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
