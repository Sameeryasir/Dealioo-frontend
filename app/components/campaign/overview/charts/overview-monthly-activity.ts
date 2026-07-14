import type { FunnelAnalyticsMonthlyPoint } from "@/app/services/funnel/get-analytics-overview-monthly";
import type { FunnelStatsMonthlyPoint } from "@/app/services/funnel/get-funnel-stats-monthly";

export function hasAnalyticsMonthlyActivity(
  points: FunnelAnalyticsMonthlyPoint[],
): boolean {
  return points.some(
    (row) =>
      row.pageViews > 0 ||
      row.buttonClicks > 0 ||
      row.uniqueVisitors > 0 ||
      row.checkoutOpens > 0,
  );
}

export function hasStatsMonthlyActivity(
  points: FunnelStatsMonthlyPoint[],
): boolean {
  return points.some(
    (row) => row.signups > 0 || row.payments > 0 || row.revenue > 0,
  );
}
