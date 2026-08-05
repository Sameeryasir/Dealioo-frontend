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

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function getPlatformAdminOverview(): Promise<PlatformAdminOverview> {
  try {
    const { data } = await authAxios.get<PlatformAdminOverview>("/admin/overview");
    return {
      kpis: {
        totalBusinesses: num(data?.kpis?.totalBusinesses),
        activeBusinesses: num(data?.kpis?.activeBusinesses),
        totalUsers: num(data?.kpis?.totalUsers),
        newUsersToday: num(data?.kpis?.newUsersToday),
        ordersToday: num(data?.kpis?.ordersToday),
        revenueTodayCents: num(data?.kpis?.revenueTodayCents),
        businessesChangePct: num(data?.kpis?.businessesChangePct),
        activeBusinessesChangePct: num(data?.kpis?.activeBusinessesChangePct),
        usersChangePct: num(data?.kpis?.usersChangePct),
        newUsersChangePct: num(data?.kpis?.newUsersChangePct),
        ordersChangePct: num(data?.kpis?.ordersChangePct),
        revenueChangePct: num(data?.kpis?.revenueChangePct),
      },
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
      users: Array.isArray(data?.users) ? data.users : [],
    };
  } catch (error) {
    throw new Error(parseApiMessage(error, "Could not load platform overview."));
  }
}
