export const funnelQueryKeys = {
  all: ["funnel"] as const,
  campaigns: () => [...funnelQueryKeys.all, "campaigns"] as const,
  campaignsByRestaurant: (restaurantId: number, page = 1, search = "") =>
    [...funnelQueryKeys.campaigns(), restaurantId, page, search] as const,
  payments: () => [...funnelQueryKeys.all, "payments"] as const,
  paymentsByFunnel: (funnelId: number) =>
    [...funnelQueryKeys.payments(), funnelId] as const,
  eventStats: () => [...funnelQueryKeys.all, "event-stats"] as const,
  eventStatsByFunnel: (funnelId: number) =>
    [...funnelQueryKeys.eventStats(), funnelId] as const,
  analyticsOverview: () =>
    [...funnelQueryKeys.all, "analytics-overview"] as const,
  analyticsOverviewByFunnel: (funnelId: number) =>
    [...funnelQueryKeys.analyticsOverview(), funnelId] as const,
  statsMonthly: () => [...funnelQueryKeys.all, "stats-monthly"] as const,
  statsMonthlyByFunnel: (funnelId: number, months: number) =>
    [...funnelQueryKeys.statsMonthly(), funnelId, months] as const,
  analyticsMonthly: () =>
    [...funnelQueryKeys.all, "analytics-monthly"] as const,
  analyticsMonthlyByFunnel: (funnelId: number, months: number) =>
    [...funnelQueryKeys.analyticsMonthly(), funnelId, months] as const,
  dropoff: () => [...funnelQueryKeys.all, "dropoff"] as const,
  dropoffByFunnel: (funnelId: number) =>
    [...funnelQueryKeys.dropoff(), funnelId] as const,
  trafficSources: () => [...funnelQueryKeys.all, "traffic-sources"] as const,
  trafficSourcesByFunnel: (funnelId: number) =>
    [...funnelQueryKeys.trafficSources(), funnelId] as const,
};
