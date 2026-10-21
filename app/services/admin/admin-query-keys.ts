import type { PlatformDashboardPeriod } from "@/app/services/admin/get-platform-dashboard";

export const adminQueryKeys = {
  all: ["admin"] as const,
  dashboard: (period: PlatformDashboardPeriod, month: string, timezone: string) =>
    [...adminQueryKeys.all, "dashboard", period, month, timezone] as const,
  users: (
    page: number,
    search: string,
    limit: number,
    tab: string,
    sort: string,
  ) => [...adminQueryKeys.all, "users", page, search, limit, tab, sort] as const,
  usersRoot: () => [...adminQueryKeys.all, "users"] as const,
  roles: () => [...adminQueryKeys.all, "roles"] as const,
  businessesRoot: () => [...adminQueryKeys.all, "businesses"] as const,
  businesses: (
    page: number,
    search: string,
    limit: number,
    onboarding: string,
  ) =>
    [
      ...adminQueryKeys.businessesRoot(),
      page,
      search,
      limit,
      onboarding,
    ] as const,
  meetingsSummary: () => [...adminQueryKeys.all, "meetings", "summary"] as const,
  meetings: (
    scope = "all",
    page = 1,
    search = "",
    limit = 10,
    sort = "meeting_asc",
  ) =>
    [
      ...adminQueryKeys.all,
      "meetings",
      scope,
      page,
      search,
      limit,
      sort,
    ] as const,
  meetingsRoot: () => [...adminQueryKeys.all, "meetings"] as const,
  customerOnboardingsRoot: () =>
    [...adminQueryKeys.all, "customer-onboardings"] as const,
  customerOnboardings: (
    page: number,
    search: string,
    limit: number,
    status: string,
    sort: string,
  ) =>
    [
      ...adminQueryKeys.customerOnboardingsRoot(),
      page,
      search,
      limit,
      status,
      sort,
    ] as const,
  customerOnboarding: (id: number) =>
    [...adminQueryKeys.customerOnboardingsRoot(), id] as const,
  subscriptionPlansRoot: () =>
    [...adminQueryKeys.all, "subscription-plans"] as const,
  subscriptionPlans: () => [...adminQueryKeys.subscriptionPlansRoot()] as const,
  subscriptionsRoot: () => [...adminQueryKeys.all, "subscriptions"] as const,
  subscriptions: (page: number, search: string, limit: number) =>
    [...adminQueryKeys.subscriptionsRoot(), page, search, limit] as const,
  twilioDashboardRoot: () =>
    [...adminQueryKeys.all, "twilio", "dashboard", "v3"] as const,
  twilioDashboard: (page: number, limit: number) =>
    [...adminQueryKeys.twilioDashboardRoot(), page, limit] as const,
};
