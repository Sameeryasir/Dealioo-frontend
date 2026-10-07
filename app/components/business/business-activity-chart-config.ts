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

export function resolvePeriodRevenueCents(row: ActivityMonthlyPoint): number {
  return (row.paidRevenueCents ?? 0) + (row.extraItemsRevenueCents ?? 0);
}

export function resolveOfferSalesCents(row: ActivityMonthlyPoint): number {
  return row.paidRevenueCents ?? 0;
}

export function resolveExtraItemsRevenueCents(
  row: ActivityMonthlyPoint,
): number {
  return row.extraItemsRevenueCents ?? 0;
}

export function resolveScannedCheckIns(row: ActivityMonthlyPoint): number {
  return (row.scannedVisits ?? 0) + (row.redeemedReward ?? 0);
}

export function resolveInStoreCheckIns(row: ActivityMonthlyPoint): number {
  return row.inStoreVisits ?? 0;
}

export function resolveFunnelMembers(row: ActivityMonthlyPoint): number {
  return row.funnelMembers ?? 0;
}

export function resolveRestaurantMembers(row: ActivityMonthlyPoint): number {
  return row.restaurantMembers ?? 0;
}

export function sumActivityFromMonthly(points: ActivityMonthlyPoint[]): {
  checkIns: number;
  revenueCents: number;
  offerSalesCents: number;
  extraItemsRevenueCents: number;
  scannedCheckIns: number;
  inStoreCheckIns: number;
  funnelMembers: number;
  restaurantMembers: number;
} {
  return points.reduce(
    (acc, row) => ({
      checkIns: acc.checkIns + resolveCheckIns(row),
      revenueCents: acc.revenueCents + resolvePeriodRevenueCents(row),
      offerSalesCents: acc.offerSalesCents + resolveOfferSalesCents(row),
      extraItemsRevenueCents:
        acc.extraItemsRevenueCents + resolveExtraItemsRevenueCents(row),
      scannedCheckIns: acc.scannedCheckIns + resolveScannedCheckIns(row),
      inStoreCheckIns: acc.inStoreCheckIns + resolveInStoreCheckIns(row),
      funnelMembers: acc.funnelMembers + resolveFunnelMembers(row),
      restaurantMembers:
        acc.restaurantMembers + resolveRestaurantMembers(row),
    }),
    {
      checkIns: 0,
      revenueCents: 0,
      offerSalesCents: 0,
      extraItemsRevenueCents: 0,
      scannedCheckIns: 0,
      inStoreCheckIns: 0,
      funnelMembers: 0,
      restaurantMembers: 0,
    },
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
    value: resolvePeriodRevenueCents(row),
  }));
}

export function hasCheckInsData(points: MonthlyCheckInsPoint[]): boolean {
  return points.some((row) => row.checkIns > 0);
}

export type PeakMetricPoint = {
  month: string;
  label: string;
  value: number;
};

export function findPeakMetricPoint(
  points: Array<{ month: string; label: string; value: number }>,
): PeakMetricPoint | null {
  if (points.length < 2) return null;

  let peak: PeakMetricPoint | null = null;
  for (const row of points) {
    if (row.value <= 0) continue;
    if (!peak || row.value > peak.value) {
      peak = {
        month: row.month,
        label: row.label,
        value: row.value,
      };
    }
  }
  return peak;
}

export function findPeakCheckInsDay(
  points: MonthlyCheckInsPoint[],
): PeakMetricPoint | null {
  return findPeakMetricPoint(
    points.map((row) => ({
      month: row.month,
      label: row.label,
      value: row.checkIns,
    })),
  );
}

export function findPeakRevenueDay(
  points: MonthlyRevenuePoint[],
): PeakMetricPoint | null {
  return findPeakMetricPoint(points);
}

export type PeakMonthInYear = {
  month: string;
  label: string;
  revenueCents: number;
  checkIns: number;
};

export function findPeakMonthInYear(
  points: ActivityMonthlyPoint[],
  year: number,
): PeakMonthInYear | null {
  const yearPrefix = `${year}-`;
  let peak: PeakMonthInYear | null = null;

  for (const row of points) {
    if (!row.month.startsWith(yearPrefix)) continue;

    const revenueCents = resolvePeriodRevenueCents(row);
    const checkIns = resolveCheckIns(row);
    if (revenueCents <= 0 && checkIns <= 0) continue;

    const next: PeakMonthInYear = {
      month: row.month,
      label: formatMonthLabel(row.month),
      revenueCents,
      checkIns,
    };

    if (!peak) {
      peak = next;
      continue;
    }

    // Prefer revenue; break ties with check-ins, then earlier month.
    if (
      next.revenueCents > peak.revenueCents ||
      (next.revenueCents === peak.revenueCents &&
        next.checkIns > peak.checkIns)
    ) {
      peak = next;
    }
  }

  return peak;
}
