import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

const PRESIGN_TIMEOUT_MS = 30_000;
const PUT_TIMEOUT_MS = 120_000;
const COMPLETE_TIMEOUT_MS = 30_000;
const MULTIPART_IMAGE_TIMEOUT_MS = 60_000;
const MULTIPART_VIDEO_TIMEOUT_MS = 120_000;

export type MetaCampaignMediaType = "image" | "video";

export type UploadMetaCampaignMediaResult = {
  url: string;
  mediaId?: string;
  
  imageHash?: string;
};

type PresignMediaResponse = {
  mediaId: string;
  uploadUrl: string;
  publicUrl: string;
  objectKey: string;
  uploadStatus: string;
  requiredHeaders?: Record<string, string>;
};

type CompleteMediaResponse = {
  id: string;
  storageUrl: string | null;
  uploadStatus: string;
  metaImageHash?: string | null;
};

function mediaBasePath(businessId: number): string {
  return `${getApiBaseUrl()}/facebook-campaigns/business/${encodeURIComponent(String(businessId))}`;
}

async function uploadViaSpaces(
  businessId: number,
  file: File,
  mediaType: MetaCampaignMediaType,
  draftId?: string,
): Promise<UploadMetaCampaignMediaResult> {
  const mimeType =
    file.type || (mediaType === "image" ? "image/jpeg" : "video/mp4");

  const presignRes = await authenticatedFetch(
    `${mediaBasePath(businessId)}/media/presign`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draftId: draftId?.trim() || undefined,
        mediaType,
        filename: file.name || `upload.${mediaType === "image" ? "jpg" : "mp4"}`,
        mimeType,
        sizeBytes: file.size,
      }),
    },
    PRESIGN_TIMEOUT_MS,
  );

  if (!presignRes.ok) {
    throw Object.assign(
      new Error(
        await parseApiErrorMessage(presignRes, "Could not prepare media upload."),
      ),
      { status: presignRes.status },
    );
  }

  const presign = (await presignRes.json()) as PresignMediaResponse;
  if (!presign.uploadUrl?.trim() || !presign.mediaId?.trim()) {
    throw new Error("Spaces presign did not return an upload URL.");
  }

  const putHeaders: Record<string, string> = {
    "Content-Type": mimeType,
    ...(presign.requiredHeaders ?? {}),
  };

  const putController = new AbortController();
  const putTimer = setTimeout(() => putController.abort(), PUT_TIMEOUT_MS);
  let putRes: Response;
  try {
    putRes = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: putHeaders,
      body: file,
      signal: putController.signal,
    });
  } finally {
    clearTimeout(putTimer);
  }

  if (!putRes.ok) {
    throw Object.assign(
      new Error(
        `Could not upload media to storage (${putRes.status}). Try again.`,
      ),
      { status: putRes.status, spacesPutFailed: true },
    );
  }

  const completeRes = await authenticatedFetch(
    `${mediaBasePath(businessId)}/media/${encodeURIComponent(presign.mediaId)}/complete`,
    { method: "POST" },
    COMPLETE_TIMEOUT_MS,
  );

  if (!completeRes.ok) {
    throw new Error(
      await parseApiErrorMessage(completeRes, "Could not finalize media upload."),
    );
  }

  const completed = (await completeRes.json()) as CompleteMediaResponse;
  const url = (completed.storageUrl ?? presign.publicUrl)?.trim();
  if (!url) {
    throw new Error("Media upload completed without a public URL.");
  }

  return {
    url,
    mediaId: completed.id || presign.mediaId,
    imageHash: completed.metaImageHash?.trim() || undefined,
  };
}

async function uploadViaMultipartFallback(
  businessId: number,
  file: File,
  mediaType: MetaCampaignMediaType,
): Promise<UploadMetaCampaignMediaResult> {
  const formData = new FormData();
  formData.append("file", file);

  if (mediaType === "image") {
    const res = await authenticatedFetch(
      `${mediaBasePath(businessId)}/ad-image`,
      { method: "POST", body: formData },
      MULTIPART_IMAGE_TIMEOUT_MS,
    );
    if (!res.ok) {
      throw new Error(
        await parseApiErrorMessage(res, "Could not upload ad image."),
      );
    }
    const json = (await res.json()) as {
      imageUrl: string;
      imageHash?: string;
      metaImageUrl?: string;
    };
    const url = json.imageUrl?.trim() || json.metaImageUrl?.trim();
    if (!url) {
      throw new Error("Image upload completed without a public URL.");
    }
    return {
      url,
      imageHash: json.imageHash?.trim() || undefined,
    };
  }

  const res = await authenticatedFetch(
    `${mediaBasePath(businessId)}/ad-video`,
    { method: "POST", body: formData },
    MULTIPART_VIDEO_TIMEOUT_MS,
  );
  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not upload ad video."),
    );
  }
  const json = (await res.json()) as { videoUrl: string };
  if (!json.videoUrl?.trim()) {
    throw new Error("Video upload completed without a public URL.");
  }
  return { url: json.videoUrl.trim() };
}

export async function uploadMetaCampaignMedia(
  businessId: number,
  file: File,
  options?: {
    draftId?: string;
    mediaType?: MetaCampaignMediaType;
  },
): Promise<UploadMetaCampaignMediaResult> {
  const mediaType: MetaCampaignMediaType =
    options?.mediaType ??
    (file.type.startsWith("video/") ? "video" : "image");

  try {
    return await uploadViaSpaces(
      businessId,
      file,
      mediaType,
      options?.draftId,
    );
  } catch (err) {
    const status =
      err && typeof err === "object" && "status" in err
        ? Number((err as { status: unknown }).status)
        : NaN;
    const spacesPutFailed =
      err &&
      typeof err === "object" &&
      "spacesPutFailed" in err &&
      Boolean((err as { spacesPutFailed?: unknown }).spacesPutFailed);

    if (
      spacesPutFailed ||
      status === 503 ||
      status === 501 ||
      status === 404 ||
      !Number.isFinite(status) ||
      status >= 500 ||
      status === 403
    ) {
      try {
        return await uploadViaMultipartFallback(businessId, file, mediaType);
      } catch {
        throw err instanceof Error ? err : new Error("Could not upload media.");
      }
    }

    if (!(err instanceof Error && status >= 400 && status < 500)) {
      try {
        return await uploadViaMultipartFallback(businessId, file, mediaType);
      } catch {
        throw err instanceof Error ? err : new Error("Could not upload media.");
      }
    }
    throw err instanceof Error ? err : new Error("Could not upload media.");
  }
}
