import type { FunnelAnalyticsMonthlyPoint } from "@/app/services/funnel/get-analytics-overview-monthly";
import type { FunnelEventStats } from "@/app/services/funnel/get-funnel-event-stats";
import type { FunnelStatsMonthlyPoint } from "@/app/services/funnel/get-funnel-stats-monthly";

export const OVERVIEW_MONTH_COUNT = 6;

export type ChartNameValue = {
  name: string;
  value: number;
};

export type MonthlySignupsPaymentsPoint = {
  month: string;
  label: string;
  signups: number;
  payments: number;
};

export type MonthlyMetricPoint = {
  month: string;
  label: string;
  value: number;
};

export const OVERVIEW_CHART_COLORS = {
  green: "#34a853",
  blue: "#1877f2",
  orange: "#f77737",
  pink: "#e1306c",
  slate: "#64748b",
} as const;

export const OVERVIEW_MINI_LINE_CHART_MARGIN = {
  top: 16,
  right: 8,
  left: 8,
  bottom: 0,
};

export const OVERVIEW_BAR_CHART_MARGIN = {
  top: 8,
  right: 12,
  left: 8,
  bottom: 8,
};

export function shortenMonthAxisLabel(label: string): string {
  return label.split(" ")[0] ?? label;
}

export function formatMonthLabel(monthKey: string): string {
  const [yearRaw, monthRaw] = monthKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return monthKey;
  }
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function computeConversionRate(stats: FunnelEventStats): number {
  if (stats.signups <= 0) return 0;
  return (stats.payments / stats.signups) * 100;
}

export function sumStatsFromMonthly(points: FunnelStatsMonthlyPoint[]): {
  signups: number;
  payments: number;
  revenue: number;
} {
  return points.reduce(
    (acc, row) => ({
      signups: acc.signups + row.signups,
      payments: acc.payments + row.payments,
      revenue: acc.revenue + row.revenue,
    }),
    { signups: 0, payments: 0, revenue: 0 },
  );
}

export function computeConversionRateFromMonthly(
  points: FunnelStatsMonthlyPoint[],
): number {
  const totals = sumStatsFromMonthly(points);
  if (totals.signups <= 0) return 0;
  return (totals.payments / totals.signups) * 100;
}

export function sumAnalyticsFromMonthly(points: FunnelAnalyticsMonthlyPoint[]): {
  pageViews: number;
  buttonClicks: number;
  uniqueVisitors: number;
  sessions: number;
} {
  return points.reduce(
    (acc, row) => ({
      pageViews: acc.pageViews + row.pageViews,
      buttonClicks: acc.buttonClicks + row.buttonClicks,
      uniqueVisitors: acc.uniqueVisitors + row.uniqueVisitors,
      sessions: acc.sessions + row.sessions,
    }),
    { pageViews: 0, buttonClicks: 0, uniqueVisitors: 0, sessions: 0 },
  );
}

export function hasMonthlyStatsActivity(points: FunnelStatsMonthlyPoint[]): boolean {
  const totals = sumStatsFromMonthly(points);
  return totals.signups > 0 || totals.payments > 0 || totals.revenue > 0;
}

export function buildSignupsPaymentsMonthlyData(
  points: FunnelStatsMonthlyPoint[],
): MonthlySignupsPaymentsPoint[] {
  return points.map((row) => ({
    month: row.month,
    label: formatMonthLabel(row.month),
    signups: row.signups,
    payments: row.payments,
  }));
}

export function sumSignupBreakdownFromMonthly(points: FunnelStatsMonthlyPoint[]): {
  signupOnly: number;
  paidAfterSignup: number;
} {
  return points.reduce(
    (acc, row) => ({
      signupOnly: acc.signupOnly + row.signupOnly,
      paidAfterSignup: acc.paidAfterSignup + row.paidAfterSignup,
    }),
    { signupOnly: 0, paidAfterSignup: 0 },
  );
}

export function buildSignupBreakdownFromMonthly(
  points: FunnelStatsMonthlyPoint[],
): ChartNameValue[] {
  const totals = sumSignupBreakdownFromMonthly(points);
  return [
    { name: "Signup Only", value: totals.signupOnly },
    { name: "Paid After Signup", value: totals.paidAfterSignup },
  ];
}

export function buildAnalyticsMonthlySeries(
  points: FunnelAnalyticsMonthlyPoint[],
  key: "pageViews" | "buttonClicks" | "uniqueVisitors" | "sessions",
): MonthlyMetricPoint[] {
  return points.map((row) => ({
    month: row.month,
    label: formatMonthLabel(row.month),
    value: row[key],
  }));
}

export function hasSignupBreakdownData(data: ChartNameValue[]): boolean {
  return data.some((row) => row.value > 0);
}
