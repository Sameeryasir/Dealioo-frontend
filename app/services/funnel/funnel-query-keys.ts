export const funnelQueryKeys = {
  all: ["funnel"] as const,
  campaigns: () => [...funnelQueryKeys.all, "campaigns"] as const,
  campaignsByRestaurant: (restaurantId: number) =>
    [...funnelQueryKeys.campaigns(), restaurantId] as const,
  payments: () => [...funnelQueryKeys.all, "payments"] as const,
  paymentsByFunnel: (funnelId: number) =>
    [...funnelQueryKeys.payments(), funnelId] as const,
  eventStats: () => [...funnelQueryKeys.all, "event-stats"] as const,
  eventStatsByFunnel: (funnelId: number) =>
    [...funnelQueryKeys.eventStats(), funnelId] as const,
};
