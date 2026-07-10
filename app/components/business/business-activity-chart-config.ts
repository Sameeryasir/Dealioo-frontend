import { formatMonthLabel } from "@/app/components/campaign/overview/charts/overview-chart-config";
import type { ActivityMonthlyPoint } from "@/app/services/activity/get-business-activity";

export type MonthlyMetricBarPoint = {
  month: string;
  label: string;
  value: number;
};

export type MonthlyCheckInsPoint = MonthlyMetricBarPoint & {
  checkIns: number;
};

export type MonthlyRevenuePoint = {
  month: string;
  label: string;
  value: number;
};

export function resolveCheckIns(row: ActivityMonthlyPoint): number {
  if (typeof row.checkIns === "number") {
    return row.checkIns;
  }
  return row.visited + row.redeemedReward;
}

export function sumActivityFromMonthly(points: ActivityMonthlyPoint[]): {
  checkIns: number;
  revenueCents: number;
} {
  return points.reduce(
    (acc, row) => ({
      checkIns: acc.checkIns + resolveCheckIns(row),
      revenueCents: acc.revenueCents + row.prepaidRevenueCents,
    }),
    { checkIns: 0, revenueCents: 0 },
  );
}

export function hasBusinessActivityMonthly(
  points: ActivityMonthlyPoint[],
  options: {
    activeCampaigns?: number;
    totalOrders?: number;
    totalMembers?: number;
    todayRevenueCents?: number;
  } = {},
): boolean {
  const totals = sumActivityFromMonthly(points);
  return (
    totals.checkIns > 0 ||
    totals.revenueCents > 0 ||
    (options.activeCampaigns ?? 0) > 0 ||
    (options.totalOrders ?? 0) > 0 ||
    (options.totalMembers ?? 0) > 0 ||
    (options.todayRevenueCents ?? 0) > 0
  );
}

export function buildCheckInsMonthlyData(
  points: ActivityMonthlyPoint[],
): MonthlyCheckInsPoint[] {
  return points.map((row) => ({
    month: row.month,
    label: formatMonthLabel(row.month),
    value: resolveCheckIns(row),
    checkIns: resolveCheckIns(row),
  }));
}

export function buildOrdersMonthlyData(
  points: ActivityMonthlyPoint[],
): MonthlyMetricBarPoint[] {
  return points.map((row) => ({
    month: row.month,
    label: formatMonthLabel(row.month),
    value: row.orders ?? 0,
  }));
}

export function buildMembersMonthlyData(
  points: ActivityMonthlyPoint[],
): MonthlyMetricBarPoint[] {
  return points.map((row) => ({
    month: row.month,
    label: formatMonthLabel(row.month),
    value: row.members ?? 0,
  }));
}

export function buildRevenueMonthlyData(
  points: ActivityMonthlyPoint[],
): MonthlyRevenuePoint[] {
  return points.map((row) => ({
    month: row.month,
    label: formatMonthLabel(row.month),
    value: row.prepaidRevenueCents,
  }));
}

export function hasCheckInsData(points: MonthlyCheckInsPoint[]): boolean {
  return points.some((row) => row.checkIns > 0);
}
