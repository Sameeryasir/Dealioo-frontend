import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export const CAMPAIGN_REVIEWS_PAGE_SIZE = 10;

export type CampaignReviewSummary = {
  totalReviews: number;
  averageRating: number | null;
  requestsSent: number;
};

export type CampaignReviewRecord = {
  id: number;
  rating: number;
  comment: string | null;
  guestName: string | null;
  guestEmail: string | null;
  submittedAt: string;
  createdAt: string;
};

export type PaginatedCampaignReviewsResponse = {
  data: CampaignReviewRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: CampaignReviewSummary;
};

export type PublicCampaignFeedback = {
  campaignName: string;
  guestName: string | null;
  status: "pending" | "submitted" | "expired";
  alreadySubmitted: boolean;
  expired: boolean;
};

function normalizeSummary(raw: unknown): CampaignReviewSummary {
  if (!raw || typeof raw !== "object") {
    return { totalReviews: 0, averageRating: null, requestsSent: 0 };
  }
  const o = raw as Record<string, unknown>;
  const totalReviews = Number(o.totalReviews ?? 0) || 0;
  const averageRaw =
    o.averageRating == null ? null : Number(o.averageRating);
  return {
    totalReviews,
    averageRating:
      averageRaw != null && Number.isFinite(averageRaw) ? averageRaw : null,
    requestsSent: Number(o.requestsSent ?? 0) || 0,
  };
}

function normalizeReview(raw: unknown): CampaignReviewRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = Number(o.id);
  if (!Number.isFinite(id) || id < 1) return null;
  const rating = Math.floor(Number(o.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return null;
  return {
    id,
    rating,
    comment:
      typeof o.comment === "string" && o.comment.trim()
        ? o.comment.trim()
        : null,
    guestName:
      typeof o.guestName === "string" && o.guestName.trim()
        ? o.guestName.trim()
        : null,
    guestEmail:
      typeof o.guestEmail === "string" && o.guestEmail.trim()
        ? o.guestEmail.trim()
        : null,
    submittedAt:
      typeof o.submittedAt === "string"
        ? o.submittedAt
        : new Date().toISOString(),
    createdAt:
      typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
  };
}

export async function getCampaignReviews(options: {
  businessId: number;
  campaignId: number;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  q?: string;
  rating?: number;
}): Promise<PaginatedCampaignReviewsResponse> {
  const { businessId, campaignId } = options;
  if (!isPositiveInt(businessId) || !isPositiveInt(campaignId)) {
    throw new Error("Invalid campaign.");
  }
  if (!hasAuthSession()) {
    throw new Error("Please sign in again.");
  }

  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(
    50,
    Math.max(1, options.limit ?? CAMPAIGN_REVIEWS_PAGE_SIZE),
  );
  const params = new URLSearchParams({
    businessId: String(businessId),
    page: String(page),
    limit: String(limit),
  });
  if (options.from?.trim()) params.set("from", options.from.trim());
  if (options.to?.trim()) params.set("to", options.to.trim());
  if (options.q?.trim()) params.set("q", options.q.trim());
  const rating = Math.floor(Number(options.rating));
  if (Number.isFinite(rating) && rating >= 1 && rating <= 5) {
    params.set("rating", String(rating));
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/campaign-reviews/campaign/${campaignId}?${params.toString()}`,
  );
  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load reviews."),
    );
  }

  const json = (await res.json()) as Record<string, unknown>;
  const data = Array.isArray(json.data)
    ? json.data
        .map(normalizeReview)
        .filter((row): row is CampaignReviewRecord => row != null)
    : [];
  const metaRaw =
    json.meta && typeof json.meta === "object"
      ? (json.meta as Record<string, unknown>)
      : {};

  return {
    data,
    meta: {
      page: Number(metaRaw.page ?? page) || page,
      limit: Number(metaRaw.limit ?? limit) || limit,
      total: Number(metaRaw.total ?? data.length) || 0,
      totalPages: Number(metaRaw.totalPages ?? 1) || 1,
    },
    summary: normalizeSummary(json.summary),
  };
}

export async function getPublicCampaignFeedback(
  token: string,
): Promise<PublicCampaignFeedback> {
  const safe = token.trim();
  if (!safe) {
    throw new Error("Feedback link is invalid.");
  }
  const res = await fetch(
    `${getApiBaseUrl()}/campaign-reviews/feedback/${encodeURIComponent(safe)}`,
  );
  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Feedback link not found."),
    );
  }
  const json = (await res.json()) as Record<string, unknown>;
  const statusRaw = String(json.status ?? "pending");
  const status: PublicCampaignFeedback["status"] =
    statusRaw === "submitted" || statusRaw === "expired"
      ? statusRaw
      : "pending";
  return {
    campaignName:
      typeof json.campaignName === "string" && json.campaignName.trim()
        ? json.campaignName.trim()
        : "this campaign",
    guestName:
      typeof json.guestName === "string" && json.guestName.trim()
        ? json.guestName.trim()
        : null,
    status,
    alreadySubmitted: Boolean(json.alreadySubmitted),
    expired: Boolean(json.expired),
  };
}

export async function submitPublicCampaignFeedback(
  token: string,
  input: { rating: number; comment?: string },
): Promise<void> {
  const safe = token.trim();
  if (!safe) {
    throw new Error("Feedback link is invalid.");
  }
  const res = await fetch(
    `${getApiBaseUrl()}/campaign-reviews/feedback/${encodeURIComponent(safe)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: input.rating,
        comment: input.comment?.trim() || undefined,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not submit feedback."),
    );
  }
}
