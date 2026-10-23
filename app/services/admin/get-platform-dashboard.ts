import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";

export type PlatformDashboardPeriod = "today" | "week" | "month" | "year";

export type PlatformDashboardKpi = {
  value: number;
  changePct: number;
  sparkline: number[];
  hint: string;
};

export type PlatformDashboardPanel = {
  period: PlatformDashboardPeriod;
  label: string;
  from: string;
  to: string;
  /** False for past months — cards show activity in that range, not live totals. */
  isCurrentPeriod: boolean;
  kpis: {
    mrr: PlatformDashboardKpi;
    planEarnings: PlatformDashboardKpi;
    platformUsers: PlatformDashboardKpi;
    payingSubscriptions: PlatformDashboardKpi;
    newPlans: PlatformDashboardKpi;
    newUsers: PlatformDashboardKpi;
    activeBusinesses: PlatformDashboardKpi;
    onboardingCompletedPct: PlatformDashboardKpi;
    meetingsBooked: PlatformDashboardKpi;
    meetingsAttended: PlatformDashboardKpi;
    dealsWon: PlatformDashboardKpi;
    readyToCreate: PlatformDashboardKpi;
    conversionRate: PlatformDashboardKpi;
  };
  charts: {
    planEarnings: Array<{ label: string; value: number }>;
    subscriptions: Array<{ label: string; value: number }>;
    users: Array<{ label: string; value: number }>;
    businesses: Array<{ label: string; value: number }>;
    onboardingCompleted: Array<{ label: string; value: number }>;
    meetingsBooked: Array<{ label: string; value: number }>;
    meetingsAttended: Array<{ label: string; value: number }>;
    dealsWon: Array<{ label: string; value: number }>;
  };
  regions: Array<{ region: string; count: number; sharePct: number }>;
};

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapKpi(raw: Partial<PlatformDashboardKpi> | null | undefined): PlatformDashboardKpi {
  return {
    value: num(raw?.value),
    changePct: num(raw?.changePct),
    sparkline: Array.isArray(raw?.sparkline)
      ? raw.sparkline.map((point) => num(point))
      : [],
    hint: String(raw?.hint ?? ""),
  };
}

function mapSeries(
  rows: Array<{ label?: string; value?: number }> | null | undefined,
): Array<{ label: string; value: number }> {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    label: String(row?.label ?? ""),
    value: num(row?.value),
  }));
}

export async function getPlatformDashboardPanel(input: {
  period: PlatformDashboardPeriod;
  month?: string;
  timezone?: string;
}): Promise<PlatformDashboardPanel> {
  try {
    const params = new URLSearchParams({ period: input.period });
    if (input.month?.trim()) params.set("month", input.month.trim());
    if (input.timezone?.trim()) params.set("timezone", input.timezone.trim());

    const { data } = await authAxios.get<PlatformDashboardPanel>(
      `/admin/overview/dashboard?${params.toString()}`,
    );

    return {
      period: data?.period ?? input.period,
      label: String(data?.label ?? ""),
      from: String(data?.from ?? ""),
      to: String(data?.to ?? ""),
      isCurrentPeriod: data?.isCurrentPeriod !== false,
      kpis: {
        mrr: mapKpi(data?.kpis?.mrr),
        planEarnings: mapKpi(data?.kpis?.planEarnings),
        platformUsers: mapKpi(data?.kpis?.platformUsers),
        payingSubscriptions: mapKpi(data?.kpis?.payingSubscriptions),
        newPlans: mapKpi(data?.kpis?.newPlans),
        newUsers: mapKpi(data?.kpis?.newUsers),
        activeBusinesses: mapKpi(data?.kpis?.activeBusinesses),
        onboardingCompletedPct: mapKpi(data?.kpis?.onboardingCompletedPct),
        meetingsBooked: mapKpi(data?.kpis?.meetingsBooked),
        meetingsAttended: mapKpi(data?.kpis?.meetingsAttended),
        dealsWon: mapKpi(data?.kpis?.dealsWon),
        readyToCreate: mapKpi(data?.kpis?.readyToCreate),
        conversionRate: mapKpi(data?.kpis?.conversionRate),
      },
      charts: {
        planEarnings: mapSeries(data?.charts?.planEarnings),
        subscriptions: mapSeries(data?.charts?.subscriptions),
        users: mapSeries(data?.charts?.users),
        businesses: mapSeries(data?.charts?.businesses),
        onboardingCompleted: mapSeries(data?.charts?.onboardingCompleted),
        meetingsBooked: mapSeries(data?.charts?.meetingsBooked),
        meetingsAttended: mapSeries(data?.charts?.meetingsAttended),
        dealsWon: mapSeries(data?.charts?.dealsWon),
      },
      regions: Array.isArray(data?.regions)
        ? data.regions.map((row) => ({
            region: String(row?.region ?? "Other"),
            count: num(row?.count),
            sharePct: num(row?.sharePct),
          }))
        : [],
    };
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not load the platform overview panel."),
    );
  }
}
