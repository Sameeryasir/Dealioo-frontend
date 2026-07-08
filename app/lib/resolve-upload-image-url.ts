import { getApiBaseUrl } from "@/app/lib/api";

/** Backend origin for static /uploads/* files (no /api prefix). */
export function getUploadsBaseUrl(): string {
  return getApiBaseUrl().replace(/\/api\/?$/i, "");
}

/**
 * Turn stored upload paths into browser-ready URLs like
 * https://dealioo.io/uploads/campaigns/photo.jpg
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
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/")) {
    return `${getUploadsBaseUrl()}${trimmed}`;
  }

  if (trimmed.startsWith("uploads/")) {
    return `${getUploadsBaseUrl()}/${trimmed}`;
  }

  return trimmed;
}
