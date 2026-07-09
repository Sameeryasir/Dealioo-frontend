import { getApiBaseUrl } from "@/app/lib/api";

/** Backend origin for legacy static /uploads/* files (no /api prefix). */
export function getUploadsBaseUrl(): string {
  return getApiBaseUrl().replace(/\/api\/?$/i, "");
}

/** Use DigitalOcean CDN edge URLs when images are stored on Spaces. */
export function toDigitalOceanSpacesCdnUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || !trimmed.includes("digitaloceanspaces.com")) {
    return trimmed;
  }
  if (trimmed.includes(".cdn.digitaloceanspaces.com")) {
    return trimmed;
  }

  const cdnBase = process.env.NEXT_PUBLIC_DO_SPACES_CDN_URL?.trim()?.replace(
    /\/$/,
    "",
  );

  if (cdnBase) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname.includes("digitaloceanspaces.com")) {
        return `${cdnBase}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      // fall through
    }
  }

  return trimmed.replace(
    /\.digitaloceanspaces\.com/i,
    ".cdn.digitaloceanspaces.com",
  );
}

/**
 * Turn stored upload paths into browser-ready URLs.
 * Spaces URLs are rewritten to the CDN hostname for faster loading.
 */
export function resolveUploadImageUrl(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return toDigitalOceanSpacesCdnUrl(trimmed);
  }

  if (trimmed.startsWith("/uploads/")) {
    return `${getUploadsBaseUrl()}${trimmed}`;
  }

  if (trimmed.startsWith("uploads/")) {
    return `${getUploadsBaseUrl()}/${trimmed}`;
  }

  return trimmed;
}

/** Suggested img attributes for faster Spaces image paint in lists/cards. */
export const spacesImageLoadProps = {
  decoding: "async" as const,
  loading: "lazy" as const,
};
