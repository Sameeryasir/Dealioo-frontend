import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export const FUNNEL_GUESTS_PAGE_SIZE = 10;

export type FunnelGuestStatus = "new" | "returning";
export type FunnelGuestTag = "signup" | "prepaid" | "postpaid";

export type FunnelGuestRecord = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  status: FunnelGuestStatus;
  tags: FunnelGuestTag[];
  hasPayment: boolean;
  eventCount: number;
};

export type PaginatedFunnelGuestsResponse = {
  data: FunnelGuestRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function normalizeGuest(raw: unknown): FunnelGuestRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "number" ? o.id : Number(o.id);
  if (!Number.isFinite(id) || id < 1) return null;

  const status: FunnelGuestStatus =
    o.status === "returning" ? "returning" : "new";
  const tags: FunnelGuestTag[] = Array.isArray(o.tags)
    ? o.tags.filter(
        (tag): tag is FunnelGuestTag =>
          tag === "signup" || tag === "prepaid" || tag === "postpaid",
      )
    : ["signup"];

  return {
    id,
    name: typeof o.name === "string" && o.name.trim() ? o.name.trim() : "Guest",
    email: typeof o.email === "string" ? o.email : "",
    phone: typeof o.phone === "string" && o.phone.trim() ? o.phone.trim() : null,
    createdAt:
      typeof o.createdAt === "string"
        ? o.createdAt
        : o.createdAt instanceof Date
          ? o.createdAt.toISOString()
          : "",
    updatedAt:
      typeof o.updatedAt === "string"
        ? o.updatedAt
        : o.updatedAt instanceof Date
          ? o.updatedAt.toISOString()
          : "",
    status,
    tags,
    hasPayment: o.hasPayment === true,
    eventCount:
      typeof o.eventCount === "number"
        ? o.eventCount
        : Number(o.eventCount ?? 1) || 1,
  };
}

export async function getFunnelGuests(
  funnelId: number,
  page = 1,
  limit = FUNNEL_GUESTS_PAGE_SIZE,
): Promise<PaginatedFunnelGuestsResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(funnelId)) {
    throw new Error("Valid funnel id is required.");
  }

  const q = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/funnel-event/funnel/${encodeURIComponent(String(funnelId))}/guests?${q.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load funnel guests."),
    );
  }

  const json = (await res.json()) as {
    data?: unknown[];
    meta?: PaginatedFunnelGuestsResponse["meta"];
  };

  return {
    data: (json.data ?? [])
      .map(normalizeGuest)
      .filter((guest): guest is FunnelGuestRecord => guest != null),
    meta: json.meta ?? {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
  };
}
