import {
  getApiBaseUrl,
  parseApiErrorMessage,
} from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export type FunnelStatsMonthlyPoint = {
  month: string;
  signups: number;
  payments: number;
  signupOnly: number;
  paidAfterSignup: number;
  revenue: number;
};

export type FunnelStatsMonthly = {
  funnelId: number;
  months: number;
  currency: string | null;
  data: FunnelStatsMonthlyPoint[];
};

export async function getFunnelStatsMonthly(
  funnelId: number,
  options: number | { months?: number; from?: string; to?: string } = 6,
): Promise<FunnelStatsMonthly> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(funnelId)) {
    throw new Error("Valid funnel id is required.");
  }

  const q = new URLSearchParams();
  const range = typeof options === "number" ? { months: options } : options;
  if (range.from && range.to) {
    q.set("from", range.from);
    q.set("to", range.to);
  } else {
    q.set("months", String(range.months ?? 6));
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/funnel-event/funnel/${encodeURIComponent(String(funnelId))}/stats/monthly?${q.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load monthly funnel stats."),
    );
  }

  return (await res.json()) as FunnelStatsMonthly;
}
