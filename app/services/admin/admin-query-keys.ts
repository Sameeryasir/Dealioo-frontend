import type { PlatformDashboardPeriod } from "@/app/services/admin/get-platform-dashboard";

export const adminQueryKeys = {
  all: ["admin"] as const,
  dashboard: (period: PlatformDashboardPeriod, month: string, timezone: string) =>
    [...adminQueryKeys.all, "dashboard", period, month, timezone] as const,
  users: (page: number, search: string, limit: number) =>
    [...adminQueryKeys.all, "users", page, search, limit] as const,
  businesses: (
    page: number,
    search: string,
    limit: number,
    onboarding: string,
  ) =>
    [
      ...adminQueryKeys.all,
      "businesses",
      page,
      search,
      limit,
      onboarding,
    ] as const,
  meetings: () => [...adminQueryKeys.all, "meetings"] as const,
};
