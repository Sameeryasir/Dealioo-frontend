import { getPublicAppUrl } from "@/app/lib/public-app-url";

const META_IMAGE_EXT = /\.(jpe?g|png|gif|webp)(\?.*)?$/i;

function isFolderUploadPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "");
  if (!path) return true;
  if (path.endsWith("/uploads")) return true;
  if (path.endsWith("/backend/uploads")) return true;
  return false;
}

export function resolveMetaImageUrl(raw: string | undefined | null): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";

  const publicAppBase = getPublicAppUrl().replace(/\/$/, "");
  const campaignBase = `${publicAppBase}/backend/uploads/campaigns`;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      const path = parsed.pathname.replace(/\/+$/, "");
      if (path.startsWith("/backend/uploads/campaigns/")) {
        const fileName = path.slice("/backend/uploads/campaigns/".length);
        if (fileName && !fileName.includes("/")) {
          return `${campaignBase}/${fileName}`;
        }
      }
      if (path.startsWith("/uploads/campaigns/")) {
        const fileName = path.slice("/uploads/campaigns/".length);
        if (fileName && !fileName.includes("/")) {
          return `${campaignBase}/${fileName}`;
        }
      }
    } catch {
      return trimmed;
    }
    return trimmed;
  }

  if (trimmed.startsWith("/backend/uploads/campaigns/")) {
    return `${publicAppBase}${trimmed}`;
  }

  if (trimmed.startsWith("/uploads/campaigns/")) {
    const fileName = trimmed.slice("/uploads/campaigns/".length);
    return `${campaignBase}/${fileName}`;
  }

  if (!trimmed.includes("/")) {
    return `${campaignBase}/${trimmed.replace(/^\/+/, "")}`;
  }

  if (trimmed.startsWith("/backend/uploads/")) {
    return `${publicAppBase}${trimmed}`;
  }
  if (trimmed.startsWith("/uploads/")) {
    return `${publicAppBase}/backend${trimmed}`;
  }

  return trimmed;
}

export function pickMetaImageUrl(raw: string | undefined | null): string {
  const resolved = resolveMetaImageUrl(raw);
  return validateMetaImageUrl(resolved) ? "" : resolved;
}

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
    return "Upload an image below or paste a direct link to a .jpg/.png file, not a folder.";
  }

  if (!META_IMAGE_EXT.test(path)) {
    return "Image URL must end with .jpg, .jpeg, .png, or .webp.";
  }

  return null;
}

export function validateHttpsUrl(url: string, label = "URL"): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return `${label} is required.`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      return `${label} must use HTTPS (required by Meta). Set NEXT_PUBLIC_FRONTEND_URL to your public site URL.`;
    }
  } catch {
    return `${label} is not valid.`;
  }

  return null;
}
