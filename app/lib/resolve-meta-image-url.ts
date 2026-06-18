import { getPublicAppUrl } from "@/app/lib/public-app-url";

const META_IMAGE_EXT = /\.(jpe?g|png|gif|webp)(\?.*)?$/i;

function isFolderUploadPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "");
  if (!path) return true;
  if (path.endsWith("/uploads")) return true;
  if (path.endsWith("/backend/uploads")) return true;
  return false;
}

/** Turns relative /uploads/ paths into a public HTTPS URL Meta can fetch (ngrok or production). */
export function resolveMetaImageUrl(raw: string | undefined | null): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const base = getPublicAppUrl().replace(/\/$/, "");
  if (trimmed.startsWith("/backend/uploads/")) {
    return `${base}${trimmed}`;
  }
  if (trimmed.startsWith("/uploads/")) {
    return `${base}/backend${trimmed}`;
  }
  return trimmed;
}

/** Returns a usable campaign image URL, or empty when the stored value is a folder/invalid. */
export function pickMetaImageUrl(raw: string | undefined | null): string {
  const resolved = resolveMetaImageUrl(raw);
  return validateMetaImageUrl(resolved) ? "" : resolved;
}

/** Client-side guard before calling Meta campaign API. */
export function validateMetaImageUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return "Image URL is required.";

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "Image URL is not valid.";
  }

  if (parsed.protocol !== "https:") {
    return "Image URL must use HTTPS (required by Meta).";
  }

  const path = parsed.pathname.replace(/\/+$/, "");
  if (isFolderUploadPath(path)) {
    return "Upload an image below or paste a direct link to a .jpg/.png file — not a folder.";
  }

  if (!META_IMAGE_EXT.test(path)) {
    return "Image URL must end with .jpg, .jpeg, .png, or .webp.";
  }

  return null;
}
