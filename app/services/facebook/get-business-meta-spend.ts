import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import type { DealioCampaignMetaSpend } from "@/app/services/facebook/get-dealio-campaign-meta-spend";

function asNonNegativeInt(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}

function asFiniteNumberOrNull(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function sanitizePeriod(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return /^[a-zA-Z0-9_]{1,40}$/.test(trimmed) ? trimmed : fallback;
}

function sanitizeCurrency(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(trimmed) ? trimmed : null;
}

function toPublicMetaSpend(
  payload: Record<string, unknown>,
  fallbackPeriod: string,
): DealioCampaignMetaSpend {
  return {
    period: sanitizePeriod(payload.period, fallbackPeriod),
    spend:
      typeof payload.spend === "number" && Number.isFinite(payload.spend)
        ? payload.spend
        : 0,
    currency: sanitizeCurrency(payload.currency),
    linkedMetaCampaignCount: asNonNegativeInt(payload.linkedMetaCampaignCount),
    impressions: asNonNegativeInt(payload.impressions),
    reach: asNonNegativeInt(payload.reach),
    clicks: asNonNegativeInt(payload.clicks),
    ctr: asFiniteNumberOrNull(payload.ctr),
  };
}

export async function getBusinessMetaSpend(
  businessId: number,
  period?: string,
): Promise<DealioCampaignMetaSpend> {
  if (!Number.isFinite(businessId) || businessId < 1) {
    throw new Error("Business is required.");
  }

  const params = new URLSearchParams();
  if (period?.trim()) {
    params.set("period", period.trim());
  }
  const query = params.toString();
  const path = `${getApiBaseUrl()}/facebook-campaigns/business/${encodeURIComponent(String(businessId))}/meta-spend${query ? `?${query}` : ""}`;

  const res = await authenticatedFetch(path, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load Meta ad spend."),
    );
  }

  const payload = (await res.json()) as Record<string, unknown>;
  return toPublicMetaSpend(payload, period?.trim() || "this_month");
}
