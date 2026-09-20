import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";

export type PlatformAdminKpis = {
  totalBusinesses: number;
  activeBusinesses: number;
  totalUsers: number;
  newUsersToday: number;
  ordersToday: number;
  revenueTodayCents: number;
  businessesChangePct: number;
  activeBusinessesChangePct: number;
  usersChangePct: number;
  newUsersChangePct: number;
  ordersChangePct: number;
  revenueChangePct: number;
};

export type PlatformAdminBusiness = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  email: string | null;
  phoneNumber: string | null;
  onboardingCompleted: boolean;
  stripeConnected: boolean;
  metaConnected: boolean;
  twilioConnected: boolean;
  createdAt: string;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerAvatar: string | null;
  planName: string | null;
  planSlug: string | null;
};

export type PlatformAdminUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  roleName: string | null;
  isActive: boolean;
  emailVerified: boolean;
  provider: string;
  createdAt: string;
  lastLoginAt: string | null;
  planName: string | null;
  planSlug: string | null;
};

export type PlatformAdminOverview = {
  kpis: PlatformAdminKpis;
  charts: {
    revenueLast30Days: Array<{ date: string; amountCents: number }>;
    businessesLast30Days: Array<{ date: string; count: number }>;
    subscriptionBreakdown: Array<{
      planSlug: string;
      planName: string;
      count: number;
    }>;
  };
  businesses: PlatformAdminBusiness[];
  users: PlatformAdminUser[];
};

export type PlatformAdminTrends = {
  from: string;
  to: string;
  totalRevenueCents: number;
  newBusinesses: number;
  points: Array<{
    bucket: string;
    revenueCents: number;
    businesses: number;
  }>;
};

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapPlatformAdminKpis(
  data: Partial<PlatformAdminKpis> | null | undefined,
): PlatformAdminKpis {
  return {
    totalBusinesses: num(data?.totalBusinesses),
    activeBusinesses: num(data?.activeBusinesses),
    totalUsers: num(data?.totalUsers),
    newUsersToday: num(data?.newUsersToday),
    ordersToday: num(data?.ordersToday),
    revenueTodayCents: num(data?.revenueTodayCents),
    businessesChangePct: num(data?.businessesChangePct),
    activeBusinessesChangePct: num(data?.activeBusinessesChangePct),
    usersChangePct: num(data?.usersChangePct),
    newUsersChangePct: num(data?.newUsersChangePct),
    ordersChangePct: num(data?.ordersChangePct),
    revenueChangePct: num(data?.revenueChangePct),
  };
}

export async function getPlatformAdminKpis(): Promise<PlatformAdminKpis> {
  try {
    const { data } = await authAxios.get<PlatformAdminKpis>("/admin/overview/kpis");
    return mapPlatformAdminKpis(data);
  } catch (error) {
    throw new Error(parseApiMessage(error, "Could not load platform KPIs."));
  }
}

export async function getPlatformAdminTrends(
  from: string,
  to: string,
): Promise<PlatformAdminTrends> {
  try {
    const params = new URLSearchParams({ from, to });
    const { data } = await authAxios.get<PlatformAdminTrends>(
      `/admin/overview/trends?${params.toString()}`,
    );
    return {
      from: data?.from ?? from,
      to: data?.to ?? to,
      totalRevenueCents: num(data?.totalRevenueCents),
      newBusinesses: num(data?.newBusinesses),
      points: Array.isArray(data?.points)
        ? data.points.map((point) => ({
            bucket: String(point?.bucket ?? ""),
            revenueCents: num(point?.revenueCents),
            businesses: num(point?.businesses),
          }))
        : [],
    };
  } catch (error) {
    throw new Error(parseApiMessage(error, "Could not load this date range."));
  }
}

export async function getPlatformAdminOverview(): Promise<PlatformAdminOverview> {
  try {
    const { data } = await authAxios.get<PlatformAdminOverview>("/admin/overview");
    return {
      kpis: mapPlatformAdminKpis(data?.kpis),
      charts: {
        revenueLast30Days: Array.isArray(data?.charts?.revenueLast30Days)
          ? data.charts.revenueLast30Days
          : [],
        businessesLast30Days: Array.isArray(data?.charts?.businessesLast30Days)
          ? data.charts.businessesLast30Days
          : [],
        subscriptionBreakdown: Array.isArray(data?.charts?.subscriptionBreakdown)
          ? data.charts.subscriptionBreakdown
          : [],
      },
      businesses: Array.isArray(data?.businesses) ? data.businesses : [],
      users: Array.isArray(data?.users)
        ? data.users.map((user) => ({
            ...user,
            planName: user?.planName ?? null,
            planSlug: user?.planSlug ?? null,
          }))
        : [],
    };
  } catch (error) {
    throw new Error(parseApiMessage(error, "Could not load platform overview."));
  }
}
