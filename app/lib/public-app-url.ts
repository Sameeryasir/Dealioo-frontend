export function getPublicAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_FRONTEND_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3002";
}

export function getPublicPrivacyPolicyUrl(): string {
  return `${getPublicAppUrl()}/privacy`;
}

export function getMetaLandingUrl(websiteUrl?: string | null): string {
  const fromWebsite = websiteUrl?.trim();
  if (fromWebsite?.startsWith("https://")) {
    return fromWebsite.replace(/\/$/, "");
  }

  const fromEnv = process.env.NEXT_PUBLIC_FRONTEND_URL?.trim();
  if (fromEnv?.startsWith("https://")) {
    return fromEnv.replace(/\/$/, "");
  }

  if (fromWebsite?.startsWith("http://")) {
    return fromWebsite.replace(/\/$/, "");
  }

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3002";
}

/** Match Meta ad stats to the live app URL (ngrok in dev, production domain in prod). */
export function getMetaAdsFilterUrl(campaignWebsiteUrl?: string | null): string {
  const fromEnv = process.env.NEXT_PUBLIC_FRONTEND_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return getMetaLandingUrl(campaignWebsiteUrl);
}
