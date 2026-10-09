export const adsStatsQueryKeys = {
  all: ["ads-stats"] as const,
  meta: () => [...adsStatsQueryKeys.all, "meta"] as const,
  metaCampaignStats: (
    businessId: number,
    options: {
      period: string;
      page: number;
      pageSize: number;
      query: string;
    },
  ) =>
    [
      ...adsStatsQueryKeys.meta(),
      "campaign-stats",
      businessId,
      options.period,
      options.page,
      options.pageSize,
      options.query,
    ] as const,
  google: () => [...adsStatsQueryKeys.all, "google"] as const,
  googleCampaignStats: (
    businessId: number,
    options: { period: string },
  ) =>
    [
      ...adsStatsQueryKeys.google(),
      "campaign-stats",
      businessId,
      options.period,
    ] as const,
  facebookConnection: (businessId: number) =>
    ["facebook-connection", businessId] as const,
};

export const businessActivityQueryKeys = {
  all: ["business-activity"] as const,
  dashboardSummary: (
    businessId: number,
    options: {
      from: string;
      to: string;
      previousFrom: string | null;
      previousTo: string | null;
      timezone: string;
    },
  ) =>
    [
      ...businessActivityQueryKeys.all,
      "dashboard-summary",
      businessId,
      options.from,
      options.to,
      options.previousFrom,
      options.previousTo,
      options.timezone,
    ] as const,
  yearPeak: (businessId: number, year: number) =>
    [...businessActivityQueryKeys.all, "year-peak", businessId, year] as const,
};
